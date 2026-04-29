<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_admin();
require_method('GET');

$period = $_GET['period'] ?? '30d';

switch ($period) {
    case '7d':  $days = 7;     break;
    case '30d': $days = 30;    break;
    case '90d': $days = 90;    break;
    case 'all': $days = 99999; break;
    default:    $days = 30;    break;
}

$date_filter = $days < 99999;

// Service fees total (only count released payments, not refunded)
$sql = "SELECT COALESCE(SUM(service_fee), 0) FROM orders WHERE status = 'completed' AND payment_status = 'released'";
if ($date_filter) $sql .= " AND completed_at >= DATE_SUB(NOW(), INTERVAL $days DAY)";
$service_fees_total = (float) $pdo->query($sql)->fetchColumn();

// Shop revenue total
$sql = "SELECT COALESCE(SUM(price_paid), 0) FROM shop_purchases";
if ($date_filter) $sql .= " WHERE created_at >= DATE_SUB(NOW(), INTERVAL $days DAY)";
$shop_revenue_total = (float) $pdo->query($sql)->fetchColumn();

// Avg order value
$sql = "SELECT COALESCE(AVG(total), 0) FROM orders WHERE status = 'completed' AND payment_status = 'released'";
if ($date_filter) $sql .= " AND completed_at >= DATE_SUB(NOW(), INTERVAL $days DAY)";
$avg_order_value = round((float) $pdo->query($sql)->fetchColumn(), 2);

// Daily chart data — service fees
$sql = "SELECT DATE(completed_at) AS day, COALESCE(SUM(service_fee), 0) AS total
        FROM orders
        WHERE status = 'completed' AND payment_status = 'released'";
if ($date_filter) $sql .= " AND completed_at >= DATE_SUB(NOW(), INTERVAL $days DAY)";
$sql .= " GROUP BY DATE(completed_at) ORDER BY day ASC";
$daily_fees = $pdo->query($sql)->fetchAll();

// Daily chart data — shop purchases
$sql = "SELECT DATE(created_at) AS day, COALESCE(SUM(price_paid), 0) AS total
        FROM shop_purchases";
if ($date_filter) $sql .= " WHERE created_at >= DATE_SUB(NOW(), INTERVAL $days DAY)";
$sql .= " GROUP BY DATE(created_at) ORDER BY day ASC";
$daily_shop = $pdo->query($sql)->fetchAll();

// Top 10 shop items by revenue
$sql = "SELECT si.id, si.name, si.type, COALESCE(SUM(sp.price_paid), 0) AS revenue,
               COUNT(sp.id) AS purchases
        FROM shop_purchases sp
        JOIN shop_items si ON si.id = sp.item_id";
if ($date_filter) $sql .= " WHERE sp.created_at >= DATE_SUB(NOW(), INTERVAL $days DAY)";
$sql .= " GROUP BY si.id, si.name, si.type ORDER BY revenue DESC LIMIT 10";
$top_items = $pdo->query($sql)->fetchAll();

// Top 10 categories by order fees
$sql = "SELECT s.category, COALESCE(SUM(o.service_fee), 0) AS revenue,
               COUNT(o.id) AS order_count
        FROM orders o
        JOIN services s ON s.id = o.service_id
        WHERE o.status = 'completed' AND o.payment_status = 'released'";
if ($date_filter) $sql .= " AND o.completed_at >= DATE_SUB(NOW(), INTERVAL $days DAY)";
$sql .= " GROUP BY s.category ORDER BY revenue DESC LIMIT 10";
$top_categories = $pdo->query($sql)->fetchAll();

// Remap daily arrays to match frontend field names
$fee_chart = array_map(fn($row) => ['day' => $row['day'], 'fees' => (float) $row['total']], $daily_fees);
$shop_chart = array_map(fn($row) => ['day' => $row['day'], 'shop' => (float) $row['total']], $daily_shop);

// Remap top_categories to use 'fees' key for consistency with frontend
$top_categories_mapped = array_map(fn($row) => [
    'category' => $row['category'],
    'order_count' => (int) $row['order_count'],
    'fees' => (float) $row['revenue'],
], $top_categories);

json_response([
    'service_fees'    => $service_fees_total,
    'shop_revenue'    => $shop_revenue_total,
    'total_revenue'   => $service_fees_total + $shop_revenue_total,
    'avg_order_value' => $avg_order_value,
    'fee_chart'       => $fee_chart,
    'shop_chart'      => $shop_chart,
    'top_items'       => $top_items,
    'top_categories'  => $top_categories_mapped,
]);
