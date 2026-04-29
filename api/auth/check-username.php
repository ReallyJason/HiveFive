<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$username = trim($_GET['username'] ?? '');

if ($username === '') {
    json_response(['error' => 'Username is required'], 400);
}

if (strlen($username) > 50) {
    json_response(['error' => 'Username must be 50 characters or fewer'], 400);
}

if (!preg_match('/^[a-zA-Z0-9_.-]+$/', $username)) {
    json_response(['available' => false, 'reason' => 'Only letters, numbers, underscores, hyphens, and dots']);
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);

json_response(['available' => !$stmt->fetch()]);
