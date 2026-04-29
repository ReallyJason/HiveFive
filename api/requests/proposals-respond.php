<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_feature($pdo, 'feature_requests');

$user_id = require_auth();
require_method('PATCH');

// ───────────────────────────────────────────────
// PATCH — Accept or reject a proposal (request owner only)
// ───────────────────────────────────────────────

$proposal_id = (int) ($_GET['id'] ?? 0);
if (!$proposal_id) {
    json_response(['error' => 'Proposal id is required (?id=X)'], 400);
}

$body   = get_json_body();
$action = $body['action'] ?? '';

if (!in_array($action, ['accept', 'reject'], true)) {
    json_response(['error' => 'Action must be "accept" or "reject"'], 400);
}

// Fetch the proposal — must be pending
$stmt = $pdo->prepare('SELECT * FROM proposals WHERE id = ?');
$stmt->execute([$proposal_id]);
$proposal = $stmt->fetch();

if (!$proposal) {
    json_response(['error' => 'Proposal not found'], 404);
}
if ($proposal['status'] !== 'pending') {
    json_response(['error' => 'Proposal is no longer pending'], 400);
}

// Fetch the request — verify the authenticated user is the owner
$stmt = $pdo->prepare('SELECT * FROM requests WHERE id = ?');
$stmt->execute([$proposal['request_id']]);
$request = $stmt->fetch();

if (!$request) {
    json_response(['error' => 'Associated request not found'], 404);
}
if ((int) $request['requester_id'] !== $user_id) {
    json_response(['error' => 'Only the request owner can respond to proposals'], 403);
}

// ───────────────────────────────────────────────
// REJECT
// ───────────────────────────────────────────────
if ($action === 'reject') {
    $stmt = $pdo->prepare(
        'UPDATE proposals SET status = ?, responded_at = NOW() WHERE id = ?'
    );
    $stmt->execute(['rejected', $proposal_id]);

    // Notify the provider
    create_notification(
        $pdo,
        (int) $proposal['provider_id'],
        'proposal',
        'Proposal declined',
        "Your proposal on \"{$request['title']}\" was declined.",
        '/discover',
        $user_id
    );

    // Return updated proposal
    $stmt = $pdo->prepare('SELECT * FROM proposals WHERE id = ?');
    $stmt->execute([$proposal_id]);
    $updated = $stmt->fetch();
    $updated['id']          = (int) $updated['id'];
    $updated['request_id']  = (int) $updated['request_id'];
    $updated['provider_id'] = (int) $updated['provider_id'];
    $updated['price']       = (float) $updated['price'];

    json_response(['proposal' => $updated]);
}

// ───────────────────────────────────────────────
// ACCEPT
// ───────────────────────────────────────────────
$request_id  = (int) $proposal['request_id'];
$requester_id = $user_id;
$provider_id = (int) $proposal['provider_id'];
$other_proposals = [];

$pdo->beginTransaction();

try {
    // Re-lock request row to serialize accepts on this request and re-check state.
    $stmt = $pdo->prepare(
        'SELECT id, requester_id, title, status FROM requests WHERE id = ? FOR UPDATE'
    );
    $stmt->execute([$request_id]);
    $locked_request = $stmt->fetch();

    if (!$locked_request) {
        $pdo->rollBack();
        json_response(['error' => 'Associated request not found'], 404);
    }
    if ((int) $locked_request['requester_id'] !== $requester_id) {
        $pdo->rollBack();
        json_response(['error' => 'Only the request owner can respond to proposals'], 403);
    }
    if ($locked_request['status'] !== 'open') {
        $pdo->rollBack();
        json_response(['error' => 'This request is no longer accepting proposals'], 400);
    }

    // Re-lock proposal row and ensure it is still pending.
    $stmt = $pdo->prepare('SELECT * FROM proposals WHERE id = ? FOR UPDATE');
    $stmt->execute([$proposal_id]);
    $locked_proposal = $stmt->fetch();

    if (!$locked_proposal) {
        $pdo->rollBack();
        json_response(['error' => 'Proposal not found'], 404);
    }
    if ((int) $locked_proposal['request_id'] !== $request_id) {
        $pdo->rollBack();
        json_response(['error' => 'Proposal no longer belongs to this request'], 400);
    }
    if ($locked_proposal['status'] !== 'pending') {
        $pdo->rollBack();
        json_response(['error' => 'Proposal is no longer pending'], 400);
    }

    // Defensive guard for inconsistent data states.
    $stmt = $pdo->prepare(
        'SELECT id FROM proposals WHERE request_id = ? AND status = ? LIMIT 1'
    );
    $stmt->execute([$request_id, 'accepted']);
    if ($stmt->fetch()) {
        $pdo->rollBack();
        json_response(['error' => 'A proposal has already been accepted for this request'], 400);
    }

    $provider_id = (int) $locked_proposal['provider_id'];
    $price       = (float) $locked_proposal['price'];
    $service_fee = calculate_service_fee($price);
    $total       = round_money($price + $service_fee);

    // Lock the requester's balance and verify sufficient funds
    $stmt = $pdo->prepare(
        'SELECT hivecoin_balance FROM users WHERE id = ? FOR UPDATE'
    );
    $stmt->execute([$requester_id]);
    $requester = $stmt->fetch();

    if ((float) $requester['hivecoin_balance'] < $total) {
        $pdo->rollBack();
        json_response(['error' => 'Insufficient HiveCoin balance'], 400);
    }

    // Deduct total from requester's balance
    $stmt = $pdo->prepare(
        'UPDATE users SET hivecoin_balance = hivecoin_balance - ? WHERE id = ?'
    );
    $stmt->execute([$total, $requester_id]);

    // Create order (service_id is NULL for proposal-based orders)
    // Copy scheduled_date/time from proposal if set
    $sched_date = $locked_proposal['scheduled_date'] ?? null;
    $sched_time = $locked_proposal['scheduled_time'] ?? null;

    $stmt = $pdo->prepare(
        'INSERT INTO orders (
            service_id, provider_id, client_id, request_id, pricing_type_snapshot, unit_label_snapshot,
            unit_rate, requested_units, authorized_units,
            price, service_fee, total, status, payment_status, scheduled_date, scheduled_time
         )
         VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $provider_id,
        $requester_id,
        $request_id,
        'flat',
        null,
        $price,
        1.0,
        1.0,
        $price,
        $service_fee,
        $total,
        'pending',
        'held_in_escrow',
        $sched_date,
        $sched_time,
    ]);
    $order_id = (int) $pdo->lastInsertId();

    // Record spending transaction for requester
    $stmt = $pdo->prepare(
        'INSERT INTO transactions (user_id, type, amount, description, order_id)
         VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $requester_id,
        'spending',
        $total,
        "Payment for request order #{$order_id}",
        $order_id,
    ]);

    // Accept this proposal
    $stmt = $pdo->prepare(
        'UPDATE proposals SET status = ?, responded_at = NOW() WHERE id = ?'
    );
    $stmt->execute(['accepted', $proposal_id]);

    // Update request status to in_progress
    $stmt = $pdo->prepare(
        'UPDATE requests SET status = ? WHERE id = ?'
    );
    $stmt->execute(['in_progress', $request_id]);

    // Keep title in sync for notifications after commit.
    $request['title'] = $locked_request['title'];

    // Reject all other pending proposals on this request
    $stmt = $pdo->prepare(
        'SELECT id, provider_id FROM proposals
         WHERE request_id = ? AND id != ? AND status = ?'
    );
    $stmt->execute([$request_id, $proposal_id, 'pending']);
    $other_proposals = $stmt->fetchAll();

    if (!empty($other_proposals)) {
        $stmt = $pdo->prepare(
            'UPDATE proposals SET status = ?, responded_at = NOW()
             WHERE request_id = ? AND id != ? AND status = ?'
        );
        $stmt->execute(['rejected', $request_id, $proposal_id, 'pending']);
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    json_response(['error' => 'Failed to process acceptance: ' . $e->getMessage()], 500);
}

// Notify accepted provider
create_notification(
    $pdo,
    $provider_id,
    'proposal',
    'Proposal accepted!',
    "Your proposal on \"{$request['title']}\" was accepted!",
    '/orders',
    $user_id
);

// Notify rejected providers
foreach ($other_proposals as $op) {
    create_notification(
        $pdo,
        (int) $op['provider_id'],
        'proposal',
        'Proposal not selected',
        "Your proposal on \"{$request['title']}\" was not selected.",
        '/discover',
        $user_id
    );
}

// Return the updated proposal
$stmt = $pdo->prepare('SELECT * FROM proposals WHERE id = ?');
$stmt->execute([$proposal_id]);
$updated = $stmt->fetch();
$updated['id']          = (int) $updated['id'];
$updated['request_id']  = (int) $updated['request_id'];
$updated['provider_id'] = (int) $updated['provider_id'];
$updated['price']       = (float) $updated['price'];

json_response(['proposal' => $updated]);
