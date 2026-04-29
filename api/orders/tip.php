<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

const MIN_TIP_AMOUNT = 0.10;

$user_id = require_auth();
$body    = get_json_body();

$order_id = (int) ($body['order_id'] ?? 0);
$amount   = $body['amount'] ?? null;

if ($order_id <= 0) {
    json_response(['error' => 'order_id is required'], 400);
}

if ($amount === null || !is_numeric($amount)) {
    json_response(['error' => 'amount is required'], 400);
}

$amount = round((float) $amount, 2);

$pdo->beginTransaction();

try {
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
    $stmt->execute([$order_id]);
    $order = $stmt->fetch();

    if (!$order) {
        $pdo->rollBack();
        json_response(['error' => 'Order not found'], 404);
    }

    cast_order_types($order);

    if ($order['client_id'] !== $user_id) {
        $pdo->rollBack();
        json_response(['error' => 'Only the client can tip for this order'], 403);
    }

    if ($order['status'] !== 'completed') {
        $pdo->rollBack();
        json_response(['error' => 'Tips are only available on completed orders'], 400);
    }

    if ($order['tip_amount'] > 0) {
        $pdo->rollBack();
        json_response(['error' => 'Tip already sent for this order', 'order' => $order], 409);
    }

    $tip_basis = $order['settlement_subtotal'] !== null ? (float) $order['settlement_subtotal'] : (float) $order['price'];
    $tip_cap = tip_cap_amount($tip_basis);
    if ($amount < MIN_TIP_AMOUNT || $amount > $tip_cap) {
        $pdo->rollBack();
        json_response(['error' => 'Enter a valid tip amount'], 400);
    }

    $stmt = $pdo->prepare('SELECT hivecoin_balance, username FROM users WHERE id = ? FOR UPDATE');
    $stmt->execute([$user_id]);
    $client = $stmt->fetch();

    if (!$client) {
        $pdo->rollBack();
        json_response(['error' => 'User not found'], 404);
    }

    $balance = round((float) $client['hivecoin_balance'], 2);
    if ($balance < $amount) {
        $pdo->rollBack();
        json_response([
            'error' => 'Insufficient HiveCoin balance',
            'current_balance' => $balance,
            'required' => $amount,
        ], 400);
    }

    $stmt = $pdo->prepare('SELECT username FROM users WHERE id = ?');
    $stmt->execute([$order['provider_id']]);
    $provider = $stmt->fetch();

    if (!$provider) {
        $pdo->rollBack();
        json_response(['error' => 'Provider not found'], 404);
    }

    $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance - ? WHERE id = ?')
        ->execute([$amount, $user_id]);
    $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance + ? WHERE id = ?')
        ->execute([$amount, $order['provider_id']]);
    $pdo->prepare('UPDATE orders SET tip_amount = ?, tipped_at = NOW() WHERE id = ?')
        ->execute([$amount, $order_id]);

    $pdo->prepare(
        'INSERT INTO transactions (user_id, type, amount, description, order_id)
         VALUES (?, \'spending\', ?, ?, ?)'
    )->execute([$user_id, $amount, "Tip to @{$provider['username']} for order #{$order_id}", $order_id]);

    $pdo->prepare(
        'INSERT INTO transactions (user_id, type, amount, description, order_id)
         VALUES (?, \'earning\', ?, ?, ?)'
    )->execute([$order['provider_id'], $amount, "Tip from @{$client['username']} for order #{$order_id}", $order_id]);

    $pdo->commit();
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['error' => 'Failed to send tip. Please try again.'], 500);
}

$amount_label = format_hive_amount($amount);
$svc_title    = order_title($pdo, $order);

try {
    create_notification(
        $pdo,
        $order['provider_id'],
        'payment',
        'Tip received',
        "You received ⬡ {$amount_label} tip for \"{$svc_title}\"",
        '/orders/' . $order_id,
        $user_id
    );

    create_notification(
        $pdo,
        $user_id,
        'payment',
        'Tip sent',
        "Your tip of ⬡ {$amount_label} for \"{$svc_title}\" was sent.",
        '/orders/' . $order_id,
        $order['provider_id']
    );

    create_order_event_message(
        $pdo,
        $user_id,
        $order['provider_id'],
        $order['client_id'],
        $order_id,
        $svc_title,
        'tip_sent',
        'Tip sent',
        'Client sent an extra tip of ⬡ ' . $amount_label . ' directly to the provider.',
        [
            'actorRole' => 'client',
            'statusLabel' => 'Completed',
            'amountLabel' => '⬡ ' . $amount_label,
            'preview' => 'Tip sent',
        ]
    );
} catch (Exception $e) {
    // Tip settlement has already succeeded; avoid surfacing a false failure.
}

$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$order_id]);
$updated = $stmt->fetch();
cast_order_types($updated);

json_response([
    'order' => $updated,
    'balance' => round($balance - $amount, 2),
]);

function tip_cap_amount(float $price): float {
    $cap_pct = $price > 100 ? 0.5 : 1.0;
    return round($price * $cap_pct, 2);
}

function cast_order_types(&$order) {
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
}
