<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('PATCH');

$user_id = require_auth();
$data    = get_json_body();

$email_stmt = $pdo->prepare('SELECT email FROM users WHERE id = ?');
$email_stmt->execute([$user_id]);
$current_email = (string) ($email_stmt->fetchColumn() ?: '');
$locked_university = $current_email ? university_from_email($current_email) : null;

// Whitelist of allowed fields
$allowed = [
    'first_name',
    'last_name',
    'bio',
    'major',
    'year',
    'university',
    'profile_image',
    'wants_to_offer',
    'wants_to_find',
    'notify_orders',
    'notify_messages',
    'notify_proposals',
    'active_frame_id',
    'active_badge_id',
    'active_theme_id',
];

$fields = [];
$params = [];

$cosmetic_fields = ['active_frame_id', 'active_badge_id', 'active_theme_id'];

// Length limits for text fields
$text_limits = [
    'first_name' => 50,
    'last_name'  => 50,
    'bio'        => 200,
    'major'      => 100,
];

foreach ($allowed as $field) {
    if (array_key_exists($field, $data)) {
        if ($field === 'university' && $locked_university !== null) {
            $data[$field] = $locked_university;
        }

        // Verify ownership of shop items before equipping (admin can equip freely)
        $is_admin = !empty($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
        if (in_array($field, $cosmetic_fields) && $data[$field] !== null && !$is_admin) {
            $check = $pdo->prepare('SELECT id FROM shop_purchases WHERE user_id = ? AND item_id = ?');
            $check->execute([$user_id, (int) $data[$field]]);
            if (!$check->fetch()) {
                json_response(['error' => 'You do not own this item'], 403);
            }
        }
        // Length validation for text fields
        if (isset($text_limits[$field]) && is_string($data[$field]) && mb_strlen($data[$field]) > $text_limits[$field]) {
            $limit = $text_limits[$field];
            json_response(['error' => "{$field} must be {$limit} characters or less"], 400);
        }
        $value = $data[$field];
        // Cast booleans to int for TINYINT columns (PDO native prepares can't bind PHP false)
        if (is_bool($value)) {
            $value = (int) $value;
        }
        $fields[] = "$field = :$field";
        $params[":$field"] = $value;
    }
}

if (!empty($fields) && $locked_university !== null && !array_key_exists(':university', $params)) {
    $fields[] = 'university = :university';
    $params[':university'] = $locked_university;
}

if (empty($fields)) {
    json_response(['error' => 'No valid fields to update'], 400);
}

$params[':id'] = $user_id;

$sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// Return updated user
$stmt = $pdo->prepare("
    SELECT
        id, email, username, first_name, last_name, bio, major, year, university,
        profile_image, hivecoin_balance, verified, onboarding_done,
        wants_to_offer, wants_to_find,
        notify_orders, notify_messages, notify_proposals,
        active_frame_id, active_badge_id, active_theme_id,
        created_at
    FROM users WHERE id = :id
");
$stmt->execute([':id' => $user_id]);
$user = $stmt->fetch();
$resolved_university = university_from_email((string) ($user['email'] ?? '')) ?? $user['university'];

json_response(['user' => [
    'id'               => (int) $user['id'],
    'email'            => $user['email'],
    'username'         => $user['username'],
    'first_name'       => $user['first_name'],
    'last_name'        => $user['last_name'],
    'bio'              => $user['bio'],
    'major'            => $user['major'],
    'year'             => $user['year'],
    'university'       => $resolved_university,
    'profile_image'    => $user['profile_image'],
    'hivecoin_balance' => (float) $user['hivecoin_balance'],
    'verified'         => (bool) $user['verified'],
    'onboarding_done'  => (bool) $user['onboarding_done'],
    'wants_to_offer'   => $user['wants_to_offer'],
    'wants_to_find'    => $user['wants_to_find'],
    'notify_orders'     => (bool) $user['notify_orders'],
    'notify_messages'  => (bool) $user['notify_messages'],
    'notify_proposals' => (bool) $user['notify_proposals'],
    'active_frame_id'  => $user['active_frame_id'] ? (int) $user['active_frame_id'] : null,
    'active_badge_id'  => $user['active_badge_id'] ? (int) $user['active_badge_id'] : null,
    'active_theme_id'  => $user['active_theme_id'] ? (int) $user['active_theme_id'] : null,
    'created_at'       => $user['created_at'],
]]);
