<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$body = get_json_body();

$reported_id = (int) ($body['reported_id'] ?? 0);
$reason      = trim($body['reason'] ?? '');
$description = trim($body['description'] ?? '');

// --- Validation ---

if (!$reported_id) {
    json_response(['error' => 'reported_id is required'], 400);
}

if ($reported_id === $user_id) {
    json_response(['error' => 'You cannot report yourself'], 400);
}

$valid_reasons = [
    'harassment',
    'academic_dishonesty',
    'scam_fraud',
    'inappropriate_content',
    'spam',
    'impersonation',
    'other',
];
if (!in_array($reason, $valid_reasons, true)) {
    json_response(['error' => 'Invalid reason'], 400);
}

if (mb_strlen($description) < 20) {
    json_response(['error' => 'Description must be at least 20 characters'], 400);
}
if (mb_strlen($description) > 1000) {
    json_response(['error' => 'Description must be 1,000 characters or less'], 400);
}

// Reported user must exist and not be deactivated
$stmt = $pdo->prepare('SELECT id, deactivated_at, suspended_until, banned_at FROM users WHERE id = ?');
$stmt->execute([$reported_id]);
$reported_user = $stmt->fetch();

if (!$reported_user) {
    json_response(['error' => 'Reported user not found'], 404);
}
if ($reported_user['deactivated_at'] !== null) {
    json_response(['error' => 'Cannot report a deactivated user'], 400);
}

// No duplicate pending report from this reporter to this reported user
$stmt = $pdo->prepare(
    'SELECT id FROM reports WHERE reporter_id = ? AND reported_id = ? AND status = ?'
);
$stmt->execute([$user_id, $reported_id, 'pending']);
if ($stmt->fetch()) {
    json_response(['error' => 'You already have a pending report against this user'], 409);
}

// --- Insert report ---

$stmt = $pdo->prepare(
    'INSERT INTO reports (reporter_id, reported_id, reason, description)
     VALUES (?, ?, ?, ?)'
);
$stmt->execute([$user_id, $reported_id, $reason, $description]);
$report_id = (int) $pdo->lastInsertId();

// --- Notify all admin users ---

$stmt = $pdo->prepare('SELECT id FROM users WHERE role = ?');
$stmt->execute(['admin']);
$admins = $stmt->fetchAll();

// Fetch reporter username for notification context
$stmt = $pdo->prepare('SELECT username FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$reporter = $stmt->fetch();
$reporter_name = $reporter ? $reporter['username'] : 'A user';

foreach ($admins as $admin) {
    create_notification(
        $pdo,
        (int) $admin['id'],
        'order',
        'New Report Submitted',
        $reporter_name . ' reported a user for ' . str_replace('_', ' ', $reason),
        '/admin/reports',
        $user_id
    );
}

json_response(['report' => ['id' => $report_id]], 201);
