<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$target_id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
$target_username = isset($_GET['username']) ? trim($_GET['username']) : '';

if ($target_id <= 0 && $target_username === '') {
    json_response(['error' => 'id or username query parameter is required'], 400);
}

// Fetch public user info with cosmetic metadata
$where_clause = $target_username !== '' ? 'u.username = :username' : 'u.id = :id';
$bind_params = $target_username !== '' ? [':username' => $target_username] : [':id' => $target_id];

$stmt = $pdo->prepare("
    SELECT
        u.id, u.email, u.username, u.first_name, u.last_name, u.bio, u.job, u.is_student, u.university,
        u.profile_image, u.verified, u.onboarding_done, u.wants_to_offer, u.wants_to_find,
        u.active_frame_id, u.active_badge_id, u.active_theme_id,
        u.created_at,
        frame_item.id AS frame_id, frame_item.name AS frame_name, frame_item.metadata AS frame_metadata,
        badge_item.id AS badge_id, badge_item.name AS badge_name, badge_item.metadata AS badge_metadata,
        theme_item.id AS theme_id, theme_item.name AS theme_name, theme_item.metadata AS theme_metadata
    FROM users u
    LEFT JOIN shop_items frame_item ON frame_item.id = u.active_frame_id
    LEFT JOIN shop_items badge_item ON badge_item.id = u.active_badge_id
    LEFT JOIN shop_items theme_item ON theme_item.id = u.active_theme_id
    WHERE $where_clause AND u.deactivated_at IS NULL
");
$stmt->execute($bind_params);
$row = $stmt->fetch();

if (!$row) {
    json_response(['error' => 'User not found'], 404);
}

// Resolve the actual user ID from the fetched row
$target_id = (int) $row['id'];

// Active services count
$stmt = $pdo->prepare("SELECT COUNT(*) FROM services WHERE provider_id = :id");
$stmt->execute([':id' => $target_id]);
$active_services = (int) $stmt->fetchColumn();

// Completed orders count (both sides — provider + client)
$stmt = $pdo->prepare("
    SELECT COUNT(*) FROM orders
    WHERE (provider_id = :id1 OR client_id = :id2) AND status = 'completed'
");
$stmt->execute([':id1' => $target_id, ':id2' => $target_id]);
$completed_orders = (int) $stmt->fetchColumn();

// ---- Buzz Score (action-based, all-time) -----------------------------------
$buzz_score = 0;
try {
    $has_cr = false;
    try { $pdo->query('SELECT 1 FROM client_reviews LIMIT 0'); $has_cr = true; } catch (Exception $e) {}

    $buzz_sql = "
        SELECT SUM(points) AS raw_points FROM (
            SELECT 15 AS points FROM orders WHERE provider_id = :u1 AND status = 'completed'
            UNION ALL
            SELECT 5 FROM orders WHERE client_id = :u2 AND status = 'completed'
            UNION ALL
            SELECT CASE rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2 WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END
            FROM reviews WHERE provider_id = :u3
            UNION ALL
            SELECT 4 FROM reviews WHERE reviewer_id = :u4
            UNION ALL
            SELECT -10 FROM orders WHERE provider_id = :u5 AND status = 'cancelled'
            UNION ALL
            SELECT -10 FROM orders WHERE client_id = :u6 AND status = 'cancelled'
            UNION ALL
            SELECT 8 FROM (
                SELECT provider_id, client_id FROM orders WHERE provider_id = :u7 AND status = 'completed'
                GROUP BY provider_id, client_id HAVING COUNT(*) >= 2
            ) rc1
            UNION ALL
            SELECT 8 FROM (
                SELECT client_id, provider_id FROM orders WHERE client_id = :u8 AND status = 'completed'
                GROUP BY client_id, provider_id HAVING COUNT(*) >= 2
            ) rc2
            " . ($has_cr ? "
            UNION ALL
            SELECT CASE rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2 WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END
            FROM client_reviews WHERE client_id = :u9
            UNION ALL
            SELECT 4 FROM client_reviews WHERE reviewer_id = :u10
            " : "") . "
        ) actions
    ";
    $buzz_stmt = $pdo->prepare($buzz_sql);
    $bind = [':u1' => $target_id, ':u2' => $target_id, ':u3' => $target_id, ':u4' => $target_id,
             ':u5' => $target_id, ':u6' => $target_id, ':u7' => $target_id, ':u8' => $target_id];
    if ($has_cr) {
        $bind[':u9'] = $target_id;
        $bind[':u10'] = $target_id;
    }
    $buzz_stmt->execute($bind);
    $raw = (float) ($buzz_stmt->fetchColumn() ?: 0);

    // Profile completion bonus
    if (!empty($row['bio']) && !empty($row['profile_image'])) {
        $raw += 10;
    }

    // Inactivity penalty
    $last_seen_stmt = $pdo->prepare('SELECT last_seen_at FROM users WHERE id = ?');
    $last_seen_stmt->execute([$target_id]);
    $last_seen = $last_seen_stmt->fetchColumn();
    if ($last_seen) {
        $days_inactive = max(0, (int) ((time() - strtotime($last_seen)) / 86400));
        if ($days_inactive > 14) {
            $raw -= min($days_inactive - 14, 20);
        }
    }

    $k = 300;
    $buzz_score = ($raw > 0) ? round(1000 * (1 - exp(-$raw / $k)), 1) : 0;
} catch (Exception $e) {
    $buzz_score = 0;
}

// Average response time (in minutes) — how quickly this user replies to messages
// For each conversation, find consecutive message pairs where someone else wrote
// and this user replied next, then average the time gap.
$avg_response_minutes = null;
try {
    $rt_stmt = $pdo->prepare("
        SELECT AVG(reply_gap) AS avg_gap FROM (
            SELECT
                TIMESTAMPDIFF(MINUTE, prev.created_at, cur.created_at) AS reply_gap
            FROM messages cur
            JOIN messages prev ON prev.conversation_id = cur.conversation_id
                AND prev.id = (
                    SELECT MAX(p.id) FROM messages p
                    WHERE p.conversation_id = cur.conversation_id
                      AND p.id < cur.id
                )
            WHERE cur.sender_id = :id
              AND prev.sender_id != :id2
        ) gaps
        WHERE reply_gap <= 10080
    ");
    $rt_stmt->execute([':id' => $target_id, ':id2' => $target_id]);
    $avg_gap = $rt_stmt->fetchColumn();
    if ($avg_gap !== null && $avg_gap !== false) {
        $avg_response_minutes = round((float) $avg_gap);
    }
} catch (Exception $e) {
    // skip if query fails
}

// Build cosmetics object
$cosmetics = ['frame' => null, 'badge' => null, 'theme' => null];

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

json_response([
    'user' => [
        'id'              => (int) $row['id'],
        'email'           => $row['email'],
        'username'        => $row['username'],
        'first_name'      => $row['first_name'],
        'last_name'       => $row['last_name'],
        'bio'             => $row['bio'],
        'job'             => $row['job'],
        'is_student'      => (bool) $row['is_student'],
        'university'      => $resolved_university,
        'profile_image'   => $row['profile_image'],
        'verified'        => (bool) $row['verified'],
        'wants_to_offer'  => $row['wants_to_offer'],
        'wants_to_find'   => $row['wants_to_find'],
        'active_frame_id' => $row['active_frame_id'] ? (int) $row['active_frame_id'] : null,
        'active_badge_id' => $row['active_badge_id'] ? (int) $row['active_badge_id'] : null,
        'active_theme_id' => $row['active_theme_id'] ? (int) $row['active_theme_id'] : null,
        'cosmetics'       => $cosmetics,
        'member_since'    => $row['created_at'],
    ],
    'stats' => [
        'buzz_score'           => $buzz_score,
        'completed_orders'     => $completed_orders,
        'avg_response_minutes' => $avg_response_minutes,
        'active_services'      => $active_services,
    ],
]);
