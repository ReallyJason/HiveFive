<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('PATCH');

$user_id = require_auth();

$body = get_json_body();
$service_id = (int) ($body['service_id'] ?? 0);

if (!$service_id) {
    json_response(['error' => 'service_id is required'], 400);
}

// Verify ownership
$stmt = $pdo->prepare('SELECT id, is_active FROM services WHERE id = ? AND provider_id = ?');
$stmt->execute([$service_id, $user_id]);
$service = $stmt->fetch();

if (!$service) {
    json_response(['error' => 'Service not found or you do not own it'], 404);
}

// Toggle is_active between 0 and 1
$new_active = $service['is_active'] ? 0 : 1;

$stmt = $pdo->prepare('UPDATE services SET is_active = ? WHERE id = ? AND provider_id = ?');
$stmt->execute([$new_active, $service_id, $user_id]);

json_response([
    'id' => $service_id,
    'is_active' => (bool) $new_active,
]);
