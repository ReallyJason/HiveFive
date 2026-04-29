<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
require_once __DIR__ . '/../mail.php';
cors();
require_method('POST');

$user_id = require_auth();

$body = get_json_body();
$new_email = trim($body['new_email'] ?? '');
$password = $body['password'] ?? '';

if (!$new_email || !$password) {
    json_response(['error' => 'New email and password are required'], 400);
}

if (!filter_var($new_email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Please enter a valid email address'], 400);
}

// Require .edu domain
$domain = strtolower(substr($new_email, strrpos($new_email, '@') + 1));
if (!str_ends_with($domain, '.edu')) {
    json_response(['error' => 'Only .edu email addresses are allowed'], 400);
}

// Verify password
$stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();

if (!password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'Password is incorrect'], 403);
}

// Check uniqueness
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
$stmt->execute([$new_email, $user_id]);
if ($stmt->fetch()) {
    json_response(['error' => 'This email is already in use'], 409);
}

// Update email and mark as unverified
$mapped_university = university_from_email($new_email);
if ($mapped_university !== null) {
    $pdo->prepare('UPDATE users SET email = ?, verified = 0, university = ? WHERE id = ?')
        ->execute([$new_email, $mapped_university, $user_id]);
} else {
    $pdo->prepare('UPDATE users SET email = ?, verified = 0 WHERE id = ?')
        ->execute([$new_email, $user_id]);
}

// Invalidate old verification tokens
$pdo->prepare("UPDATE tokens SET used = 1 WHERE user_id = ? AND type = 'email_verification' AND used = 0")
    ->execute([$user_id]);

// Generate 6-digit verification code
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$token_value = "{$user_id}:{$code}";
$expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
$stmt = $pdo->prepare(
    'INSERT INTO tokens (user_id, type, token, expires_at) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$user_id, 'email_verification', $token_value, $expires]);

// Send verification email to the new address
send_verification_email($new_email, $code, 'email_change');

json_response([
    'ok' => true,
    'message' => 'Email updated. Please verify your new address.',
    'needs_verification' => true,
]);
