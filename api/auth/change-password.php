<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();

$body = get_json_body();
$old_password = $body['old_password'] ?? '';
$new_password = $body['new_password'] ?? '';

if (!$old_password || !$new_password) {
    json_response(['error' => 'Old and new passwords are required'], 400);
}

if (strlen($new_password) < 8) {
    json_response(['error' => 'Password must be at least 8 characters'], 400);
}
if (strlen($new_password) > 72) {
    json_response(['error' => 'Password must be 72 characters or fewer'], 400);
}
if (!preg_match('/[A-Z]/', $new_password)) {
    json_response(['error' => 'Password must contain at least one uppercase letter'], 400);
}
if (!preg_match('/[0-9]/', $new_password)) {
    json_response(['error' => 'Password must contain at least one number'], 400);
}

$stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!password_verify($old_password, $user['password_hash'])) {
    json_response(['error' => 'Current password is incorrect'], 403);
}

$hash = password_hash($new_password, PASSWORD_DEFAULT);
$pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $user_id]);

json_response(['ok' => true, 'message' => 'Password updated']);
