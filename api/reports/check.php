<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

$target_user_id = (int) ($_GET['user_id'] ?? 0);

if (!$target_user_id) {
    json_response(['error' => 'user_id query parameter is required'], 400);
}

$stmt = $pdo->prepare(
    'SELECT id FROM reports WHERE reporter_id = ? AND reported_id = ? AND status = ?'
);
$stmt->execute([$user_id, $target_user_id, 'pending']);
$has_pending = (bool) $stmt->fetch();

json_response(['has_pending_report' => $has_pending]);
