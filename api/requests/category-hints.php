<?php
require_once __DIR__ . '/../db_config.php';
require_once __DIR__ . '/../helpers.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$category = $_GET['category'] ?? '';
if (!$category) {
    http_response_code(400);
    echo json_encode(['error' => 'category is required']);
    exit;
}

// 1) Price range of active services in this category
$stmt = $pdo->prepare("
    SELECT MIN(price) AS min_price, MAX(price) AS max_price, AVG(price) AS avg_price, COUNT(*) AS count
    FROM services
    WHERE category = ? AND is_active = 1
");
$stmt->execute([$category]);
$pricing = $stmt->fetch();

// 2) Average number of proposals per request in this category
$stmt = $pdo->prepare("
    SELECT
        AVG(proposal_count) AS avg_proposals,
        COUNT(*) AS total_requests
    FROM (
        SELECT r.id, COUNT(p.id) AS proposal_count
        FROM requests r
        LEFT JOIN proposals p ON p.request_id = r.id
        WHERE r.category = ?
        GROUP BY r.id
    ) sub
");
$stmt->execute([$category]);
$proposals = $stmt->fetch();

// 3) Median time to first proposal (in hours)
$stmt = $pdo->prepare("
    SELECT TIMESTAMPDIFF(HOUR, r.created_at, MIN(p.created_at)) AS hours_to_first
    FROM requests r
    JOIN proposals p ON p.request_id = r.id
    WHERE r.category = ?
    GROUP BY r.id
    ORDER BY hours_to_first
");
$stmt->execute([$category]);
$times = $stmt->fetchAll(PDO::FETCH_COLUMN);
$median_hours = null;
if (count($times) > 0) {
    $mid = intdiv(count($times), 2);
    $median_hours = count($times) % 2 === 0
        ? ($times[$mid - 1] + $times[$mid]) / 2
        : $times[$mid];
}

echo json_encode([
    'pricing' => [
        'min'   => $pricing['min_price'] ? (float)$pricing['min_price'] : null,
        'max'   => $pricing['max_price'] ? (float)$pricing['max_price'] : null,
        'avg'   => $pricing['avg_price'] ? round((float)$pricing['avg_price']) : null,
        'count' => (int)$pricing['count'],
    ],
    'proposals' => [
        'avg_per_request'    => $proposals['avg_proposals'] ? round((float)$proposals['avg_proposals'], 1) : null,
        'total_requests'     => (int)$proposals['total_requests'],
        'median_hours_to_first' => $median_hours !== null ? (int)$median_hours : null,
    ],
]);
