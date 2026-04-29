<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_admin();
require_method('GET');

$status = $_GET['status'] ?? '';
$search = trim($_GET['search'] ?? '');
$period = $_GET['period'] ?? '';
$page   = max(1, (int) ($_GET['page'] ?? 1));
$limit  = 25;
$offset = ($page - 1) * $limit;

$base_from = "FROM orders o
        LEFT JOIN services s ON o.service_id = s.id
        LEFT JOIN requests r ON o.request_id = r.id
        JOIN users buyer  ON o.client_id   = buyer.id
        JOIN users seller ON o.provider_id = seller.id";

$conditions = [];
$params     = [];

// Status filter
if ($status) {
    $valid = ['pending','in_progress','awaiting_completion','completed','cancelled','disputed'];
    if (in_array($status, $valid, true)) {
        $conditions[] = 'o.status = ?';
        $params[]     = $status;
    }
}

// Search filter
if ($search !== '') {
    $like = '%' . $search . '%';
    $conditions[] = '(s.title LIKE ? OR r.title LIKE ? OR buyer.first_name LIKE ? OR buyer.last_name LIKE ? OR buyer.username LIKE ? OR seller.first_name LIKE ? OR seller.last_name LIKE ? OR seller.username LIKE ? OR CAST(o.id AS CHAR) = ?)';
    $params = array_merge($params, [$like, $like, $like, $like, $like, $like, $like, $like, $search]);
}

// Time period filter
if ($period === '7d') {
    $conditions[] = 'o.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
} elseif ($period === '30d') {
    $conditions[] = 'o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
} elseif ($period === '90d') {
    $conditions[] = 'o.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
}

$where = '';
if (!empty($conditions)) {
    $where = ' WHERE ' . implode(' AND ', $conditions);
}

// Count total for pagination
$count_sql = "SELECT COUNT(*) " . $base_from . $where;
$count_stmt = $pdo->prepare($count_sql);
$count_stmt->execute($params);
$total = (int) $count_stmt->fetchColumn();

// Fetch page
$sql = "SELECT o.id, o.service_id, o.request_id, o.client_id, o.provider_id,
               o.pricing_type_snapshot, o.unit_label_snapshot, o.unit_rate, o.requested_units, o.authorized_units, o.actual_units,
               o.status, o.price, o.service_fee, o.total,
               o.settlement_subtotal, o.settlement_service_fee, o.settlement_total, o.refunded_amount,
               o.tip_amount,
               o.created_at, o.completed_at, o.tipped_at,
               s.title AS service_title,
               s.category AS service_category,
               r.title AS request_title,
               buyer.first_name  AS buyer_first_name,
               buyer.last_name   AS buyer_last_name,
               buyer.username    AS buyer_username,
               buyer.profile_image AS buyer_image,
               seller.first_name AS seller_first_name,
               seller.last_name  AS seller_last_name,
               seller.username   AS seller_username,
               seller.profile_image AS seller_image
        " . $base_from . $where . " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";

$params[] = $limit;
$params[] = $offset;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$orders = $stmt->fetchAll();

foreach ($orders as &$o) {
    $o['id']          = (int) $o['id'];
    $o['service_id']  = $o['service_id'] ? (int) $o['service_id'] : null;
    $o['request_id']  = $o['request_id'] ? (int) $o['request_id'] : null;
    $o['client_id']   = (int) $o['client_id'];
    $o['provider_id'] = (int) $o['provider_id'];
    $o['unit_rate']   = isset($o['unit_rate']) ? (float) $o['unit_rate'] : (float) $o['price'];
    $o['requested_units'] = isset($o['requested_units']) ? (float) $o['requested_units'] : 1.0;
    $o['authorized_units'] = isset($o['authorized_units']) ? (float) $o['authorized_units'] : 1.0;
    $o['actual_units'] = isset($o['actual_units']) && $o['actual_units'] !== null ? (float) $o['actual_units'] : null;
    $o['price']       = (float) $o['price'];
    $o['service_fee'] = (float) $o['service_fee'];
    $o['total']       = (float) $o['total'];
    $o['settlement_subtotal'] = isset($o['settlement_subtotal']) && $o['settlement_subtotal'] !== null ? (float) $o['settlement_subtotal'] : null;
    $o['settlement_service_fee'] = isset($o['settlement_service_fee']) && $o['settlement_service_fee'] !== null ? (float) $o['settlement_service_fee'] : null;
    $o['settlement_total'] = isset($o['settlement_total']) && $o['settlement_total'] !== null ? (float) $o['settlement_total'] : null;
    $o['refunded_amount'] = isset($o['refunded_amount']) ? (float) $o['refunded_amount'] : 0.0;
    $o['tip_amount']  = isset($o['tip_amount']) ? (float) $o['tip_amount'] : 0.0;

    if (empty($o['service_title'])) {
        $o['service_title'] = $o['request_title'] ?? 'Custom Request';
    }
    if (empty($o['service_category'])) {
        $o['service_category'] = 'request';
    }
    unset($o['request_title']);
}

json_response([
    'orders' => $orders,
    'total'  => $total,
    'page'   => $page,
    'pages'  => (int) ceil($total / $limit),
]);
