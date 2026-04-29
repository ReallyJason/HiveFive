<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_feature($pdo, 'feature_messaging');

$user_id = require_auth();

// Fetch all conversations this user is part of
$sql = "
    SELECT
        c.id              AS conversation_id,
        c.user_one_id,
        c.user_two_id,
        c.last_message,
        c.last_message_at,
        c.context_type,
        c.context_id,
        c.context_title,
        c.created_at,
        u.id              AS other_user_id,
        u.first_name      AS other_first_name,
        u.last_name       AS other_last_name,
        u.username         AS other_username,
        u.profile_image   AS other_profile_image,
        u.last_seen_at    AS other_last_seen_at,
        frame_item.metadata AS frame_metadata,
        badge_item.metadata AS badge_metadata,
        (
            SELECT COUNT(*)
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.sender_id != :uid_unread
              AND m.read_at IS NULL
        ) AS unread_count
    FROM conversations c
    JOIN users u
        ON u.id = CASE
            WHEN c.user_one_id = :uid_case THEN c.user_two_id
            ELSE c.user_one_id
        END
    LEFT JOIN shop_items frame_item ON frame_item.id = u.active_frame_id
    LEFT JOIN shop_items badge_item ON badge_item.id = u.active_badge_id
    WHERE c.user_one_id = :uid_one OR c.user_two_id = :uid_two
    ORDER BY c.last_message_at DESC
";

$stmt = $pdo->prepare($sql);
$stmt->execute([
    ':uid_unread' => $user_id,
    ':uid_case'   => $user_id,
    ':uid_one'    => $user_id,
    ':uid_two'    => $user_id,
]);

$conversations = $stmt->fetchAll();

$now = time();

$results = array_map(function ($row) use ($now) {
    $other_name = trim($row['other_first_name'] . ' ' . $row['other_last_name']);
    $initial    = mb_strtoupper(mb_substr($row['other_first_name'] ?: $row['other_username'], 0, 1));

    $online = false;
    if ($row['other_last_seen_at']) {
        $seen = strtotime($row['other_last_seen_at']);
        $online = ($now - $seen) <= 300; // 5 minutes
    }

    return [
        'conversation_id'    => (int) $row['conversation_id'],
        'other_user'         => [
            'id'            => (int) $row['other_user_id'],
            'name'          => $other_name,
            'initial'       => $initial,
            'username'      => $row['other_username'],
            'profile_image' => $row['other_profile_image'],
            'online'        => $online,
            'cosmetics'     => build_cosmetics_from_row($row),
        ],
        'last_message'       => $row['last_message'],
        'last_message_at'    => $row['last_message_at'],
        'unread_count'       => (int) $row['unread_count'],
        'context_type'       => $row['context_type'],
        'context_id'         => $row['context_id'] ? (int) $row['context_id'] : null,
        'context_title'      => $row['context_title'],
        'created_at'         => $row['created_at'],
    ];
}, $conversations);

json_response(['conversations' => $results]);
