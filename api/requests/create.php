<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');
require_feature($pdo, 'feature_requests');

$user_id = require_auth();
$body = get_json_body();

$title        = trim($body['title'] ?? '');
$category     = trim($body['category'] ?? '');
$description  = trim($body['description'] ?? '');
$budget_range = trim($body['budget_range'] ?? '');
$deadline     = trim($body['deadline'] ?? '');

// Validate required fields
if (!$title || !$category || !$description || !$budget_range) {
    json_response(['error' => 'title, category, description, and budget_range are required'], 400);
}

// Length validation
if (mb_strlen($title) > 150) {
    json_response(['error' => 'Title must be 150 characters or less'], 400);
}
if (mb_strlen($description) > 2000) {
    json_response(['error' => 'Description must be 2,000 characters or less'], 400);
}

if (!in_array($category, valid_categories(), true)) {
    json_response(['error' => 'Invalid category'], 400);
}

$valid_budgets = ['under-50','50-100','100-200','200-500','over-500','flexible'];
if (!in_array($budget_range, $valid_budgets, true)) {
    json_response(['error' => 'Invalid budget_range'], 400);
}

// Validate deadline if provided
if ($deadline && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadline)) {
    json_response(['error' => 'deadline must be in YYYY-MM-DD format'], 400);
}

$stmt = $pdo->prepare(
    'INSERT INTO requests (requester_id, title, category, description, budget_range, deadline)
     VALUES (?, ?, ?, ?, ?, ?)'
);
$stmt->execute([$user_id, $title, $category, $description, $budget_range, $deadline ?: null]);
$request_id = (int) $pdo->lastInsertId();

// Fetch the created request
$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$request_id]);
$request = $stmt->fetch();

$request['id']           = (int) $request['id'];
$request['requester_id'] = (int) $request['requester_id'];

json_response(['request' => $request], 201);
