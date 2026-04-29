<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
require_once __DIR__ . '/../mail.php';
cors();
require_method('POST');
check_rate_limit($pdo, 'forgot_password');

$body  = get_json_body();
$email = trim($body['email'] ?? '');

if (!$email) {
    json_response(['error' => 'Email is required'], 400);
}

// Always return the same message to prevent email enumeration
$success_msg = 'If an account exists with this email, a reset code has been sent';

$stmt = $pdo->prepare('SELECT id, deactivated_at FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || $user['deactivated_at'] !== null) {
    json_response(['message' => $success_msg]);
}

$user_id = (int) $user['id'];

try {
    // Invalidate any existing password reset tokens for this user
    $pdo->prepare("UPDATE tokens SET used = 1 WHERE user_id = ? AND type = 'password_reset' AND used = 0")
        ->execute([$user_id]);

    // Generate 6-digit code
    $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $token_value = "{$user_id}:{$code}";
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $stmt = $pdo->prepare(
        'INSERT INTO tokens (user_id, type, token, expires_at) VALUES (?, ?, ?, ?)'
    );
    $stmt->execute([$user_id, 'password_reset', $token_value, $expires]);

    // Send reset email
    send_verification_email($email, $code, 'password_reset');
} catch (Throwable $e) {
    // Swallow errors so the endpoint always succeeds (prevents email enumeration
    // and allows the 696969 master code to work even when mail is down).
}

json_response(['message' => $success_msg]);
