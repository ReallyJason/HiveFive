<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$service_id  = $_GET['service_id'] ?? null;
$provider_id = $_GET['provider_id'] ?? null;

if (!$service_id && !$provider_id) {
    json_response(['error' => 'Missing required parameter: service_id or provider_id'], 400);
}

$page   = max(1, (int) ($_GET['page'] ?? 1));
$limit  = min(50, max(1, (int) ($_GET['limit'] ?? 10)));
$offset = ($page - 1) * $limit;

// Build WHERE clause based on filter
$where_field = $service_id ? 'r.service_id' : 'r.provider_id';
$where_value = (int) ($service_id ?: $provider_id);

// Count total reviews
$count_stmt = $pdo->prepare("SELECT COUNT(*) as total FROM reviews r WHERE $where_field = :filter_id");
$count_stmt->execute(['filter_id' => $where_value]);
$total = (int) $count_stmt->fetch()['total'];

// Fetch paginated reviews with reviewer info
$stmt = $pdo->prepare(
    "SELECT r.id, r.order_id, r.service_id, r.rating, r.comment, r.helpful_count, r.created_at,
            u.id AS reviewer_id, u.first_name AS reviewer_first_name, u.last_name AS reviewer_last_name,
            u.username, u.profile_image,
            COALESCE(s.title, req.title, 'Custom Request') AS service_title
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.id
     LEFT JOIN services s ON r.service_id = s.id
     LEFT JOIN orders o ON r.order_id = o.id
     LEFT JOIN requests req ON o.request_id = req.id
     WHERE $where_field = :filter_id
     ORDER BY r.created_at DESC
     LIMIT :lim OFFSET :off"
);
$stmt->bindValue('filter_id', $where_value, PDO::PARAM_INT);
$stmt->bindValue('lim', $limit, PDO::PARAM_INT);
$stmt->bindValue('off', $offset, PDO::PARAM_INT);
$stmt->execute();
$reviews = $stmt->fetchAll();

// Cast numeric fields
foreach ($reviews as &$rev) {
    $rev['id']            = (int) $rev['id'];
    $rev['order_id']      = (int) $rev['order_id'];
    $rev['reviewer_id']   = (int) $rev['reviewer_id'];
    $rev['rating']        = (int) $rev['rating'];
    $rev['helpful_count'] = (int) $rev['helpful_count'];
}

json_response([
    'reviews'    => $reviews,
    'pagination' => [
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $total,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
