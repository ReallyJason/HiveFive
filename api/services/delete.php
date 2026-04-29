<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('DELETE');

$user_id = require_auth();

$service_id = (int) ($_GET['id'] ?? 0);
if (!$service_id) {
    json_response(['error' => 'Service id is required (?id=X)'], 400);
}

// Verify ownership
$stmt = $pdo->prepare('SELECT id FROM services WHERE id = ? AND provider_id = ?');
$stmt->execute([$service_id, $user_id]);
if (!$stmt->fetch()) {
    json_response(['error' => 'Service not found or you do not own it'], 404);
}

// Check for active orders
$stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE service_id = ? AND status IN ('pending', 'in_progress')");
$stmt->execute([$service_id]);
$activeOrders = (int) $stmt->fetchColumn();

if ($activeOrders > 0) {
    json_response(['error' => 'Cannot delete a service with active orders. Complete or cancel them first.'], 400);
}

// Delete the service
$stmt = $pdo->prepare('DELETE FROM services WHERE id = ? AND provider_id = ?');
$stmt->execute([$service_id, $user_id]);

json_response(['deleted' => true, 'id' => $service_id]);
