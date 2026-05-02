<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');
check_rate_limit($pdo, 'login');

$body = get_json_body();
$email       = trim($body['email'] ?? '');
$password    = $body['password'] ?? '';
$remember_me = !empty($body['remember_me']);

if (!$email || !$password) {
    json_response(['error' => 'Email and password are required'], 400);
}

$stmt = $pdo->prepare(
    'SELECT id, email, username, password_hash, first_name, last_name,
            bio, job, is_student, university, profile_image,
            hivecoin_balance, verified, last_verified_at, onboarding_done,
            active_frame_id, active_badge_id, active_theme_id,
            created_at, deactivated_at,
            role, suspended_until, banned_at, ban_reason
     FROM users WHERE email = ?'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    json_response(['error' => 'No account found with this email', 'code' => 'account_not_found'], 404);
}

if (!password_verify($password, $user['password_hash'])) {
    json_response(['error' => 'Incorrect password', 'code' => 'wrong_password'], 401);
}

// Check if banned
if (!empty($user['banned_at'])) {
    json_response(['error' => 'Your account has been banned', 'code' => 'banned', 'ban_reason' => $user['ban_reason'] ?? ''], 403);
}

// Check if suspended
if (!empty($user['suspended_until']) && strtotime($user['suspended_until']) > time()) {
    json_response(['error' => 'Your account is suspended', 'code' => 'suspended', 'suspended_until' => $user['suspended_until']], 403);
}

// Auto-reactivate deactivated accounts on login
if ($user['deactivated_at'] !== null) {
    $pdo->prepare('UPDATE users SET deactivated_at = NULL WHERE id = ?')->execute([$user['id']]);
    $user['deactivated_at'] = null;
}

// Update last seen
$pdo->prepare('UPDATE users SET last_seen_at = NOW() WHERE id = ?')->execute([$user['id']]);

session_regenerate_id(true);
// Override the session cookie with a 30-day expiry for remember-me.
// session_set_cookie_params() cannot be called after session_start(),
// so we use setcookie() to re-send the cookie with a longer lifetime.
if ($remember_me) {
    $thirty_days = 30 * 24 * 60 * 60;
    setcookie(session_name(), session_id(), [
        'expires'  => time() + $thirty_days,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly'  => true,
        'samesite' => 'Lax',
    ]);
}
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['user_role'] = $user['role'] ?? 'user';

unset($user['password_hash']);
$user['id'] = (int) $user['id'];
$user['hivecoin_balance'] = (float) $user['hivecoin_balance'];
$user['verified'] = (bool) $user['verified'];
$user['onboarding_done'] = (bool) $user['onboarding_done'];
$user['university'] = university_from_email((string) ($user['email'] ?? '')) ?? $user['university'];

$response = ['user' => $user];

// Flag unverified accounts so frontend redirects to verification
if (!$user['verified']) {
    $response['needs_verification'] = true;
    json_response($response);
}

// ── Annual re-verification check ──
// If account is 1+ years old, check if they've verified within the last year.
// Grace period: 1 month after anniversary to re-verify. Past that → locked out.
$created_at       = new DateTime($user['created_at']);
$now              = new DateTime();
$account_age      = $created_at->diff($now);

if ($account_age->y >= 1) {
    // Find the most recent anniversary date
    $anniversary = clone $created_at;
    $anniversary->setDate((int) $now->format('Y'), (int) $created_at->format('m'), (int) $created_at->format('d'));
    if ($anniversary > $now) {
        $anniversary->modify('-1 year');
    }

    $last_verified = $user['last_verified_at'] ? new DateTime($user['last_verified_at']) : $created_at;
    $needs_reverify = $last_verified < $anniversary;

    if ($needs_reverify) {
        $grace_deadline = clone $anniversary;
        $grace_deadline->modify('+1 month');
        $past_grace = $now > $grace_deadline;

        // Invalidate verification status
        $pdo->prepare('UPDATE users SET verified = 0 WHERE id = ?')->execute([$user['id']]);

        // Generate a new verification code and send email
        require_once __DIR__ . '/../mail.php';
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $token_value = "{$user['id']}:{$code}";
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));

        // Invalidate old tokens
        $pdo->prepare("UPDATE tokens SET used = 1 WHERE user_id = ? AND type = 'email_verification' AND used = 0")
            ->execute([$user['id']]);

        $pdo->prepare('INSERT INTO tokens (user_id, type, token, expires_at) VALUES (?, ?, ?, ?)')
            ->execute([$user['id'], 'email_verification', $token_value, $expires]);

        send_verification_email($user['email'], $code, 'signup');

        $response['user']['verified'] = false;
        $response['needs_reverification'] = true;
        $response['past_grace_period'] = $past_grace;
        $response['message'] = $past_grace
            ? 'Your annual verification has expired. Please verify your email to continue using HiveFive.'
            : 'It\'s been a year! Please re-verify your email to keep your account active.';
        json_response($response);
    }
}

json_response($response);
