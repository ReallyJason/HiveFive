<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

// Pagination
$page   = max(1, (int) ($_GET['page'] ?? 1));
$limit  = 20;
$offset = ($page - 1) * $limit;

// Total count
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM transactions WHERE user_id = :id");
$countStmt->execute([':id' => $user_id]);
$total = (int) $countStmt->fetchColumn();

// Fetch transactions
$stmt = $pdo->prepare("
    SELECT id, type, amount, description, order_id, created_at
    FROM transactions
    WHERE user_id = :id
    ORDER BY created_at DESC
    LIMIT :lim OFFSET :off
");
$stmt->bindValue(':id', $user_id, PDO::PARAM_INT);
$stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
$stmt->bindValue(':off', $offset, PDO::PARAM_INT);
$stmt->execute();

$transactions = array_map(function ($row) {
    return [
        'id'          => (int) $row['id'],
        'type'        => $row['type'],
        'amount'      => (float) $row['amount'],
        'description' => $row['description'],
        'order_id'    => $row['order_id'] ? (int) $row['order_id'] : null,
        'created_at'  => $row['created_at'],
    ];
}, $stmt->fetchAll());

json_response([
    'transactions' => $transactions,
    'pagination'   => [
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $total,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
