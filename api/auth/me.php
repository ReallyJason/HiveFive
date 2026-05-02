<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

// Auto-complete/resolve expired orders (throttled to once per 5 min)
require_once __DIR__ . '/../cron/auto-resolve.php';

// Handle admin impersonation
$impersonating = null;
if (!empty($_SESSION['impersonating_user_id'])) {
    $impersonating = (int) $_SESSION['impersonating_user_id'];
    $user_id = $impersonating;
}

$stmt = $pdo->prepare("
    SELECT
        u.id, u.email, u.username, u.first_name, u.last_name,
        u.bio, u.job, u.is_student, u.university, u.profile_image,
        u.hivecoin_balance, u.verified, u.onboarding_done,
        u.wants_to_offer, u.wants_to_find,
        u.notify_orders, u.notify_messages, u.notify_proposals,
        u.active_frame_id, u.active_badge_id, u.active_theme_id,
        u.created_at,
        u.role, u.suspended_until, u.banned_at, u.ban_reason,
        frame_item.id AS frame_id, frame_item.name AS frame_name, frame_item.metadata AS frame_metadata,
        badge_item.id AS badge_id, badge_item.name AS badge_name, badge_item.metadata AS badge_metadata,
        theme_item.id AS theme_id, theme_item.name AS theme_name, theme_item.metadata AS theme_metadata
    FROM users u
    LEFT JOIN shop_items frame_item ON frame_item.id = u.active_frame_id
    LEFT JOIN shop_items badge_item ON badge_item.id = u.active_badge_id
    LEFT JOIN shop_items theme_item ON theme_item.id = u.active_theme_id
    WHERE u.id = ?
");
$stmt->execute([$user_id]);
$row = $stmt->fetch();

if (!$row) {
    $_SESSION = [];
    session_destroy();
    json_response(['error' => 'User not found'], 404);
}

// Build cosmetics object
$cosmetics = [
    'frame' => null,
    'badge' => null,
    'theme' => null,
];

if (shop_cosmetics_enabled()) {
    if ($row['frame_id']) {
        $fm = json_decode($row['frame_metadata'], true) ?: [];
        $cosmetics['frame'] = [
            'id'            => (int) $row['frame_id'],
            'name'          => $row['frame_name'],
            'gradient'      => $fm['gradient'] ?? '',
            'glow'          => $fm['glow'] ?? '',
            'css_animation' => $fm['css_animation'] ?? null,
            'ring_size'     => $fm['ring_size'] ?? 4,
        ];
    }

    if ($row['badge_id']) {
        $bm = json_decode($row['badge_metadata'], true) ?: [];
        $cosmetics['badge'] = [
            'id'            => (int) $row['badge_id'],
            'name'          => $row['badge_name'],
            'tag'           => $bm['tag'] ?? '',
            'bg_color'      => $bm['bg_color'] ?? '#E9A020',
            'text_color'    => $bm['text_color'] ?? '#131210',
            'bg_gradient'   => $bm['bg_gradient'] ?? null,
            'css_animation' => $bm['css_animation'] ?? null,
        ];
    }

    if ($row['theme_id']) {
        $tm = json_decode($row['theme_metadata'], true) ?: [];
        $cosmetics['theme'] = [
            'id'              => (int) $row['theme_id'],
            'name'            => $row['theme_name'],
            'banner_gradient' => $tm['banner_gradient'] ?? '',
            'accent_color'    => $tm['accent_color'] ?? '#E9A020',
            'text_color'      => $tm['text_color'] ?? '#FFFFFF',
            'css_animation'   => $tm['css_animation'] ?? null,
        ];
    }
}

// For known domains, derive canonical university from email
$resolved_university = university_from_email((string) ($row['email'] ?? '')) ?? $row['university'];

json_response(['user' => [
    'id'               => (int) $row['id'],
    'email'            => $row['email'],
    'username'         => $row['username'],
    'first_name'       => $row['first_name'],
    'last_name'        => $row['last_name'],
    'bio'              => $row['bio'],
    'job'              => $row['job'],
    'is_student'       => (bool) $row['is_student'],
    'university'       => $resolved_university,
    'profile_image'    => $row['profile_image'],
    'hivecoin_balance' => (float) $row['hivecoin_balance'],
    'verified'         => (bool) $row['verified'],
    'onboarding_done'  => (bool) $row['onboarding_done'],
    'wants_to_offer'   => (bool) $row['wants_to_offer'],
    'wants_to_find'    => (bool) $row['wants_to_find'],
    'notify_orders'     => (bool) $row['notify_orders'],
    'notify_messages'  => (bool) $row['notify_messages'],
    'notify_proposals' => (bool) $row['notify_proposals'],
    'active_frame_id'  => $row['active_frame_id'] ? (int) $row['active_frame_id'] : null,
    'active_badge_id'  => $row['active_badge_id'] ? (int) $row['active_badge_id'] : null,
    'active_theme_id'  => $row['active_theme_id'] ? (int) $row['active_theme_id'] : null,
    'cosmetics'        => $cosmetics,
    'created_at'       => $row['created_at'],
    'role'             => $row['role'] ?? 'user',
    'suspended_until'  => $row['suspended_until'],
    'banned_at'        => $row['banned_at'],
    'ban_reason'       => $row['ban_reason'],
    'impersonating'    => $impersonating,
]]);
