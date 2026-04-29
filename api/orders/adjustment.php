<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();

$user_id = require_auth();
$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['POST', 'PATCH'], true)) {
    json_response(['error' => 'Method not allowed'], 405);
}

$body = get_json_body();
$order_id = (int) (($_GET['id'] ?? $body['order_id'] ?? 0));
if ($order_id <= 0) {
    json_response(['error' => 'Order id is required'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$order_id]);
$order = $stmt->fetch();

if (!$order) {
    json_response(['error' => 'Order not found'], 404);
}

$provider_id = (int) $order['provider_id'];
$client_id   = (int) $order['client_id'];

if ($user_id !== $provider_id && $user_id !== $client_id) {
    json_response(['error' => 'You are not involved in this order'], 403);
}

if (!order_supports_unit_pricing($order)) {
    json_response(['error' => 'Only unit-priced orders support scope changes'], 400);
}

$svc_title = order_title($pdo, $order);
$unit_label = $order['unit_label_snapshot'] ?? null;
$pricing_type = $order['pricing_type_snapshot'] ?? null;
$status_label = $order['status'] === 'pending' ? 'Pending' : 'In Progress';

if ($method === 'POST') {
    if ($user_id !== $provider_id) {
        json_response(['error' => 'Only the provider can request more approved units'], 403);
    }
    if (!in_array($order['status'], ['pending', 'in_progress'], true)) {
        json_response(['error' => 'Scope changes are only available while the order is active'], 400);
    }

    $units_delta = normalize_units_value($body['units_delta'] ?? null);
    $note = trim($body['note'] ?? '');

    if ($units_delta === null || $units_delta <= 0 || !units_value_is_valid($units_delta, $pricing_type)) {
        json_response(['error' => 'Enter a valid additional quantity'], 400);
    }
    if ($note !== '' && mb_strlen($note) > 500) {
        json_response(['error' => 'Note must be 500 characters or less'], 400);
    }

    $pricing = calculate_order_financials((float) $order['unit_rate'], $units_delta);
    $units_label = format_units_label($units_delta, $unit_label);

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
        $stmt->execute([$order_id]);
        $locked_order = $stmt->fetch();

        if (!$locked_order || !in_array($locked_order['status'], ['pending', 'in_progress'], true)) {
            throw new RuntimeException('Order is no longer eligible for scope changes');
        }

        $stmt = $pdo->prepare(
            "SELECT id FROM order_adjustments WHERE order_id = ? AND status = 'pending' LIMIT 1 FOR UPDATE"
        );
        $stmt->execute([$order_id]);
        if ($stmt->fetch()) {
            throw new RuntimeException('A scope change is already pending for this order');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO order_adjustments (
                order_id, requested_by, units_delta, subtotal_delta, service_fee_delta, total_delta, note
             ) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $order_id,
            $user_id,
            $units_delta,
            $pricing['subtotal'],
            $pricing['service_fee'],
            $pricing['total'],
            $note !== '' ? $note : null,
        ]);

        $adjustment_id = (int) $pdo->lastInsertId();
        $pdo->commit();
    } catch (RuntimeException $e) {
        $pdo->rollBack();
        json_response(['error' => $e->getMessage()], 400);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_response(['error' => 'Failed to request a scope change. Please try again.'], 500);
    }

    $stmt = $pdo->prepare(
        'SELECT
            oa.id,
            oa.order_id,
            oa.requested_by,
            oa.responded_by,
            oa.units_delta,
            oa.subtotal_delta,
            oa.service_fee_delta,
            oa.total_delta,
            oa.note,
            oa.status,
            oa.created_at,
            oa.responded_at,
            u.first_name,
            u.last_name
         FROM order_adjustments oa
         JOIN users u ON u.id = oa.requested_by
         WHERE oa.id = ?'
    );
    $stmt->execute([$adjustment_id]);
    $pending_adjustment = $stmt->fetch();

    create_notification(
        $pdo,
        $client_id,
        'order_status',
        'More budget requested',
        "Provider requested {$units_label} more for \"{$svc_title}\". Accept to add ⬡ " . format_hive_amount($pricing['total']) . ' to this order.',
        '/orders/' . $order_id,
        $provider_id
    );

    try {
        create_order_event_message(
            $pdo,
            $provider_id,
            $provider_id,
            $client_id,
            $order_id,
            $svc_title,
            'topup_requested',
            'More budget requested',
            "Provider requested {$units_label} more. Approving this change adds ⬡ " . format_hive_amount($pricing['total']) . ' to this order.',
            [
                'actorRole' => 'provider',
                'statusLabel' => $status_label,
                'amountLabel' => '⬡ ' . format_hive_amount($pricing['total']),
                'preview' => 'More budget requested',
            ]
        );
    } catch (Exception $e) {
        // The request already succeeded.
    }

    json_response([
        'order' => cast_order_types($order),
        'pending_adjustment' => $pending_adjustment ? cast_adjustment_types($pending_adjustment) : null,
    ]);
}

if ($user_id !== $client_id) {
    json_response(['error' => 'Only the client can respond to scope changes'], 403);
}

$action = trim((string) ($body['action'] ?? ''));
if (!in_array($action, ['accept', 'decline'], true)) {
    json_response(['error' => 'action must be accept or decline'], 400);
}

$pdo->beginTransaction();
try {
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
    $stmt->execute([$order_id]);
    $locked_order = $stmt->fetch();

    if (!$locked_order) {
        throw new RuntimeException('Order not found');
    }
    if (!in_array($locked_order['status'], ['pending', 'in_progress'], true)) {
        throw new RuntimeException('This order can no longer be updated');
    }

    $stmt = $pdo->prepare(
        "SELECT * FROM order_adjustments
         WHERE order_id = ? AND status = 'pending'
         ORDER BY id DESC
         LIMIT 1
         FOR UPDATE"
    );
    $stmt->execute([$order_id]);
    $adjustment = $stmt->fetch();

    if (!$adjustment) {
        throw new RuntimeException('No pending scope change was found');
    }

    if ($action === 'accept') {
        $stmt = $pdo->prepare('SELECT hivecoin_balance FROM users WHERE id = ? FOR UPDATE');
        $stmt->execute([$client_id]);
        $client = $stmt->fetch();

        if (!$client) {
            throw new RuntimeException('Client not found');
        }

        $required_total = round_money((float) $adjustment['total_delta']);
        $balance = round_money((float) $client['hivecoin_balance']);
        if ($balance < $required_total) {
            $pdo->rollBack();
            json_response([
                'error' => 'Insufficient HiveCoin balance',
                'required' => $required_total,
                'current_balance' => $balance,
            ], 400);
        }

        $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance - ? WHERE id = ?')
            ->execute([$required_total, $client_id]);

        $pdo->prepare(
            'UPDATE orders
             SET requested_units = requested_units + ?,
                 authorized_units = authorized_units + ?,
                 price = price + ?,
                 service_fee = service_fee + ?,
                 total = total + ?,
                 actual_units = NULL,
                 settlement_subtotal = NULL,
                 settlement_service_fee = NULL,
                 settlement_total = NULL
             WHERE id = ?'
        )->execute([
            $adjustment['units_delta'],
            $adjustment['units_delta'],
            $adjustment['subtotal_delta'],
            $adjustment['service_fee_delta'],
            $adjustment['total_delta'],
            $order_id,
        ]);

        $pdo->prepare(
            'INSERT INTO transactions (user_id, type, amount, description, order_id)
             VALUES (?, \'spending\', ?, ?, ?)'
        )->execute([
            $client_id,
            $required_total,
            "Added budget for order #{$order_id}",
            $order_id,
        ]);
    }

    $pdo->prepare(
        'UPDATE order_adjustments
         SET status = ?, responded_by = ?, responded_at = NOW()
         WHERE id = ?'
    )->execute([$action === 'accept' ? 'accepted' : 'declined', $client_id, (int) $adjustment['id']]);

    $pdo->commit();
} catch (RuntimeException $e) {
    $pdo->rollBack();
    json_response(['error' => $e->getMessage()], 400);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['error' => 'Failed to update the scope change. Please try again.'], 500);
}

$units_label = format_units_label((float) $adjustment['units_delta'], $unit_label);
$extra_total_label = format_hive_amount((float) $adjustment['total_delta']);

if ($action === 'accept') {
    create_notification(
        $pdo,
        $provider_id,
        'payment',
        'More budget approved',
        "Client approved {$units_label} more for \"{$svc_title}\". ⬡ {$extra_total_label} was added to the order.",
        '/orders/' . $order_id,
        $client_id
    );

    try {
        create_order_event_message(
            $pdo,
            $client_id,
            $provider_id,
            $client_id,
            $order_id,
            $svc_title,
            'topup_accepted',
            'More budget approved',
            "Client approved {$units_label} more and added ⬡ {$extra_total_label} to the order.",
            [
                'actorRole' => 'client',
                'statusLabel' => $status_label,
                'amountLabel' => '⬡ ' . $extra_total_label,
                'preview' => 'More budget approved',
            ]
        );
    } catch (Exception $e) {
        // The acceptance already succeeded.
    }
} else {
    create_notification(
        $pdo,
        $provider_id,
        'order_status',
        'More budget declined',
        "Client declined the request for {$units_label} more on \"{$svc_title}\".",
        '/orders/' . $order_id,
        $client_id
    );

    try {
        create_order_event_message(
            $pdo,
            $client_id,
            $provider_id,
            $client_id,
            $order_id,
            $svc_title,
            'topup_declined',
            'More budget declined',
            "Client declined the request for {$units_label} more.",
            [
                'actorRole' => 'client',
                'statusLabel' => $status_label,
                'preview' => 'More budget declined',
            ]
        );
    } catch (Exception $e) {
        // The decline already succeeded.
    }
}

$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$order_id]);
$updated_order = $stmt->fetch();

json_response([
    'order' => cast_order_types($updated_order),
    'pending_adjustment' => null,
]);

function cast_order_types($order) {
    $order['id']          = (int) $order['id'];
    $order['service_id']  = $order['service_id'] ? (int) $order['service_id'] : null;
    $order['provider_id'] = (int) $order['provider_id'];
    $order['client_id']   = (int) $order['client_id'];
    $order['unit_rate']   = isset($order['unit_rate']) ? (float) $order['unit_rate'] : (float) $order['price'];
    $order['requested_units'] = isset($order['requested_units']) ? (float) $order['requested_units'] : 1.0;
    $order['authorized_units'] = isset($order['authorized_units']) ? (float) $order['authorized_units'] : 1.0;
    $order['actual_units'] = isset($order['actual_units']) && $order['actual_units'] !== null ? (float) $order['actual_units'] : null;
    $order['price']       = (float) $order['price'];
    $order['service_fee'] = (float) $order['service_fee'];
    $order['total']       = (float) $order['total'];
    $order['settlement_subtotal'] = isset($order['settlement_subtotal']) && $order['settlement_subtotal'] !== null ? (float) $order['settlement_subtotal'] : null;
    $order['settlement_service_fee'] = isset($order['settlement_service_fee']) && $order['settlement_service_fee'] !== null ? (float) $order['settlement_service_fee'] : null;
    $order['settlement_total'] = isset($order['settlement_total']) && $order['settlement_total'] !== null ? (float) $order['settlement_total'] : null;
    $order['refunded_amount'] = isset($order['refunded_amount']) ? (float) $order['refunded_amount'] : 0.0;
    $order['tip_amount']  = isset($order['tip_amount']) ? (float) $order['tip_amount'] : 0.0;

    if ($order['request_id']) {
        $order['request_id'] = (int) $order['request_id'];
    }
    if ($order['disputed_by']) {
        $order['disputed_by'] = (int) $order['disputed_by'];
    }
    if ($order['proposed_split_by']) {
        $order['proposed_split_by'] = (int) $order['proposed_split_by'];
    }
    if ($order['proposed_split_provider_pct'] !== null) {
        $order['proposed_split_provider_pct'] = (int) $order['proposed_split_provider_pct'];
    }

    return $order;
}

function cast_adjustment_types($adjustment) {
    return [
        'id' => (int) $adjustment['id'],
        'order_id' => (int) $adjustment['order_id'],
        'requested_by' => (int) $adjustment['requested_by'],
        'responded_by' => $adjustment['responded_by'] ? (int) $adjustment['responded_by'] : null,
        'units_delta' => (float) $adjustment['units_delta'],
        'subtotal_delta' => (float) $adjustment['subtotal_delta'],
        'service_fee_delta' => (float) $adjustment['service_fee_delta'],
        'total_delta' => (float) $adjustment['total_delta'],
        'note' => $adjustment['note'],
        'status' => $adjustment['status'],
        'created_at' => $adjustment['created_at'],
        'responded_at' => $adjustment['responded_at'],
        'requested_by_name' => trim(($adjustment['first_name'] ?? '') . ' ' . ($adjustment['last_name'] ?? '')),
    ];
}
