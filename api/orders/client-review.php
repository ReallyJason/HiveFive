<?php
/**
 * Provider → Client review endpoint.
 * Mirrors review.php but lets the provider rate the client.
 */
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

// Only the provider can leave a client review
if ((int) $order['provider_id'] !== $user_id) {
    json_response(['error' => 'Only the provider can rate the client'], 403);
}

// Order must be completed
if ($order['status'] !== 'completed') {
    json_response(['error' => 'You can only review a completed order'], 400);
}

// Check for existing client review (UNIQUE on order_id)
$stmt = $pdo->prepare('SELECT id FROM client_reviews WHERE order_id = ?');
$stmt->execute([$order_id]);
if ($stmt->fetch()) {
    json_response(['error' => 'A client review already exists for this order'], 409);
}

$service_id = $order['service_id'] ? (int) $order['service_id'] : null;
$client_id  = (int) $order['client_id'];

// Insert the client review
$stmt = $pdo->prepare(
    'INSERT INTO client_reviews (order_id, service_id, reviewer_id, client_id, rating, comment)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$order_id, $service_id, $user_id, $client_id, $rating, $comment ?: null]);
$review_id = (int) $pdo->lastInsertId();

// Notify the client
$reviewer_stmt = $pdo->prepare('SELECT first_name, last_name FROM users WHERE id = ?');
$reviewer_stmt->execute([$user_id]);
$reviewer = $reviewer_stmt->fetch();
$reviewer_name = $reviewer['first_name'] . ' ' . $reviewer['last_name'];

$stars = str_repeat('★', $rating) . str_repeat('☆', 5 - $rating);
create_notification(
    $pdo, $client_id, 'review',
    'New client review received',
    "{$reviewer_name} left a {$stars} review on your work as a client",
    "/orders/{$order_id}",
    $user_id
);

// Fetch the created review
$stmt = $pdo->prepare('SELECT * FROM client_reviews WHERE id = ?');
$stmt->execute([$review_id]);
$review = $stmt->fetch();

$review['id']          = (int) $review['id'];
$review['order_id']    = (int) $review['order_id'];
$review['service_id']  = $review['service_id'] ? (int) $review['service_id'] : null;
$review['reviewer_id'] = (int) $review['reviewer_id'];
$review['client_id']   = (int) $review['client_id'];
$review['rating']      = (int) $review['rating'];

json_response(['review' => $review], 201);
