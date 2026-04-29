<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('PATCH');

$user_id = require_auth();

$request_id = (int) ($_GET['id'] ?? 0);
if (!$request_id) {
    json_response(['error' => 'Request id is required (?id=X)'], 400);
}

// Verify ownership and that request is still open
$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ? AND requester_id = ?');
$stmt->execute([$request_id, $user_id]);
$request = $stmt->fetch();

if (!$request) {
    json_response(['error' => 'Request not found or you do not own it'], 404);
}

if ($request['status'] !== 'open') {
    json_response(['error' => 'Cannot edit a request that is no longer open'], 403);
}

$body = get_json_body();

$allowed_fields = ['title', 'category', 'description', 'budget_range', 'deadline'];
$valid_budgets = ['under-50','50-100','100-200','200-500','over-500','flexible'];

$updates = [];
$params  = [];

foreach ($allowed_fields as $field) {
    if (!array_key_exists($field, $body)) {
        continue;
    }

    $value = $body[$field];

    if ($field === 'title') {
        $value = trim($value);
        if ($value === '') {
            json_response(['error' => 'title cannot be empty'], 400);
        }
        if (mb_strlen($value) > 150) {
            json_response(['error' => 'title must be 150 characters or fewer'], 400);
        }
    }

    if ($field === 'category') {
        if (!in_array($value, valid_categories(), true)) {
            json_response(['error' => 'Invalid category'], 400);
        }
    }

    if ($field === 'description') {
        $value = trim($value);
        if ($value === '') {
            json_response(['error' => 'description cannot be empty'], 400);
        }
        if (mb_strlen($value) > 2000) {
            json_response(['error' => 'description must be 2000 characters or fewer'], 400);
        }
    }

    if ($field === 'budget_range') {
        if (!in_array($value, $valid_budgets, true)) {
            json_response(['error' => 'Invalid budget_range'], 400);
        }
    }

    if ($field === 'deadline') {
        if ($value !== null && $value !== '') {
            $value = trim($value);
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
                json_response(['error' => 'deadline must be in YYYY-MM-DD format'], 400);
            }
        } else {
            $value = null;
        }
    }

    $updates[] = "$field = ?";
    $params[]  = $value;
}

if (empty($updates)) {
    json_response(['error' => 'No valid fields to update'], 400);
}

$params[] = $request_id;
$sql = 'UPDATE requests SET ' . implode(', ', $updates) . ' WHERE id = ?';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// Return updated request
$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$request_id]);
$request = $stmt->fetch();

$request['id']           = (int) $request['id'];
$request['requester_id'] = (int) $request['requester_id'];

json_response(['request' => $request]);
