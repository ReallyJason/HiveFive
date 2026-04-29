<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_feature($pdo, 'feature_shop');

// Optional type filter
$type = isset($_GET['type']) ? $_GET['type'] : null;
$valid_types = ['frame', 'badge', 'theme'];

if ($type && !in_array($type, $valid_types, true)) {
    json_response(['error' => 'Invalid type. Must be frame, badge, or theme'], 400);
}

// Check if user is authenticated (optional)
$user_id = null;
if (!empty($_SESSION['user_id'])) {
    $user_id = (int) $_SESSION['user_id'];
}

// Build query
if ($user_id) {
    $sql = "
        SELECT
            si.id,
            si.type,
            si.name,
            si.description,
            si.price,
            si.metadata,
            CASE WHEN sp.id IS NOT NULL THEN 1 ELSE 0 END AS owned
        FROM shop_items si
        LEFT JOIN shop_purchases sp
            ON sp.item_id = si.id AND sp.user_id = :uid
    ";
} else {
    $sql = "
        SELECT
            si.id,
            si.type,
            si.name,
            si.description,
            si.price,
            si.metadata
        FROM shop_items si
    ";
}

$params = [];

if ($type) {
    $sql .= " WHERE si.type = :type";
    $params[':type'] = $type;
}

$sql .= " ORDER BY si.type, si.price ASC";

$stmt = $pdo->prepare($sql);

if ($user_id) {
    $params[':uid'] = $user_id;
}

$stmt->execute($params);
$rows = $stmt->fetchAll();

$items = array_map(function ($row) use ($user_id) {
    $item = [
        'id'          => (int) $row['id'],
        'type'        => $row['type'],
        'name'        => $row['name'],
        'description' => $row['description'],
        'price'       => (float) $row['price'],
        'metadata'    => json_decode($row['metadata'], true),
    ];

    if ($user_id !== null) {
        $item['owned'] = (bool) $row['owned'];
    }

    return $item;
}, $rows);

json_response(['items' => $items]);
