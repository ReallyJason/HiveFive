<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_feature($pdo, 'feature_messaging');

$user_id = require_auth();
$attachment_id = (int) ($_GET['id'] ?? 0);
$force_download = !empty($_GET['download']);

if ($attachment_id <= 0) {
    json_response(['error' => 'Attachment id is required'], 400);
}

$stmt = $pdo->prepare(
    'SELECT
        ma.id,
        ma.kind,
        ma.original_name,
        ma.mime_type,
        ma.storage_name,
        c.user_one_id,
        c.user_two_id
     FROM message_attachments ma
     JOIN messages m ON m.id = ma.message_id
     JOIN conversations c ON c.id = m.conversation_id
     WHERE ma.id = ?'
);
$stmt->execute([$attachment_id]);
$attachment = $stmt->fetch();

if (!$attachment) {
    json_response(['error' => 'Attachment not found'], 404);
}

if ($user_id !== (int) $attachment['user_one_id'] && $user_id !== (int) $attachment['user_two_id']) {
    json_response(['error' => 'Attachment not found or access denied'], 403);
}

$path = message_attachment_file_path($attachment['storage_name']);
if (!file_exists($path) || !is_readable($path)) {
    json_response(['error' => 'Attachment file is missing'], 404);
}

$mime = $attachment['mime_type'] ?: 'application/octet-stream';
$filename = sanitize_attachment_name($attachment['original_name'], pathinfo($path, PATHINFO_EXTENSION) ?: 'bin');
$disposition = (!$force_download && $attachment['kind'] === 'image') ? 'inline' : 'attachment';

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($path));
header("Content-Disposition: {$disposition}; filename*=UTF-8''" . rawurlencode($filename));
header('Cache-Control: private, max-age=86400');
header('X-Content-Type-Options: nosniff');
readfile($path);
exit;
