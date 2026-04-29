<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

$stmt = $pdo->prepare(
    'SELECT s.*,
            (SELECT COUNT(*) FROM orders o WHERE o.service_id = s.id) AS total_orders,
            (SELECT COUNT(*) FROM orders o WHERE o.service_id = s.id AND o.status = \'completed\') AS completed_orders,
            (SELECT COALESCE(SUM(o.price), 0) FROM orders o WHERE o.service_id = s.id AND o.status = \'completed\') AS total_earned
     FROM services s
     WHERE s.provider_id = ?
     ORDER BY s.created_at DESC'
);
$stmt->execute([$user_id]);
$services = $stmt->fetchAll();

foreach ($services as &$s) {
    $s['id']               = (int) $s['id'];
    $s['provider_id']      = (int) $s['provider_id'];
    $s['price']            = (float) $s['price'];
    $s['avg_rating']       = (float) $s['avg_rating'];
    $s['review_count']     = (int) $s['review_count'];
    $s['is_active']        = (bool) $s['is_active'];
    $s['included']         = json_decode($s['included'], true);
    $s['total_orders']     = (int) $s['total_orders'];
    $s['completed_orders'] = (int) $s['completed_orders'];
    $s['total_earned']     = (float) $s['total_earned'];
}

json_response(['services' => $services]);
