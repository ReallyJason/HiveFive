<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

// Get user's active equipped items
$stmt = $pdo->prepare("
    SELECT active_frame_id, active_badge_id, active_theme_id FROM users WHERE id = :id
");
$stmt->execute([':id' => $user_id]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['error' => 'User not found'], 404);
}

$active_frame = $user['active_frame_id'] ? (int) $user['active_frame_id'] : null;
$active_badge = $user['active_badge_id'] ? (int) $user['active_badge_id'] : null;
$active_theme = $user['active_theme_id'] ? (int) $user['active_theme_id'] : null;

// Fetch all purchased items
$stmt = $pdo->prepare("
    SELECT
        sp.id AS purchase_id,
        sp.price_paid,
        sp.created_at AS purchased_at,
        si.id AS item_id,
        si.type,
        si.name,
        si.description,
        si.price,
        si.metadata
    FROM shop_purchases sp
    JOIN shop_items si ON si.id = sp.item_id
    WHERE sp.user_id = :uid
    ORDER BY sp.created_at DESC
");
$stmt->execute([':uid' => $user_id]);
$rows = $stmt->fetchAll();

$items = array_map(function ($row) use ($active_frame, $active_badge, $active_theme) {
    $item_id = (int) $row['item_id'];
    $type    = $row['type'];

    // Determine if this item is currently equipped
    $equipped = false;
    if ($type === 'frame' && $active_frame === $item_id) {
        $equipped = true;
    } elseif ($type === 'badge' && $active_badge === $item_id) {
        $equipped = true;
    } elseif ($type === 'theme' && $active_theme === $item_id) {
        $equipped = true;
    }

    return [
        'purchase_id'  => (int) $row['purchase_id'],
        'item_id'      => $item_id,
        'type'         => $type,
        'name'         => $row['name'],
        'description'  => $row['description'],
        'price'        => (float) $row['price'],
        'price_paid'   => (float) $row['price_paid'],
        'metadata'     => json_decode($row['metadata'], true),
        'equipped'     => $equipped,
        'purchased_at' => $row['purchased_at'],
    ];
}, $rows);

json_response(['inventory' => $items]);
