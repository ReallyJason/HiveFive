<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('DELETE');

$user_id = require_auth();
$body    = get_json_body();

$ids = [];
if (!empty($body['ids']) && is_array($body['ids'])) {
    foreach ($body['ids'] as $raw_id) {
        $id = (int) $raw_id;
        if ($id > 0) {
            $ids[$id] = $id;
        }
    }
} elseif (!empty($body['id'])) {
    $id = (int) $body['id'];
    if ($id > 0) {
        $ids[$id] = $id;
    }
}

if (!empty($ids)) {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $params = array_merge(array_values($ids), [$user_id]);
    $stmt = $pdo->prepare(
        "DELETE FROM notifications
         WHERE id IN ($placeholders) AND user_id = ?"
    );
    $stmt->execute($params);
} else {
    $stmt = $pdo->prepare('DELETE FROM notifications WHERE user_id = ?');
    $stmt->execute([$user_id]);
}

$cnt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
$cnt->execute([$user_id]);

json_response([
    'unread_count' => (int) $cnt->fetchColumn(),
    'deleted_count' => $stmt->rowCount(),
]);
