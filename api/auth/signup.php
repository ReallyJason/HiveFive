<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
require_once __DIR__ . '/../mail.php';
cors();
require_method('POST');
check_rate_limit($pdo, 'signup');

$body = get_json_body();
$email      = trim($body['email'] ?? '');
$username   = trim($body['username'] ?? '');
$password   = $body['password'] ?? '';
$first_name = trim($body['first_name'] ?? '');
$last_name  = trim($body['last_name'] ?? '');
$university = trim($body['university'] ?? '');

if (!$email || !$username || !$password || !$first_name) {
    json_response(['error' => 'All fields are required'], 400);
}

if (!$last_name) {
    json_response(['error' => 'Please enter your first and last name'], 400);
}

if (strlen($username) > 50) {
    json_response(['error' => 'Username must be 50 characters or fewer'], 400);
}
if (!preg_match('/^[a-zA-Z0-9_.-]+$/', $username)) {
    json_response(['error' => 'Username can only contain letters, numbers, underscores, hyphens, and dots'], 400);
}
if (strlen($first_name) > 50 || strlen($last_name) > 50) {
    json_response(['error' => 'Name fields must be 50 characters or fewer'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'A valid email is required'], 400);
}

$mapped_university = university_from_email($email);
if ($mapped_university !== null) {
    $university = $mapped_university;
}

if (!$university) {
    json_response(['error' => 'University is required'], 400);
}
if (strlen($university) > 100) {
    json_response(['error' => 'University must be 100 characters or fewer'], 400);
}

if (strlen($password) < 8) {
    json_response(['error' => 'Password must be at least 8 characters'], 400);
}
if (strlen($password) > 72) {
    json_response(['error' => 'Password must be 72 characters or fewer'], 400);
}
if (!preg_match('/[A-Z]/', $password)) {
    json_response(['error' => 'Password must contain at least one uppercase letter'], 400);
}
if (!preg_match('/[0-9]/', $password)) {
    json_response(['error' => 'Password must contain at least one number'], 400);
}

// Check email duplicate (including deactivated accounts — they should log in to reactivate)
$stmt = $pdo->prepare('SELECT id, deactivated_at FROM users WHERE email = ?');
$stmt->execute([$email]);
$existing_email = $stmt->fetch();
if ($existing_email) {
    $msg = $existing_email['deactivated_at'] !== null
        ? 'An account with this email already exists. Log in to reactivate it.'
        : 'An account with this email already exists';
    json_response(['error' => $msg], 409);
}

// Check username duplicate
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    json_response(['error' => 'This username is already taken — choose a different one'], 409);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare(
    'INSERT INTO users (email, username, password_hash, first_name, last_name, university)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$email, $username, $hash, $first_name, $last_name, $university]);
$user_id = (int) $pdo->lastInsertId();

// Generate 6-digit verification code
$code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$token_value = "{$user_id}:{$code}";
$expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
$stmt = $pdo->prepare(
    'INSERT INTO tokens (user_id, type, token, expires_at) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$user_id, 'email_verification', $token_value, $expires]);

// Send verification email
send_verification_email($email, $code, 'signup');

// Start session with fresh cookie (30-day expiry)
session_regenerate_id(true);
$_SESSION['user_id'] = $user_id;

json_response([
    'user' => [
        'id'         => $user_id,
        'email'      => $email,
        'username'   => $username,
        'first_name' => $first_name,
        'last_name'  => $last_name,
        'university' => $university,
        'verified'   => false,
    ],
], 201);
