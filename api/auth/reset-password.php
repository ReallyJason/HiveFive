<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');
check_rate_limit($pdo, 'reset_password');

$body         = get_json_body();
$email        = trim($body['email'] ?? '');
$code         = trim((string) ($body['code'] ?? ''));
$new_password = $body['new_password'] ?? '';

if (!$email || !$code || !$new_password) {
    json_response(['error' => 'Email, code, and new password are required'], 400);
}

if (strlen($new_password) < 8) {
    json_response(['error' => 'Password must be at least 8 characters'], 400);
}
if (strlen($new_password) > 72) {
    json_response(['error' => 'Password must be 72 characters or fewer'], 400);
}
if (!preg_match('/[A-Z]/', $new_password)) {
    json_response(['error' => 'Password must contain at least one uppercase letter'], 400);
}
if (!preg_match('/[0-9]/', $new_password)) {
    json_response(['error' => 'Password must contain at least one number'], 400);
}

// Look up user by email (include soft-deleted so master code can revive accounts)
$stmt = $pdo->prepare('SELECT id, deactivated_at FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['error' => 'Invalid or expired reset code'], 400);
}

$user_id = (int) $user['id'];

// ── Bypass code: configurable via Admin > Settings ──
$bp = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?');
$bp->execute(['bypass_code']);
$bypass = ($bp->fetchColumn()) ?: '';
if ($bypass !== '' && $code === $bypass) {
    $hash = password_hash($new_password, PASSWORD_DEFAULT);
    $pdo->prepare('UPDATE users SET password_hash = ?, deactivated_at = NULL WHERE id = ?')->execute([$hash, $user_id]);
    json_response(['message' => 'Password reset successful']);
}

// For normal codes, only allow active accounts
if ($user['deactivated_at'] !== null) {
    json_response(['error' => 'Invalid or expired reset code'], 400);
}

$token_value = "{$user_id}:{$code}";

// Look up valid password reset token
$stmt = $pdo->prepare(
    "SELECT id FROM tokens
     WHERE user_id = ? AND token = ? AND type = 'password_reset' AND used = 0 AND expires_at > NOW()"
);
$stmt->execute([$user_id, $token_value]);
$token = $stmt->fetch();

if (!$token) {
    json_response(['error' => 'Invalid or expired reset code'], 400);
}

// Update password and mark token as used
$pdo->beginTransaction();
$hash = password_hash($new_password, PASSWORD_DEFAULT);
$pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $user_id]);
$pdo->prepare('UPDATE tokens SET used = 1 WHERE id = ?')->execute([$token['id']]);
$pdo->commit();

json_response(['message' => 'Password reset successful']);
