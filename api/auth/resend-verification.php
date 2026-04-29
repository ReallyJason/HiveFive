<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
require_once __DIR__ . '/../mail.php';
cors();
require_method('POST');

$user_id = require_auth();

// Check if already verified
$stmt = $pdo->prepare('SELECT verified, email FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['error' => 'User not found'], 404);
}

if ($user['verified']) {
    json_response(['error' => 'Email is already verified'], 400);
}

// Invalidate old tokens
$pdo->prepare("UPDATE tokens SET used = 1 WHERE user_id = ? AND type = 'email_verification' AND used = 0")
    ->execute([$user_id]);

// Generate new 6-digit code
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$token_value = "{$user_id}:{$code}";
$expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
$stmt = $pdo->prepare(
    'INSERT INTO tokens (user_id, type, token, expires_at) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$user_id, 'email_verification', $token_value, $expires]);

// Send verification email
send_verification_email($user['email'], $code, 'signup');

json_response(['ok' => true, 'message' => 'Verification code sent']);
