<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

$limit  = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));
$status = $_GET['status'] ?? 'all';

$conditions = ['n.user_id = :uid'];
if ($status === 'unread') {
    $conditions[] = 'n.is_read = 0';
} elseif ($status === 'read') {
    $conditions[] = 'n.is_read = 1';
}
$where_sql = implode(' AND ', $conditions);

// Fetch notifications
$stmt = $pdo->prepare(
    'SELECT n.id, n.type, n.title, n.body, n.link, n.is_read, n.created_at,
            u.first_name AS actor_first_name, u.last_name AS actor_last_name
     FROM notifications n
     LEFT JOIN users u ON n.actor_id = u.id
     WHERE ' . $where_sql . '
     ORDER BY n.created_at DESC
     LIMIT :lim OFFSET :off'
);
$stmt->bindValue('uid', $user_id, PDO::PARAM_INT);
$stmt->bindValue('lim', $limit, PDO::PARAM_INT);
$stmt->bindValue('off', $offset, PDO::PARAM_INT);
$stmt->execute();
$notifications = $stmt->fetchAll();

foreach ($notifications as &$n) {
    $n['id']      = (int) $n['id'];
    $n['is_read'] = (bool) $n['is_read'];
}

// Total count for the current filter
$count_stmt = $pdo->prepare(
    'SELECT COUNT(*)
     FROM notifications n
     WHERE ' . $where_sql
);
$count_stmt->bindValue('uid', $user_id, PDO::PARAM_INT);
$count_stmt->execute();
$total = (int) $count_stmt->fetchColumn();

// Unread count
$cnt = $pdo->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
$cnt->execute([$user_id]);
$unread = (int) $cnt->fetchColumn();

json_response([
    'notifications' => $notifications,
    'unread_count'  => $unread,
    'pagination'    => [
        'limit'  => $limit,
        'offset' => $offset,
        'total'  => $total,
    ],
]);
