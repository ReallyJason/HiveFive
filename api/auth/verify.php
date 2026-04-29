<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();

$body = get_json_body();
$code = trim((string) ($body['code'] ?? ''));

if (!$code) {
    json_response(['error' => 'Verification code is required'], 400);
}

// Check if already verified (avoid granting bonus twice)
$already = $pdo->prepare('SELECT verified FROM users WHERE id = ?');
$already->execute([$user_id]);
$already_verified = (bool) $already->fetchColumn();

// ── Bypass code: configurable via Admin > Settings ──
$bp = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?');
$bp->execute(['bypass_code']);
$bypass = ($bp->fetchColumn()) ?: '';
if ($bypass !== '' && $code === $bypass) {
    $pdo->beginTransaction();
    $pdo->prepare('UPDATE users SET verified = 1, last_verified_at = NOW() WHERE id = ?')->execute([$user_id]);
    $pdo->prepare("UPDATE tokens SET used = 1 WHERE user_id = ? AND type = 'email_verification' AND used = 0")
        ->execute([$user_id]);
    if (!$already_verified) {
        $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance + 10 WHERE id = ?')->execute([$user_id]);
        $pdo->prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'bonus', 10.00, 'Welcome bonus')")
            ->execute([$user_id]);
        create_notification($pdo, $user_id, 'payment', 'Welcome bonus!',
            'You received 10 HiveCoins for verifying your account. Happy trading!',
            '/shop');
    }
    $pdo->commit();
    json_response(['ok' => true, 'message' => 'Email verified', 'welcome_bonus' => !$already_verified ? 10 : 0]);
}

// Normal flow: look up {user_id}:{code} in tokens
$token_value = "{$user_id}:{$code}";

$stmt = $pdo->prepare(
    'SELECT id FROM tokens
     WHERE token = ? AND type = ? AND used = 0 AND expires_at > NOW()'
);
$stmt->execute([$token_value, 'email_verification']);
$row = $stmt->fetch();

if (!$row) {
    json_response(['error' => 'Invalid or expired code'], 400);
}

$pdo->beginTransaction();
$pdo->prepare('UPDATE users SET verified = 1, last_verified_at = NOW() WHERE id = ?')->execute([$user_id]);
$pdo->prepare('UPDATE tokens SET used = 1 WHERE id = ?')->execute([$row['id']]);
if (!$already_verified) {
    $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance + 10 WHERE id = ?')->execute([$user_id]);
    $pdo->prepare("INSERT INTO transactions (user_id, type, amount, description) VALUES (?, 'bonus', 10.00, 'Welcome bonus')")
        ->execute([$user_id]);
    create_notification($pdo, $user_id, 'payment', 'Welcome bonus!',
        'You received 10 HiveCoins for verifying your account. Happy trading!',
        '/shop');
}
$pdo->commit();

json_response(['ok' => true, 'message' => 'Email verified', 'welcome_bonus' => !$already_verified ? 10 : 0]);
