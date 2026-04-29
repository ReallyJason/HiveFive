<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_feature($pdo, 'feature_messaging');

$user_id = require_auth();

$conversation_id = isset($_GET['conversation_id']) ? (int) $_GET['conversation_id'] : 0;
if ($conversation_id <= 0) {
    json_response(['error' => 'conversation_id is required'], 400);
}

// Verify user is a participant in this conversation
$stmt = $pdo->prepare("
    SELECT id FROM conversations
    WHERE id = :cid AND (user_one_id = :uid1 OR user_two_id = :uid2)
");
$stmt->execute([
    ':cid'  => $conversation_id,
    ':uid1' => $user_id,
    ':uid2' => $user_id,
]);

if (!$stmt->fetch()) {
    json_response(['error' => 'Conversation not found or access denied'], 403);
}

// Mark unread messages from the other person as read
$markRead = $pdo->prepare("
    UPDATE messages
    SET read_at = NOW()
    WHERE conversation_id = :cid
      AND sender_id != :uid
      AND read_at IS NULL
");
$markRead->execute([
    ':cid' => $conversation_id,
    ':uid'  => $user_id,
]);

// Pagination
$page  = max(1, (int) ($_GET['page'] ?? 1));
$limit = 50;
$offset = ($page - 1) * $limit;

// Total count for pagination metadata
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM messages WHERE conversation_id = :cid");
$countStmt->execute([':cid' => $conversation_id]);
$total = (int) $countStmt->fetchColumn();

// Fetch messages with sender info
$sql = "
    SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.body,
        m.read_at,
        m.created_at,
        u.first_name AS sender_first_name,
        u.last_name  AS sender_last_name,
        u.username    AS sender_username,
        u.profile_image AS sender_profile_image
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = :cid
    ORDER BY m.created_at ASC
    LIMIT :lim OFFSET :off
";

$stmt = $pdo->prepare($sql);
$stmt->bindValue(':cid', $conversation_id, PDO::PARAM_INT);
$stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset, PDO::PARAM_INT);
$stmt->execute();

$rows = $stmt->fetchAll();
$attachments_by_message = load_message_attachments($pdo, array_map(
    static fn($row) => (int) $row['id'],
    $rows
));

$messages = array_map(function ($row) use ($attachments_by_message) {
    $message_id = (int) $row['id'];
    return [
        'id'              => $message_id,
        'conversation_id' => (int) $row['conversation_id'],
        'sender_id'       => (int) $row['sender_id'],
        'body'            => $row['body'],
        'read_at'         => $row['read_at'],
        'created_at'      => $row['created_at'],
        'attachments'     => $attachments_by_message[$message_id] ?? [],
        'sender'          => [
            'first_name'    => $row['sender_first_name'],
            'last_name'     => $row['sender_last_name'],
            'username'      => $row['sender_username'],
            'profile_image' => $row['sender_profile_image'],
        ],
    ];
}, $rows);

json_response([
    'messages'   => $messages,
    'pagination' => [
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $total,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
