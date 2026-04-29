<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');
require_feature($pdo, 'feature_messaging');

$user_id = require_auth();
$data    = get_json_body();

$conversation_id = isset($data['conversation_id']) ? (int) $data['conversation_id'] : null;
$recipient_id    = isset($data['recipient_id']) ? (int) $data['recipient_id'] : null;
$body            = trim((string) ($data['body'] ?? ''));
$attachments     = $data['attachments'] ?? [];
$context_type    = $data['context_type'] ?? null;
$context_id      = isset($data['context_id']) ? (int) $data['context_id'] : null;
$context_title   = isset($data['context_title']) ? trim((string) $data['context_title']) : null;
$valid_ctx_types = ['service', 'order', 'request'];
if ($context_type && !in_array($context_type, $valid_ctx_types, true)) {
    $context_type = null;
}

if (!is_array($attachments)) {
    json_response(['error' => 'attachments must be an array'], 400);
}
if ($body === '' && count($attachments) === 0) {
    json_response(['error' => 'Message text or an attachment is required'], 400);
}
if (mb_strlen($body) > 5000) {
    json_response(['error' => 'Message body must be 5,000 characters or less'], 400);
}
if (!$conversation_id && !$recipient_id) {
    json_response(['error' => 'conversation_id or recipient_id is required'], 400);
}

$message_id = 0;
$stored_attachment_files = [];
$stored_attachments = [];
$conversation_preview = '';
$msg_recipient_id = 0;

try {
    $pdo->beginTransaction();

    // If no conversation_id, find or create a conversation with the recipient.
    if (!$conversation_id) {
        if ($recipient_id === $user_id) {
            throw new RuntimeException('Cannot message yourself');
        }

        $stmt = $pdo->prepare('SELECT id FROM users WHERE id = :rid');
        $stmt->execute([':rid' => $recipient_id]);
        if (!$stmt->fetch()) {
            throw new RuntimeException('Recipient not found');
        }

        $uid_one = min($user_id, $recipient_id);
        $uid_two = max($user_id, $recipient_id);

        $stmt = $pdo->prepare(
            'SELECT id FROM conversations WHERE user_one_id = :one AND user_two_id = :two FOR UPDATE'
        );
        $stmt->execute([':one' => $uid_one, ':two' => $uid_two]);
        $existing = $stmt->fetch();

        if ($existing) {
            $conversation_id = (int) $existing['id'];
            if ($context_type && $context_id) {
                $stmt = $pdo->prepare(
                    'UPDATE conversations
                     SET context_type = :ct, context_id = :ci, context_title = :ctitle
                     WHERE id = :cid'
                );
                $stmt->execute([
                    ':ct' => $context_type,
                    ':ci' => $context_id,
                    ':ctitle' => $context_title,
                    ':cid' => $conversation_id,
                ]);
            }
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO conversations (user_one_id, user_two_id, last_message, last_message_at, context_type, context_id, context_title, created_at)
                 VALUES (:one, :two, \'\', NOW(), :ct, :ci, :ctitle, NOW())'
            );
            $stmt->execute([
                ':one' => $uid_one,
                ':two' => $uid_two,
                ':ct' => $context_type,
                ':ci' => $context_id,
                ':ctitle' => $context_title,
            ]);
            $conversation_id = (int) $pdo->lastInsertId();
        }
    } else {
        $stmt = $pdo->prepare(
            'SELECT id FROM conversations
             WHERE id = :cid AND (user_one_id = :uid1 OR user_two_id = :uid2)
             FOR UPDATE'
        );
        $stmt->execute([
            ':cid' => $conversation_id,
            ':uid1' => $user_id,
            ':uid2' => $user_id,
        ]);
        if (!$stmt->fetch()) {
            throw new RuntimeException('Conversation not found or access denied');
        }

        if ($context_type && $context_id) {
            $stmt = $pdo->prepare(
                'UPDATE conversations SET context_type = :ct, context_id = :ci, context_title = :ctitle WHERE id = :cid'
            );
            $stmt->execute([
                ':ct' => $context_type,
                ':ci' => $context_id,
                ':ctitle' => $context_title,
                ':cid' => $conversation_id,
            ]);
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO messages (conversation_id, sender_id, body, created_at)
         VALUES (:cid, :sid, :body, NOW())'
    );
    $stmt->execute([
        ':cid' => $conversation_id,
        ':sid' => $user_id,
        ':body' => $body,
    ]);
    $message_id = (int) $pdo->lastInsertId();

    if (count($attachments) > 0) {
        $persisted = persist_message_attachments($pdo, $message_id, $attachments);
        $stored_attachments = $persisted['attachments'];
        $stored_attachment_files = $persisted['stored_files'];
    }

    $conversation_preview = message_preview_text($body, $stored_attachments);
    $stmt = $pdo->prepare(
        'UPDATE conversations
         SET last_message = :lm, last_message_at = NOW()
         WHERE id = :cid'
    );
    $stmt->execute([
        ':lm' => $conversation_preview,
        ':cid' => $conversation_id,
    ]);

    $conv_stmt = $pdo->prepare('SELECT user_one_id, user_two_id FROM conversations WHERE id = ?');
    $conv_stmt->execute([$conversation_id]);
    $conv = $conv_stmt->fetch();
    $msg_recipient_id = ((int) $conv['user_one_id'] === $user_id) ? (int) $conv['user_two_id'] : (int) $conv['user_one_id'];

    $pdo->commit();
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (!empty($stored_attachment_files)) {
        delete_message_attachment_files($stored_attachment_files);
    }

    $message = $e->getMessage();
    $status = match ($message) {
        'Recipient not found' => 404,
        'Conversation not found or access denied' => 403,
        default => 400,
    };
    json_response(['error' => $message], $status);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (!empty($stored_attachment_files)) {
        delete_message_attachment_files($stored_attachment_files);
    }
    json_response(['error' => 'Failed to send message'], 500);
}

$sender_stmt = $pdo->prepare('SELECT first_name, last_name FROM users WHERE id = ?');
$sender_stmt->execute([$user_id]);
$sender_info = $sender_stmt->fetch();
$sender_name = trim(($sender_info['first_name'] ?? '') . ' ' . ($sender_info['last_name'] ?? ''));
$plain_body = message_preview_text($body, []);

$notification_body = $body !== ''
    ? "{$sender_name}: " . mb_substr($plain_body, 0, 120)
    : ($sender_name . ' ' . lcfirst($conversation_preview));

try {
    create_notification(
        $pdo,
        $msg_recipient_id,
        'message',
        'New message',
        $notification_body,
        '/messages?conversationId=' . $conversation_id,
        $user_id
    );
} catch (Throwable $e) {
    // Message send already succeeded; skip notification side-effect failures.
}

$stmt = $pdo->prepare(
    'SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.body,
        m.read_at,
        m.created_at,
        u.first_name AS sender_first_name,
        u.last_name  AS sender_last_name,
        u.username   AS sender_username,
        u.profile_image AS sender_profile_image
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.id = :mid'
);
$stmt->execute([':mid' => $message_id]);
$msg = $stmt->fetch();

json_response([
    'conversation_preview' => $conversation_preview,
    'message' => [
        'id' => (int) $msg['id'],
        'conversation_id' => (int) $msg['conversation_id'],
        'sender_id' => (int) $msg['sender_id'],
        'body' => $msg['body'],
        'read_at' => $msg['read_at'],
        'created_at' => $msg['created_at'],
        'attachments' => $stored_attachments,
        'sender' => [
            'first_name' => $msg['sender_first_name'],
            'last_name' => $msg['sender_last_name'],
            'username' => $msg['sender_username'],
            'profile_image' => $msg['sender_profile_image'],
        ],
    ],
], 201);
