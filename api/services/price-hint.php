<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$category = $_GET['category'] ?? '';

if (trim($category) === '') {
    json_response(['error' => 'category is required'], 400);
}

$stmt = $pdo->prepare("
    SELECT
        ROUND(MIN(price)) AS min_price,
        ROUND(MAX(price)) AS max_price,
        ROUND(AVG(price)) AS avg_price,
        COUNT(*)           AS total
    FROM services
    WHERE is_active = 1 AND category = :category AND price > 0
");
$stmt->execute([':category' => $category]);
$row = $stmt->fetch();

$total = (int) ($row['total'] ?? 0);

if ($total < 3) {
    // Not enough data for a meaningful range
    json_response(['hint' => null, 'total' => $total]);
}

json_response([
    'hint' => [
        'min' => (int) $row['min_price'],
        'max' => (int) $row['max_price'],
        'avg' => (int) $row['avg_price'],
    ],
    'total' => $total,
]);
