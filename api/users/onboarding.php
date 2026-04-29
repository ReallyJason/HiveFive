<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$data    = get_json_body();

$major = trim($data['major'] ?? '');
$year  = trim($data['year'] ?? '');
$bio   = trim($data['bio'] ?? '');

$valid_years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

if ($major === '') {
    json_response(['error' => 'Please enter what you\'re studying'], 422);
}
if (!in_array($year, $valid_years, true)) {
    json_response(['error' => 'Please select a valid academic year'], 422);
}

$stmt = $pdo->prepare("
    UPDATE users
    SET major          = :major,
        year           = :year,
        bio            = :bio,
        onboarding_done = 1
    WHERE id = :id
");
$stmt->execute([
    ':major' => $major,
    ':year'  => $year,
    ':bio'   => $bio,
    ':id'    => $user_id,
]);

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
