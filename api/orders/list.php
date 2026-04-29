<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

// Auto-complete and auto-resolve are handled by api/cron/auto-resolve.php
// (runs every 5 min via cron or external scheduler).
$role   = $_GET['role'] ?? '';    // 'buyer' or 'seller'
$status = $_GET['status'] ?? '';  // order status filter

// Build base query
$sql = 'SELECT o.*,
               s.title AS service_title,
               s.category AS service_category,
               r.title AS request_title,
               buyer.first_name     AS buyer_first_name,
               buyer.last_name      AS buyer_last_name,
               buyer.username       AS buyer_username,
               buyer.profile_image  AS buyer_profile_image,
               seller.first_name    AS seller_first_name,
               seller.last_name     AS seller_last_name,
               seller.username      AS seller_username,
               seller.profile_image AS seller_profile_image,
               buyer_frame.metadata  AS buyer_frame_metadata,
               buyer_badge.metadata  AS buyer_badge_metadata,
               seller_frame.metadata AS seller_frame_metadata,
               seller_badge.metadata AS seller_badge_metadata
        FROM orders o
        LEFT JOIN services s ON o.service_id = s.id
        LEFT JOIN requests r ON o.request_id = r.id
        JOIN users buyer  ON o.client_id    = buyer.id
        JOIN users seller ON o.provider_id  = seller.id
        LEFT JOIN shop_items buyer_frame  ON buyer_frame.id  = buyer.active_frame_id
        LEFT JOIN shop_items buyer_badge  ON buyer_badge.id  = buyer.active_badge_id
        LEFT JOIN shop_items seller_frame ON seller_frame.id = seller.active_frame_id
        LEFT JOIN shop_items seller_badge ON seller_badge.id = seller.active_badge_id';

$conditions = [];
$params     = [];

if ($role === 'buyer') {
    $conditions[] = 'o.client_id = ?';
    $params[]     = $user_id;
} elseif ($role === 'seller') {
    $conditions[] = 'o.provider_id = ?';
    $params[]     = $user_id;
} else {
    // Show all orders where user is either party
    $conditions[] = '(o.client_id = ? OR o.provider_id = ?)';
    $params[]     = $user_id;
    $params[]     = $user_id;
}

if ($status) {
    $valid_statuses = ['pending','in_progress','awaiting_completion','completed','cancelled','disputed'];
    if (in_array($status, $valid_statuses, true)) {
        $conditions[] = 'o.status = ?';
        $params[]     = $status;
    }
}

if (!empty($conditions)) {
    $sql .= ' WHERE ' . implode(' AND ', $conditions);
}

$sql .= ' ORDER BY o.created_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$orders = $stmt->fetchAll();

$order_ids = array_map(fn($row) => (int) $row['id'], $orders);
$pending_adjustments = [];

if (!empty($order_ids)) {
    try {
        $placeholders = implode(',', array_fill(0, count($order_ids), '?'));
        $adj_sql = "
            SELECT
                oa.id,
                oa.order_id,
                oa.requested_by,
                oa.responded_by,
                oa.units_delta,
                oa.subtotal_delta,
                oa.service_fee_delta,
                oa.total_delta,
                oa.note,
                oa.status,
                oa.created_at,
                oa.responded_at,
                u.first_name AS requested_by_first_name,
                u.last_name  AS requested_by_last_name
            FROM order_adjustments oa
            JOIN users u ON u.id = oa.requested_by
            JOIN (
                SELECT order_id, MAX(id) AS latest_id
                FROM order_adjustments
                WHERE status = 'pending'
                  AND order_id IN ($placeholders)
                GROUP BY order_id
            ) latest ON latest.latest_id = oa.id
        ";
        $adj_stmt = $pdo->prepare($adj_sql);
        $adj_stmt->execute($order_ids);

        foreach ($adj_stmt->fetchAll() as $row) {
            $pending_adjustments[(int) $row['order_id']] = [
                'id' => (int) $row['id'],
                'order_id' => (int) $row['order_id'],
                'requested_by' => (int) $row['requested_by'],
                'responded_by' => $row['responded_by'] ? (int) $row['responded_by'] : null,
                'units_delta' => (float) $row['units_delta'],
                'subtotal_delta' => (float) $row['subtotal_delta'],
                'service_fee_delta' => (float) $row['service_fee_delta'],
                'total_delta' => (float) $row['total_delta'],
                'note' => $row['note'],
                'status' => $row['status'],
                'created_at' => $row['created_at'],
                'responded_at' => $row['responded_at'],
                'requested_by_name' => trim($row['requested_by_first_name'] . ' ' . $row['requested_by_last_name']),
            ];
        }
    } catch (Exception $e) {
        $pending_adjustments = [];
    }
}

foreach ($orders as &$o) {
    $o['id']          = (int) $o['id'];
    $o['service_id']  = $o['service_id'] ? (int) $o['service_id'] : null;
    $o['provider_id'] = (int) $o['provider_id'];
    $o['client_id']   = (int) $o['client_id'];
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

    if ($o['request_id']) {
        $o['request_id'] = (int) $o['request_id'];
    }

    // Fallback: proposal-based orders have no service row
    if (empty($o['service_title'])) {
        $o['service_title'] = $o['request_title'] ?? 'Custom Request';
    }
    if (empty($o['service_category'])) {
        $o['service_category'] = 'request';
    }
    unset($o['request_title']);

    // Determine the "other party" relative to the authenticated user
    if ($o['client_id'] === $user_id) {
        $op_cosmetics = build_cosmetics_from_row([
            'frame_metadata' => $o['seller_frame_metadata'],
            'badge_metadata' => $o['seller_badge_metadata'],
        ]);
        $o['other_party'] = [
            'id'            => $o['provider_id'],
            'first_name'    => $o['seller_first_name'],
            'last_name'     => $o['seller_last_name'],
            'username'      => $o['seller_username'],
            'profile_image' => $o['seller_profile_image'],
            'role'          => 'seller',
            'cosmetics'     => $op_cosmetics,
        ];
    } else {
        $op_cosmetics = build_cosmetics_from_row([
            'frame_metadata' => $o['buyer_frame_metadata'],
            'badge_metadata' => $o['buyer_badge_metadata'],
        ]);
        $o['other_party'] = [
            'id'            => $o['client_id'],
            'first_name'    => $o['buyer_first_name'],
            'last_name'     => $o['buyer_last_name'],
            'username'      => $o['buyer_username'],
            'profile_image' => $o['buyer_profile_image'],
            'role'          => 'buyer',
            'cosmetics'     => $op_cosmetics,
        ];
    }

    // Remove redundant joined name/cosmetic columns
    unset(
        $o['buyer_first_name'], $o['buyer_last_name'], $o['buyer_username'], $o['buyer_profile_image'],
        $o['seller_first_name'], $o['seller_last_name'], $o['seller_username'], $o['seller_profile_image'],
        $o['buyer_frame_metadata'], $o['buyer_badge_metadata'],
        $o['seller_frame_metadata'], $o['seller_badge_metadata']
    );

    $o['pending_adjustment'] = $pending_adjustments[$o['id']] ?? null;

    // Check if reviews exist for this order
    $o['has_review'] = false;
    $o['has_client_review'] = false;
    if ($o['status'] === 'completed') {
        $rev_stmt = $pdo->prepare('SELECT 1 FROM reviews WHERE order_id = ? LIMIT 1');
        $rev_stmt->execute([$o['id']]);
        $o['has_review'] = (bool) $rev_stmt->fetch();

        $crev_stmt = $pdo->prepare('SELECT 1 FROM client_reviews WHERE order_id = ? LIMIT 1');
        $crev_stmt->execute([$o['id']]);
        $o['has_client_review'] = (bool) $crev_stmt->fetch();
    }
}

json_response(['orders' => $orders]);
