<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_feature($pdo, 'feature_requests');

$user_id = require_auth();
$method = $_SERVER['REQUEST_METHOD'];

// ───────────────────────────────────────────────
// GET — List proposals for a request
// ───────────────────────────────────────────────
if ($method === 'GET') {
    $request_id = (int) ($_GET['request_id'] ?? 0);
    if (!$request_id) {
        json_response(['error' => 'request_id query parameter is required'], 400);
    }

    // Check if the authenticated user is the request owner
    $stmt = $pdo->prepare('SELECT requester_id FROM requests WHERE id = ?');
    $stmt->execute([$request_id]);
    $request = $stmt->fetch();

    if (!$request) {
        json_response(['error' => 'Request not found'], 404);
    }

    $is_owner = ((int) $request['requester_id'] === $user_id);

    if ($is_owner) {
        // Request owner sees all proposals with provider info
        $stmt = $pdo->prepare(
            'SELECT p.*, u.first_name, u.last_name, u.username, u.profile_image
             FROM proposals p
             JOIN users u ON p.provider_id = u.id
             WHERE p.request_id = ?
             ORDER BY p.created_at DESC'
        );
        $stmt->execute([$request_id]);
    } else {
        // Others only see their own proposals
        $stmt = $pdo->prepare(
            'SELECT p.*, u.first_name, u.last_name, u.username, u.profile_image
             FROM proposals p
             JOIN users u ON p.provider_id = u.id
             WHERE p.request_id = ? AND p.provider_id = ?
             ORDER BY p.created_at DESC'
        );
        $stmt->execute([$request_id, $user_id]);
    }

    $proposals = $stmt->fetchAll();

    foreach ($proposals as &$p) {
        $p['id']          = (int) $p['id'];
        $p['request_id']  = (int) $p['request_id'];
        $p['provider_id'] = (int) $p['provider_id'];
        $p['price']       = (float) $p['price'];
    }

    json_response(['proposals' => $proposals]);
}

// ───────────────────────────────────────────────
// POST — Submit a proposal
// ───────────────────────────────────────────────
if ($method === 'POST') {
    $body = get_json_body();

    $request_id         = (int) ($body['request_id'] ?? 0);
    $price              = $body['price'] ?? null;
    $message            = trim($body['message'] ?? '');
    $estimated_delivery = trim($body['estimated_delivery'] ?? '');
    $scheduled_date     = trim($body['scheduled_date'] ?? '');
    $scheduled_time     = trim($body['scheduled_time'] ?? '');

    if (!$request_id || $price === null || !$message) {
        json_response(['error' => 'request_id, price, and message are required'], 400);
    }

    // Length validation
    if (mb_strlen($message) > 1000) {
        json_response(['error' => 'Message must be 1,000 characters or less'], 400);
    }

    $price = (float) $price;
    if ($price <= 0) {
        json_response(['error' => 'Price must be positive'], 400);
    }

    // Verify the request exists and is open
    $stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
    $stmt->execute([$request_id]);
    $request = $stmt->fetch();

    if (!$request) {
        json_response(['error' => 'Request not found'], 404);
    }

    if ($request['status'] !== 'open') {
        json_response(['error' => 'This request is no longer accepting proposals'], 400);
    }

    // Cannot propose on your own request
    if ((int) $request['requester_id'] === $user_id) {
        json_response(['error' => 'You cannot submit a proposal on your own request'], 400);
    }

    // Check for existing proposal (UNIQUE constraint)
    $stmt = $pdo->prepare('SELECT id FROM proposals WHERE request_id = ? AND provider_id = ?');
    $stmt->execute([$request_id, $user_id]);
    if ($stmt->fetch()) {
        json_response(['error' => 'You have already submitted a proposal for this request'], 409);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO proposals (request_id, provider_id, price, message, estimated_delivery, scheduled_date, scheduled_time)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $request_id, $user_id, $price, $message,
        $estimated_delivery ?: null,
        $scheduled_date ?: null,
        $scheduled_time ?: null,
    ]);
    $proposal_id = (int) $pdo->lastInsertId();

    // Fetch the created proposal
    $stmt = $pdo->prepare(
        'SELECT p.*, u.first_name, u.last_name, u.username
         FROM proposals p
         JOIN users u ON p.provider_id = u.id
         WHERE p.id = ?'
    );
    $stmt->execute([$proposal_id]);
    $proposal = $stmt->fetch();

    $proposal['id']          = (int) $proposal['id'];
    $proposal['request_id']  = (int) $proposal['request_id'];
    $proposal['provider_id'] = (int) $proposal['provider_id'];
    $proposal['price']       = (float) $proposal['price'];

    // Notify the request owner about the new proposal
    $requester_id = (int) $request['requester_id'];
    $provider_name = $proposal['first_name'] . ' ' . $proposal['last_name'];
    create_notification(
        $pdo, $requester_id, 'proposal',
        'New proposal received',
        "{$provider_name} submitted a proposal for ⬡ {$price} on \"{$request['title']}\"",
        '/discover?tab=requests',
        $user_id
    );

    json_response(['proposal' => $proposal], 201);
}

// ───────────────────────────────────────────────
// PATCH — Update own proposal
// ───────────────────────────────────────────────
if ($method === 'PATCH') {
    $proposal_id = (int) ($_GET['id'] ?? 0);
    if (!$proposal_id) {
        json_response(['error' => 'Proposal id is required (?id=X)'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM proposals WHERE id = ? AND provider_id = ?');
    $stmt->execute([$proposal_id, $user_id]);
    $proposal = $stmt->fetch();

    if (!$proposal) {
        json_response(['error' => 'Proposal not found or you do not own it'], 404);
    }

    $body = get_json_body();
    $updates = [];
    $params  = [];

    if (isset($body['price'])) {
        $price = (float) $body['price'];
        if ($price <= 0) json_response(['error' => 'Price must be positive'], 400);
        $updates[] = 'price = ?';
        $params[]  = $price;
    }
    if (isset($body['message'])) {
        $msg = trim($body['message']);
        if (!$msg) json_response(['error' => 'Message cannot be empty'], 400);
        if (mb_strlen($msg) > 1000) {
            json_response(['error' => 'Message must be 1,000 characters or less'], 400);
        }
        $updates[] = 'message = ?';
        $params[]  = $msg;
    }
    if (isset($body['estimated_delivery'])) {
        $updates[] = 'estimated_delivery = ?';
        $params[]  = trim($body['estimated_delivery']) ?: null;
    }
    if (isset($body['scheduled_date'])) {
        $updates[] = 'scheduled_date = ?';
        $params[]  = trim($body['scheduled_date']) ?: null;
    }
    if (isset($body['scheduled_time'])) {
        $updates[] = 'scheduled_time = ?';
        $params[]  = trim($body['scheduled_time']) ?: null;
    }

    if (empty($updates)) {
        json_response(['error' => 'No fields to update'], 400);
    }

    $params[] = $proposal_id;
    $sql = 'UPDATE proposals SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $pdo->prepare($sql)->execute($params);

    // Return updated proposal
    $stmt = $pdo->prepare(
        'SELECT p.*, u.first_name AS provider_first_name, u.last_name AS provider_last_name, u.username AS provider_username
         FROM proposals p JOIN users u ON p.provider_id = u.id WHERE p.id = ?'
    );
    $stmt->execute([$proposal_id]);
    $updated = $stmt->fetch();
    $updated['id']          = (int) $updated['id'];
    $updated['request_id']  = (int) $updated['request_id'];
    $updated['provider_id'] = (int) $updated['provider_id'];
    $updated['price']       = (float) $updated['price'];

    json_response(['proposal' => $updated]);
}

// ───────────────────────────────────────────────
// DELETE — Withdraw own proposal
// ───────────────────────────────────────────────
if ($method === 'DELETE') {
    $proposal_id = (int) ($_GET['id'] ?? 0);
    if (!$proposal_id) {
        json_response(['error' => 'Proposal id is required (?id=X)'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM proposals WHERE id = ? AND provider_id = ?');
    $stmt->execute([$proposal_id, $user_id]);
    if (!$stmt->fetch()) {
        json_response(['error' => 'Proposal not found or you do not own it'], 404);
    }

    $pdo->prepare('DELETE FROM proposals WHERE id = ?')->execute([$proposal_id]);
    json_response(['deleted' => true]);
}

// Unsupported method
json_response(['error' => 'Method not allowed'], 405);
