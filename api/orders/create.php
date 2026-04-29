<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$body = get_json_body();

$service_id     = (int) ($body['service_id'] ?? 0);
$scheduled_date = trim($body['scheduled_date'] ?? '');
$scheduled_time = trim($body['scheduled_time'] ?? '');
$scheduled_utc  = trim($body['scheduled_utc'] ?? '');
$notes          = trim($body['notes'] ?? '');
$requested_units_input = $body['requested_units'] ?? null;
$utc_value      = null;

if (!$service_id) {
    json_response(['error' => 'service_id is required'], 400);
}

// Length validation
if ($notes !== '' && mb_strlen($notes) > 500) {
    json_response(['error' => 'Notes must be 500 characters or less'], 400);
}

if ($scheduled_utc) {
    try {
        $scheduled_dt = new DateTime($scheduled_utc);
        $scheduled_dt->setTimezone(new DateTimeZone('UTC'));
    } catch (Exception $e) {
        json_response(['error' => 'scheduled_utc must be a valid ISO timestamp'], 400);
    }

    $now_utc = new DateTime('now', new DateTimeZone('UTC'));
    if ($scheduled_dt < $now_utc) {
        json_response(['error' => 'Scheduled time must be in the future'], 400);
    }
    $utc_value = $scheduled_dt->format('Y-m-d H:i:s');
}

// Look up the service
$stmt = $pdo->prepare('SELECT * FROM services WHERE id = ? AND is_active = 1');
$stmt->execute([$service_id]);
$service = $stmt->fetch();

if (!$service) {
    json_response(['error' => 'Service not found or inactive'], 404);
}

$provider_id = (int) $service['provider_id'];
$unit_rate   = (float) $service['price'];
$pricing_type = $service['pricing_type'];
$unit_label   = service_price_unit($pricing_type, $service['custom_price_unit'] ?? null);
$uses_units   = service_supports_unit_pricing($service);

// Cannot order your own service
if ($provider_id === $user_id) {
    json_response(['error' => 'You cannot order your own service'], 400);
}

$requested_units = $uses_units ? normalize_units_value($requested_units_input) : 1.0;
if ($uses_units) {
    if ($requested_units === null || !units_value_is_valid($requested_units, $pricing_type)) {
        json_response(['error' => 'Enter a valid quantity for this service'], 400);
    }
} else {
    $requested_units = 1.0;
}

$pricing = calculate_order_financials($unit_rate, $requested_units);
$price = $pricing['subtotal'];
$service_fee = $pricing['service_fee'];
$total = $pricing['total'];
$requested_units_label = $uses_units ? format_units_label($requested_units, $unit_label) : null;

// Begin transaction and lock the row to prevent race conditions
$pdo->beginTransaction();

try {
    // 1. Lock and check client balance atomically
    $stmt = $pdo->prepare('SELECT hivecoin_balance FROM users WHERE id = ? FOR UPDATE');
    $stmt->execute([$user_id]);
    $client = $stmt->fetch();

    if (!$client) {
        $pdo->rollBack();
        json_response(['error' => 'User not found'], 404);
    }

    $balance = (float) $client['hivecoin_balance'];
    if ($balance < $total) {
        $pdo->rollBack();
        json_response([
            'error' => 'Insufficient HiveCoin balance',
            'required' => $total,
            'current_balance' => $balance,
        ], 400);
    }

    // 2. Deduct total from client balance
    $stmt = $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance - ? WHERE id = ?');
    $stmt->execute([$total, $user_id]);

    // 2. Insert order
    $stmt = $pdo->prepare(
        'INSERT INTO orders (
            service_id, provider_id, client_id, pricing_type_snapshot, unit_label_snapshot,
            unit_rate, requested_units, authorized_units,
            price, service_fee, total, status, payment_status, scheduled_date, scheduled_time, scheduled_utc, notes
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'pending\', \'held_in_escrow\', ?, ?, ?, ?)'
    );
    $stmt->execute([
        $service_id,
        $provider_id,
        $user_id,
        $pricing_type,
        $unit_label,
        $unit_rate,
        $requested_units,
        $requested_units,
        $price,
        $service_fee,
        $total,
        $scheduled_date ?: null,
        $scheduled_time ?: null,
        $utc_value,
        $notes ?: null,
    ]);
    $order_id = (int) $pdo->lastInsertId();

    // 3. Record spending transaction for client
    $stmt = $pdo->prepare(
        'INSERT INTO transactions (user_id, type, amount, description, order_id)
         VALUES (?, \'spending\', ?, ?, ?)'
    );
    $stmt->execute([$user_id, $total, "Payment for order #{$order_id}", $order_id]);

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    json_response(['error' => 'Failed to create order. Please try again.'], 500);
}

// Notify the provider about the new booking
$client_stmt = $pdo->prepare('SELECT first_name, last_name FROM users WHERE id = ?');
$client_stmt->execute([$user_id]);
$client_info = $client_stmt->fetch();
$client_name = $client_info['first_name'] . ' ' . $client_info['last_name'];

$svc_title = $service['title'];
create_notification(
    $pdo, $provider_id, 'order',
    'New booking request',
    $requested_units_label
        ? "{$client_name} booked {$requested_units_label} of \"{$svc_title}\" for ⬡ {$total}"
        : "{$client_name} booked your service \"{$svc_title}\" for ⬡ {$total}",
    "/orders/{$order_id}",
    $user_id
);

try {
    create_order_event_message(
        $pdo,
        $user_id,
        $provider_id,
        $user_id,
        $order_id,
        $svc_title,
        'created',
        'Order placed',
        $requested_units_label
            ? "Client placed this order for {$requested_units_label}. Payment is now set aside until the order is finished."
            : 'Client placed this order. Payment is now set aside until the order is finished.',
        [
            'actorRole' => 'client',
            'statusLabel' => 'Pending',
            'amountLabel' => '⬡ ' . format_hive_amount($price),
            'preview' => 'Order placed',
        ]
    );
} catch (Exception $e) {
    // Order creation already succeeded; avoid failing the request on chat side effects.
}

// Fetch the created order
$stmt = $pdo->prepare(
    'SELECT o.*, s.title AS service_title
     FROM orders o
     JOIN services s ON o.service_id = s.id
     WHERE o.id = ?'
);
$stmt->execute([$order_id]);
$order = $stmt->fetch();

$order['id']          = (int) $order['id'];
$order['service_id']  = (int) $order['service_id'];
$order['provider_id'] = (int) $order['provider_id'];
$order['client_id']   = (int) $order['client_id'];
$order['unit_rate']   = isset($order['unit_rate']) ? (float) $order['unit_rate'] : $order['price'];
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

json_response(['order' => $order], 201);
