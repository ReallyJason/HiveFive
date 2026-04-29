<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('DELETE');

$user_id = require_auth();
$body = get_json_body();
$password = $body['password'] ?? '';

if (!$password) {
    json_response(['error' => 'Password is required to deactivate your account'], 400);
}

// Fetch the user's password hash
$stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['error' => 'User not found'], 404);
}

if (!password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'Incorrect password'], 401);
}

// Deactivate: set deactivated_at timestamp
$stmt = $pdo->prepare('UPDATE users SET deactivated_at = NOW() WHERE id = ?');
$stmt->execute([$user_id]);

// Destroy the session
session_destroy();

json_response(['message' => 'Account deactivated successfully']);
