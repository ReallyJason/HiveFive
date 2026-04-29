<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();

$user_id = require_auth();
$method  = $_SERVER['REQUEST_METHOD'];

$order_id = (int) ($_GET['id'] ?? 0);
if (!$order_id) {
    json_response(['error' => 'Order id is required (?id=X)'], 400);
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

$svc_title = order_title($pdo, $order);

if ($method === 'POST') {
    if ($order['status'] !== 'awaiting_completion') {
        json_response(['error' => 'Can only dispute orders in awaiting_completion status'], 400);
    }

    $is_provider = ($user_id === $provider_id);
    if ($is_provider && !empty($order['provider_completed_at'])) {
        json_response(['error' => 'You already marked this order as complete — you cannot dispute it'], 400);
    }
    if (!$is_provider && !empty($order['client_completed_at'])) {
        json_response(['error' => 'You already marked this order as complete — you cannot dispute it'], 400);
    }

    $body   = get_json_body();
    $reason = trim($body['reason'] ?? '');
    if ($reason === '') {
        json_response(['error' => 'A reason is required to raise a dispute'], 400);
    }
    if (mb_strlen($reason) > 1000) {
        json_response(['error' => 'Dispute reason must be 1,000 characters or less'], 400);
    }

    $stmt = $pdo->prepare(
        'UPDATE orders SET
            status = \'disputed\',
            auto_complete_at = NULL,
            disputed_at = NOW(),
            disputed_by = ?,
            dispute_reason = ?,
            dispute_resolution_deadline = DATE_ADD(NOW(), INTERVAL 7 DAY)
         WHERE id = ?'
    );
    $stmt->execute([$user_id, $reason, $order_id]);

    $other_id = $is_provider ? $client_id : $provider_id;
    create_notification(
        $pdo,
        $other_id,
        'order_status',
        'Order disputed',
        "A dispute was raised on \"{$svc_title}\". You have 7 days to negotiate or it will auto-resolve (50/50 split).",
        '/orders/' . $order_id,
        $user_id
    );

    try {
        create_order_event_message(
            $pdo,
            $user_id,
            $provider_id,
            $client_id,
            $order_id,
            $svc_title,
            'disputed',
            'Dispute opened',
            $is_provider
                ? 'Provider opened a dispute and paused completion until the issue is resolved.'
                : 'Client opened a dispute and paused completion until the issue is resolved.',
            [
                'actorRole' => $is_provider ? 'provider' : 'client',
                'statusLabel' => 'Disputed',
                'preview' => 'Dispute opened',
            ]
        );
    } catch (Exception $e) {
        // The dispute change already succeeded.
    }

    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$order_id]);
    $updated = $stmt->fetch();
    cast_order_types($updated);
    json_response(['order' => $updated]);
}

if ($method === 'PATCH') {
    $body   = get_json_body();
    $action = $body['action'] ?? '';

    if (!in_array($action, ['propose_split', 'accept_split', 'withdraw_dispute'], true)) {
        json_response(['error' => 'Action must be: propose_split, accept_split, or withdraw_dispute'], 400);
    }

    if ($action === 'propose_split') {
        if ($order['status'] !== 'disputed') {
            json_response(['error' => 'Can only propose splits on disputed orders'], 400);
        }

        $provider_pct = $body['provider_pct'] ?? null;
        if ($provider_pct === null || !is_numeric($provider_pct)) {
            json_response(['error' => 'provider_pct is required (0-100)'], 400);
        }
        $provider_pct = (int) $provider_pct;
        if ($provider_pct < 0 || $provider_pct > 100) {
            json_response(['error' => 'provider_pct must be between 0 and 100'], 400);
        }

        $stmt = $pdo->prepare(
            'UPDATE orders SET proposed_split_by = ?, proposed_split_provider_pct = ? WHERE id = ?'
        );
        $stmt->execute([$user_id, $provider_pct, $order_id]);

        $other_id = ($user_id === $provider_id) ? $client_id : $provider_id;
        create_notification(
            $pdo,
            $other_id,
            'order_status',
            'Split proposed',
            "A {$provider_pct}/" . (100 - $provider_pct) . " split was proposed on \"{$svc_title}\". Review and accept or counter.",
            '/orders/' . $order_id,
            $user_id
        );

        try {
            create_order_event_message(
                $pdo,
                $user_id,
                $provider_id,
                $client_id,
                $order_id,
                $svc_title,
                'split_proposed',
                'Settlement split proposed',
                (($user_id === $provider_id) ? 'Provider' : 'Client') . " proposed a {$provider_pct}/" . (100 - $provider_pct) . ' split to resolve the dispute.',
                [
                    'actorRole' => $user_id === $provider_id ? 'provider' : 'client',
                    'statusLabel' => 'Disputed',
                    'preview' => 'Settlement split proposed',
                ]
            );
        } catch (Exception $e) {
            // Split proposal already succeeded.
        }

        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$order_id]);
        $updated = $stmt->fetch();
        cast_order_types($updated);
        json_response(['order' => $updated]);
    }

    if ($action === 'accept_split') {
        if ($order['status'] !== 'disputed') {
            json_response(['error' => 'Can only accept splits on disputed orders'], 400);
        }
        if (empty($order['proposed_split_by']) || $order['proposed_split_provider_pct'] === null) {
            json_response(['error' => 'No split has been proposed yet'], 400);
        }
        if ((int) $order['proposed_split_by'] === $user_id) {
            json_response(['error' => 'You cannot accept your own split proposal'], 400);
        }

        $provider_pct = (int) $order['proposed_split_provider_pct'];

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
            $stmt->execute([$order_id]);
            $locked = $stmt->fetch();

            if (!$locked || $locked['status'] !== 'disputed') {
                throw new RuntimeException('Order is no longer disputed');
            }

            if ((int) $locked['proposed_split_by'] !== (int) $order['proposed_split_by']
                || (int) $locked['proposed_split_provider_pct'] !== $provider_pct
            ) {
                throw new RuntimeException('Split proposal changed');
            }

            $resolution = calculate_dispute_split_resolution($locked, $provider_pct);

            $finalized = finalize_order_completion(
                $pdo,
                $locked,
                $resolution['subtotal'],
                $resolution['service_fee'],
                "Earning from order #{$order_id} ({$provider_pct}% split)",
                "Partial refund from order #{$order_id} (" . (100 - $provider_pct) . '% split)'
            );

            $pdo->prepare(
                'UPDATE orders
                 SET proposed_split_by = NULL,
                     proposed_split_provider_pct = ?,
                     disputed_at = COALESCE(disputed_at, NOW())
                 WHERE id = ?'
            )->execute([$provider_pct, $order_id]);
            $pdo->commit();
        } catch (RuntimeException $e) {
            $pdo->rollBack();
            json_response(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            $pdo->rollBack();
            json_response(['error' => 'Failed to process split. Please try again.'], 500);
        }

        create_notification(
            $pdo,
            $provider_id,
            'payment',
            'Dispute resolved',
            "Split accepted on \"{$svc_title}\". You received ⬡ " . format_hive_amount($finalized['subtotal']) . '.',
            '/orders/' . $order_id,
            $client_id
        );
        create_notification(
            $pdo,
            $client_id,
            'payment',
            'Dispute resolved',
            "Split accepted on \"{$svc_title}\". You received ⬡ " . format_hive_amount($finalized['refund_amount']) . ' refund.',
            '/orders/' . $order_id,
            $provider_id
        );

        try {
            create_order_event_message(
                $pdo,
                $user_id,
                $provider_id,
                $client_id,
                $order_id,
                $svc_title,
                'split_accepted',
                'Split accepted',
                'The dispute was resolved with a split. Provider received ⬡ ' . format_hive_amount($finalized['subtotal']) . ' and client received ⬡ ' . format_hive_amount($finalized['refund_amount']) . '.',
                [
                    'actorRole' => $user_id === $provider_id ? 'provider' : 'client',
                    'statusLabel' => 'Completed',
                    'amountLabel' => '⬡ ' . format_hive_amount($finalized['subtotal']),
                    'preview' => 'Split accepted',
                ]
            );
        } catch (Exception $e) {
            // Split acceptance already succeeded.
        }

        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$order_id]);
        $updated = $stmt->fetch();
        cast_order_types($updated);
        json_response(['order' => $updated]);
    }

    if ($action === 'withdraw_dispute') {
        if ($order['status'] !== 'disputed') {
            json_response(['error' => 'Can only withdraw disputes on disputed orders'], 400);
        }
        if ($user_id !== (int) $order['disputed_by']) {
            json_response(['error' => 'Only the party who raised the dispute can withdraw it'], 400);
        }

        $basis = order_settlement_basis($order);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
            $stmt->execute([$order_id]);
            $locked = $stmt->fetch();

            if (!$locked || $locked['status'] !== 'disputed') {
                throw new RuntimeException('Order is no longer disputed');
            }

            $locked_basis = order_settlement_basis($locked);
            $finalized = finalize_order_completion(
                $pdo,
                $locked,
                $locked_basis['subtotal'],
                $locked_basis['service_fee'],
                "Earning from order #{$order_id} (dispute withdrawn)",
                "Unused amount returned for order #{$order_id}"
            );

            $pdo->prepare(
                'UPDATE orders SET
                    client_completed_at = COALESCE(client_completed_at, NOW()),
                    provider_completed_at = COALESCE(provider_completed_at, NOW()),
                    proposed_split_by = NULL,
                    proposed_split_provider_pct = NULL
                 WHERE id = ?'
            )->execute([$order_id]);
            $pdo->commit();
        } catch (RuntimeException $e) {
            $pdo->rollBack();
            json_response(['error' => $e->getMessage()], 400);
        } catch (Exception $e) {
            $pdo->rollBack();
            json_response(['error' => 'Failed to withdraw dispute. Please try again.'], 500);
        }

        create_notification(
            $pdo,
            $provider_id,
            'payment',
            'Payment received',
            "Dispute withdrawn on \"{$svc_title}\". Payment of ⬡ " . format_hive_amount($finalized['subtotal']) . ' was released.'
                . ($finalized['refund_amount'] > 0 ? ' The unused amount was returned to the client.' : ''),
            '/orders/' . $order_id,
            $client_id
        );
        create_notification(
            $pdo,
            $client_id,
            'order_status',
            'Order completed',
            "Dispute on \"{$svc_title}\" was withdrawn and the order completed."
                . ($finalized['refund_amount'] > 0 ? ' The unused amount was returned.' : ''),
            '/orders/' . $order_id,
            $provider_id
        );

        try {
            create_order_event_message(
                $pdo,
                $user_id,
                $provider_id,
                $client_id,
                $order_id,
                $svc_title,
                'dispute_withdrawn',
                'Dispute withdrawn',
                (($user_id === $provider_id) ? 'Provider' : 'Client') . ' withdrew the dispute and the order completed with payment released.'
                    . ($finalized['refund_amount'] > 0 ? ' The unused amount was returned.' : ''),
                [
                    'actorRole' => $user_id === $provider_id ? 'provider' : 'client',
                    'statusLabel' => 'Completed',
                    'amountLabel' => '⬡ ' . format_hive_amount($finalized['subtotal']),
                    'preview' => 'Dispute withdrawn',
                ]
            );
        } catch (Exception $e) {
            // Dispute withdrawal already succeeded.
        }

        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$order_id]);
        $updated = $stmt->fetch();
        cast_order_types($updated);
        json_response(['order' => $updated]);
    }
}

json_response(['error' => 'Method not allowed'], 405);

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
    if ($order['disputed_by']) {
        $order['disputed_by'] = (int) $order['disputed_by'];
    }
    if ($order['proposed_split_by']) {
        $order['proposed_split_by'] = (int) $order['proposed_split_by'];
    }
    if ($order['proposed_split_provider_pct'] !== null) {
        $order['proposed_split_provider_pct'] = (int) $order['proposed_split_provider_pct'];
    }
}
