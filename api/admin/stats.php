<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_admin();
require_method('GET');

// Total service fee revenue from completed orders (only count released payments)
$stmt = $pdo->query("SELECT COALESCE(SUM(service_fee), 0) AS total FROM orders WHERE status = 'completed' AND payment_status = 'released'");
$service_fee_revenue = (float) $stmt->fetchColumn();

// Total shop revenue
$stmt = $pdo->query("SELECT COALESCE(SUM(price_paid), 0) AS total FROM shop_purchases");
$shop_revenue = (float) $stmt->fetchColumn();

// Active users in last 7 days
$stmt = $pdo->query(
    "SELECT COUNT(*) FROM users
     WHERE last_seen_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       AND role = 'user'
       AND deactivated_at IS NULL"
);
$active_users_7d = (int) $stmt->fetchColumn();

// Open reports
$stmt = $pdo->query("SELECT COUNT(*) FROM reports WHERE status = 'pending'");
$open_reports = (int) $stmt->fetchColumn();

// Orders this month
$stmt = $pdo->query(
    "SELECT COUNT(*) FROM orders
     WHERE MONTH(created_at) = MONTH(NOW())
       AND YEAR(created_at) = YEAR(NOW())"
);
$orders_this_month = (int) $stmt->fetchColumn();

// Revenue by day last 30 days — service fees from completed orders
$stmt = $pdo->query(
    "SELECT DATE(completed_at) AS day, COALESCE(SUM(service_fee), 0) AS total
     FROM orders
     WHERE status = 'completed' AND payment_status = 'released'
       AND completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(completed_at)
     ORDER BY day ASC"
);
$daily_service_fees = $stmt->fetchAll();

// Revenue by day last 30 days — shop purchases
$stmt = $pdo->query(
    "SELECT DATE(created_at) AS day, COALESCE(SUM(price_paid), 0) AS total
     FROM shop_purchases
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(created_at)
     ORDER BY day ASC"
);
$daily_shop_revenue = $stmt->fetchAll();

// Orders by status
$stmt = $pdo->query(
    "SELECT status, COUNT(*) AS count
     FROM orders
     GROUP BY status"
);
$orders_by_status = $stmt->fetchAll();

// Remap daily arrays to match frontend field names
$fee_by_day = array_map(fn($row) => ['day' => $row['day'], 'fees' => (float) $row['total']], $daily_service_fees);
$shop_by_day = array_map(fn($row) => ['day' => $row['day'], 'shop' => (float) $row['total']], $daily_shop_revenue);

json_response([
    'total_revenue'    => $service_fee_revenue + $shop_revenue,
    'service_fees'     => $service_fee_revenue,
    'shop_revenue'     => $shop_revenue,
    'active_users'     => $active_users_7d,
    'open_reports'     => $open_reports,
    'orders_this_month'=> $orders_this_month,
    'fee_by_day'       => $fee_by_day,
    'shop_by_day'      => $shop_by_day,
    'orders_by_status' => $orders_by_status,
]);
