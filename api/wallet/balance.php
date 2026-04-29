<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

$stmt = $pdo->prepare("SELECT hivecoin_balance FROM users WHERE id = :id");
$stmt->execute([':id' => $user_id]);
$row = $stmt->fetch();

if (!$row) {
    json_response(['error' => 'User not found'], 404);
}

json_response([
    'balance' => (float) $row['hivecoin_balance'],
]);
