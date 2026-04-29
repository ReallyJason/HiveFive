<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');
require_feature($pdo, 'feature_shop');

$user_id = require_auth();
$data    = get_json_body();

$item_id = isset($data['item_id']) ? (int) $data['item_id'] : 0;

if ($item_id <= 0) {
    json_response(['error' => 'item_id is required'], 400);
}

// Verify item exists
$stmt = $pdo->prepare("SELECT id, type, name, price FROM shop_items WHERE id = :id");
$stmt->execute([':id' => $item_id]);
$item = $stmt->fetch();

if (!$item) {
    json_response(['error' => 'Item not found'], 404);
}

$price = (float) $item['price'];

// Perform purchase in a database transaction with row locking
$pdo->beginTransaction();

try {
    // Lock and check balance atomically
    $stmt = $pdo->prepare("SELECT hivecoin_balance FROM users WHERE id = :id FOR UPDATE");
    $stmt->execute([':id' => $user_id]);
    $balance = (float) $stmt->fetchColumn();

    if ($balance < $price) {
        $pdo->rollBack();
        json_response(['error' => 'Insufficient balance'], 400);
    }

    // Check duplicate purchase inside transaction
    $stmt = $pdo->prepare("SELECT id FROM shop_purchases WHERE user_id = :uid AND item_id = :iid");
    $stmt->execute([':uid' => $user_id, ':iid' => $item_id]);
    if ($stmt->fetch()) {
        $pdo->rollBack();
        json_response(['error' => 'You already own this item'], 409);
    }

    // Deduct balance
    $stmt = $pdo->prepare("
        UPDATE users SET hivecoin_balance = hivecoin_balance - :price WHERE id = :id
    ");
    $stmt->execute([':price' => $price, ':id' => $user_id]);

    // Insert purchase record
    $stmt = $pdo->prepare("
        INSERT INTO shop_purchases (user_id, item_id, price_paid, created_at)
        VALUES (:uid, :iid, :price, NOW())
    ");
    $stmt->execute([
        ':uid'   => $user_id,
        ':iid'   => $item_id,
        ':price' => $price,
    ]);
    $purchase_id = (int) $pdo->lastInsertId();

    // Create purchase transaction
    $stmt = $pdo->prepare("
        INSERT INTO transactions (user_id, type, amount, description, created_at)
        VALUES (:uid, 'purchase', :amt, :desc, NOW())
    ");
    $stmt->execute([
        ':uid'  => $user_id,
        ':amt'  => $price,
        ':desc' => "Purchased {$item['type']}: {$item['name']}",
    ]);

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    json_response(['error' => 'Purchase failed'], 500);
}

// Fetch new balance
$stmt = $pdo->prepare("SELECT hivecoin_balance FROM users WHERE id = :id");
$stmt->execute([':id' => $user_id]);
$new_balance = (float) $stmt->fetchColumn();

json_response([
    'purchase' => [
        'id'         => $purchase_id,
        'item_id'    => (int) $item['id'],
        'item_name'  => $item['name'],
        'item_type'  => $item['type'],
        'price_paid' => $price,
    ],
    'new_balance' => $new_balance,
], 201);
