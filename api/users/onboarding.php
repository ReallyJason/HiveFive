<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$data    = get_json_body();

$job        = trim($data['job'] ?? '');
$is_student = isset($data['is_student']) ? (int) $data['is_student'] : 0;
$bio        = trim($data['bio'] ?? '');

$stmt = $pdo->prepare("
    UPDATE users
    SET job             = :job,
        is_student      = :is_student,
        bio             = :bio,
        onboarding_done = 1
    WHERE id = :id
");
$stmt->execute([
    ':job'        => $job,
    ':is_student' => $is_student,
    ':bio'        => $bio,
    ':id'         => $user_id,
]);

// Return updated user
$stmt = $pdo->prepare("
    SELECT
        id, email, username, first_name, last_name, bio, job, is_student, university,
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
    'job'              => $user['job'],
    'is_student'       => (bool) $user['is_student'],
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
