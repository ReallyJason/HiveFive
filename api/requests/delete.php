<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('DELETE');

$user_id = require_auth();

$id = (int) ($_GET['id'] ?? 0);
if (!$id) {
    json_response(['error' => 'Request id is required (?id=X)'], 400);
}

// Verify ownership
$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ? AND requester_id = ?');
$stmt->execute([$id, $user_id]);
$request = $stmt->fetch();

if (!$request) {
    json_response(['error' => 'Request not found or you do not own it'], 404);
}

// Delete associated proposals first (foreign key)
$pdo->prepare('DELETE FROM proposals WHERE request_id = ?')->execute([$id]);

// Delete the request
$pdo->prepare('DELETE FROM requests WHERE id = ?')->execute([$id]);

json_response(['deleted' => true]);
