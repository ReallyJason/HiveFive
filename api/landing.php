<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db_config.php';
cors();
require_method('GET');

$stats = [];

// Total active services
$stmt = $pdo->query('SELECT COUNT(*) as count FROM services WHERE is_active = 1');
$stats['total_services'] = (int) $stmt->fetch()['count'];

// Total providers (users who have at least one service)
$stmt = $pdo->query('SELECT COUNT(DISTINCT provider_id) as count FROM services WHERE is_active = 1');
$stats['total_providers'] = (int) $stmt->fetch()['count'];

// Total universities
$stmt = $pdo->query("SELECT COUNT(DISTINCT university) as count FROM users WHERE university != ''");
$stats['total_universities'] = (int) $stmt->fetch()['count'];

// Total completed orders
$stmt = $pdo->query("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
$stats['total_completed'] = (int) $stmt->fetch()['count'];

// Category breakdown (count of active services per category)
$stmt = $pdo->query('SELECT category, COUNT(*) as count FROM services WHERE is_active = 1 GROUP BY category ORDER BY count DESC');
$stats['categories'] = array_map(fn($r) => [
    'name'  => $r['category'],
    'count' => (int) $r['count'],
], $stmt->fetchAll());

// Featured services (top 6 by rating, with thumbnail)
$stmt = $pdo->query(
    'SELECT s.id, s.title, s.category, s.price, s.pricing_type, s.avg_rating, s.review_count,
            u.first_name, u.last_name, u.username,
            (SELECT si.image_url FROM service_images si WHERE si.service_id = s.id ORDER BY si.sort_order LIMIT 1) AS thumbnail
     FROM services s
     JOIN users u ON s.provider_id = u.id
     WHERE s.is_active = 1 AND u.deactivated_at IS NULL
     ORDER BY s.avg_rating DESC, s.review_count DESC
     LIMIT 6'
);
$stats['featured_services'] = $stmt->fetchAll();
foreach ($stats['featured_services'] as &$s) {
    $s['id'] = (int) $s['id'];
    $s['price'] = (float) $s['price'];
    $s['avg_rating'] = (float) $s['avg_rating'];
    $s['review_count'] = (int) $s['review_count'];
    $s['thumbnail'] = public_asset_url($s['thumbnail'] ?? null);
}

json_response($stats);
