<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_admin();
require_method('POST');

$body = get_json_body();
$target_id = $body['user_id'] ?? null;

if (!$target_id) {
    json_response(['error' => 'user_id is required'], 400);
}

$stmt = $pdo->prepare("SELECT id, role, deactivated_at FROM users WHERE id = ?");
$stmt->execute([$target_id]);
$target = $stmt->fetch();

if (!$target) {
    json_response(['error' => 'User not found'], 404);
}

if ($target['deactivated_at'] !== null) {
    json_response(['error' => 'Cannot impersonate a deactivated user'], 400);
}

if ($target['role'] === 'admin') {
    json_response(['error' => 'Cannot impersonate an admin user'], 403);
}

$_SESSION['impersonating_user_id'] = (int) $target['id'];

json_response(['success' => true, 'impersonating' => (int) $target['id']]);
