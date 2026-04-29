<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$body = get_json_body();

$order_id = (int) ($body['order_id'] ?? 0);
$rating   = (int) ($body['rating'] ?? 0);
$comment  = trim($body['comment'] ?? '');

if (!$order_id || !$rating) {
    json_response(['error' => 'order_id and rating are required'], 400);
}

if ($rating < 1 || $rating > 5) {
    json_response(['error' => 'rating must be between 1 and 5'], 400);
}

// Length validation
if ($comment !== '' && mb_strlen($comment) > 1000) {
    json_response(['error' => 'Comment must be 1,000 characters or less'], 400);
}

// Fetch the order
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$order_id]);
$order = $stmt->fetch();

if (!$order) {
    json_response(['error' => 'Order not found'], 404);
}

// Only the client can leave a review
if ((int) $order['client_id'] !== $user_id) {
    json_response(['error' => 'Only the buyer can leave a review'], 403);
}

// Order must be completed
if ($order['status'] !== 'completed') {
    json_response(['error' => 'You can only review a completed order'], 400);
}

// Check for existing review (UNIQUE on order_id)
$stmt = $pdo->prepare('SELECT id FROM reviews WHERE order_id = ?');
$stmt->execute([$order_id]);
if ($stmt->fetch()) {
    json_response(['error' => 'A review already exists for this order'], 409);
}

$service_id  = $order['service_id'] ? (int) $order['service_id'] : null;
$provider_id = (int) $order['provider_id'];

$pdo->beginTransaction();

try {
    // Insert the review
    $stmt = $pdo->prepare(
        'INSERT INTO reviews (order_id, service_id, reviewer_id, provider_id, rating, comment)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$order_id, $service_id, $user_id, $provider_id, $rating, $comment ?: null]);
    $review_id = (int) $pdo->lastInsertId();

    // Update service avg_rating and review_count (only for service-based orders)
    if ($service_id) {
        $stmt = $pdo->prepare(
            'UPDATE services
             SET avg_rating    = (SELECT AVG(rating) FROM reviews WHERE service_id = ?),
                 review_count  = (SELECT COUNT(*)     FROM reviews WHERE service_id = ?)
             WHERE id = ?'
        );
        $stmt->execute([$service_id, $service_id, $service_id]);
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    json_response(['error' => 'Failed to submit review. Please try again.'], 500);
}

// Notify provider about the review
$reviewer_stmt = $pdo->prepare('SELECT first_name, last_name FROM users WHERE id = ?');
$reviewer_stmt->execute([$user_id]);
$reviewer = $reviewer_stmt->fetch();
$reviewer_name = $reviewer['first_name'] . ' ' . $reviewer['last_name'];

if ($service_id) {
    $svc_stmt = $pdo->prepare('SELECT title FROM services WHERE id = ?');
    $svc_stmt->execute([$service_id]);
    $svc_title = $svc_stmt->fetchColumn() ?: 'a service';
} else {
    // Proposal-based order — use request title
    $req_stmt = $pdo->prepare('SELECT title FROM requests WHERE id = ?');
    $req_stmt->execute([(int) $order['request_id']]);
    $svc_title = $req_stmt->fetchColumn() ?: 'a request';
}

$stars = str_repeat('★', $rating) . str_repeat('☆', 5 - $rating);
create_notification(
    $pdo, $provider_id, 'review',
    'New review received',
    "{$reviewer_name} left a {$stars} review on \"{$svc_title}\"",
    "/provider?id={$provider_id}",
    $user_id
);

// Fetch the created review
$stmt = $pdo->prepare('SELECT * FROM reviews WHERE id = ?');
$stmt->execute([$review_id]);
$review = $stmt->fetch();

$review['id']            = (int) $review['id'];
$review['order_id']      = (int) $review['order_id'];
$review['service_id']    = $review['service_id'] ? (int) $review['service_id'] : null;
$review['reviewer_id']   = (int) $review['reviewer_id'];
$review['provider_id']   = (int) $review['provider_id'];
$review['rating']        = (int) $review['rating'];
$review['helpful_count'] = (int) $review['helpful_count'];

json_response(['review' => $review], 201);
