<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('PATCH');

$user_id = require_auth();

$order_id = (int) ($_GET['id'] ?? 0);
if (!$order_id) {
    json_response(['error' => 'Order id is required (?id=X)'], 400);
}

$body       = get_json_body();
$new_status = trim($body['status'] ?? '');
$actual_units = normalize_units_value($body['actual_units'] ?? null);

$allowed_transitions = ['in_progress', 'completed', 'cancelled'];
if (!in_array($new_status, $allowed_transitions, true)) {
    json_response(['error' => 'status must be one of: in_progress, completed, cancelled'], 400);
}

// Fetch the order
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$order_id]);
$order = $stmt->fetch();

if (!$order) {
    json_response(['error' => 'Order not found'], 404);
}

$provider_id = (int) $order['provider_id'];
$client_id   = (int) $order['client_id'];
$price       = (float) $order['price'];
$total       = (float) $order['total'];
$uses_unit_pricing = order_supports_unit_pricing($order);

// Verify user is involved in this order
if ($user_id !== $provider_id && $user_id !== $client_id) {
    json_response(['error' => 'You are not involved in this order'], 403);
}

// Permission checks based on new status
if ($new_status === 'in_progress') {
    if ($user_id !== $provider_id) {
        json_response(['error' => 'Only the provider can mark an order as in_progress'], 403);
    }
    if ($order['status'] !== 'pending') {
        json_response(['error' => 'Order can only move to in_progress from pending'], 400);
    }
}

if ($new_status === 'completed') {
    // Both client and provider can mark complete (two-sided completion)
    if ($order['status'] !== 'in_progress' && $order['status'] !== 'awaiting_completion') {
        json_response(['error' => 'Order can only be completed from in_progress or awaiting_completion status'], 400);
    }
    if ($user_id === $provider_id && !empty($order['provider_completed_at'])) {
        json_response(['error' => 'You already marked this order as complete'], 400);
    }
    if ($user_id === $client_id && !empty($order['client_completed_at'])) {
        json_response(['error' => 'You already marked this order as complete'], 400);
    }

    if ($uses_unit_pricing) {
        if ($user_id === $provider_id) {
            if ($actual_units === null || !units_value_is_valid($actual_units, $order['pricing_type_snapshot'] ?? null)) {
                json_response(['error' => 'Enter a valid final quantity before completing this order'], 400);
            }
            if ($actual_units > (float) $order['authorized_units']) {
                json_response(['error' => 'Final quantity cannot exceed the approved amount'], 400);
            }
        } else {
            if ($actual_units !== null) {
                json_response(['error' => 'Only the provider can submit final quantities'], 403);
            }
            if ($order['status'] === 'in_progress' && $order['settlement_total'] === null) {
                json_response(['error' => 'The provider needs to submit final quantities before you can confirm completion'], 400);
            }
        }
    }
}

if ($new_status === 'cancelled') {
    if ($order['status'] === 'completed' || $order['status'] === 'cancelled') {
        json_response(['error' => 'Cannot cancel an order that is already completed or cancelled'], 400);
    }
}

$svc_title = order_title($pdo, $order);

// Execute status change
$order_event = null;
$pdo->beginTransaction();

try {
    if ($new_status === 'in_progress') {
        $stmt = $pdo->prepare(
            'UPDATE orders SET status = \'in_progress\', started_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$order_id]);

        // Notify client
        create_notification(
            $pdo, $client_id, 'order_status',
            'Order started',
            "Your order for \"{$svc_title}\" is now in progress",
            '/orders/' . $order_id,
            $provider_id
        );

        $order_event = [
            'event' => 'started',
            'title' => 'Order started',
            'summary' => 'Provider marked the order as in progress.',
            'extra' => [
                'actorRole' => 'provider',
                'statusLabel' => 'In Progress',
                'preview' => 'Order started',
            ],
        ];
    }

    if ($new_status === 'completed') {
        // Check if two-sided completion columns exist (migration may not have been run)
        $two_sided = true;
        try {
            $pdo->query('SELECT client_completed_at, provider_completed_at FROM orders LIMIT 0');
        } catch (Exception $e) {
            $two_sided = false;
        }

        if ($two_sided) {
            // --- Two-sided completion (post-migration) ---
            $is_provider = ($user_id === $provider_id);

            if ($uses_unit_pricing && $is_provider && $actual_units !== null) {
                $settlement = calculate_order_financials((float) $order['unit_rate'], $actual_units);
                $stmt = $pdo->prepare(
                    'UPDATE orders
                     SET actual_units = ?, settlement_subtotal = ?, settlement_service_fee = ?, settlement_total = ?
                     WHERE id = ?'
                );
                $stmt->execute([
                    $actual_units,
                    $settlement['subtotal'],
                    $settlement['service_fee'],
                    $settlement['total'],
                    $order_id,
                ]);
            }

            // Record this user's completion timestamp
            if ($is_provider) {
                $stmt = $pdo->prepare('UPDATE orders SET provider_completed_at = NOW() WHERE id = ? AND provider_completed_at IS NULL');
                $stmt->execute([$order_id]);
            } else {
                $stmt = $pdo->prepare('UPDATE orders SET client_completed_at = NOW() WHERE id = ? AND client_completed_at IS NULL');
                $stmt->execute([$order_id]);
            }

            // Re-fetch to check if both sides have completed
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
            $stmt->execute([$order_id]);
            $fresh = $stmt->fetch();

            $both_completed = !empty($fresh['client_completed_at']) && !empty($fresh['provider_completed_at']);
            $basis = order_settlement_basis($fresh);
            $refund_preview = round_money(max(0, (float) $fresh['total'] - $basis['total']));
            $actual_units_label = ($uses_unit_pricing && !empty($fresh['actual_units']))
                ? format_units_label((float) $fresh['actual_units'], $fresh['unit_label_snapshot'] ?? null)
                : null;

            if ($both_completed) {
                // Both sides agree — complete the order, release payment, and refund any unused escrow.
                $finalized = finalize_order_completion(
                    $pdo,
                    $fresh,
                    $basis['subtotal'],
                    $basis['service_fee'],
                    "Earning from order #{$order_id}",
                    "Unused amount returned for order #{$order_id}"
                );

                // Notify both parties
                create_notification(
                    $pdo, $client_id, 'order_status',
                    'Order completed',
                    "Your order for \"{$svc_title}\" has been completed."
                        . ($finalized['refund_amount'] > 0 ? " ⬡ " . format_hive_amount($finalized['refund_amount']) . ' was returned from the unused amount.' : '')
                        . ' Leave a review!',
                    '/orders/' . $order_id,
                    $provider_id
                );
                create_notification(
                    $pdo, $provider_id, 'payment',
                    'Payment received',
                    "You received ⬡ " . format_hive_amount($finalized['subtotal']) . " for \"{$svc_title}\"",
                    '/orders/' . $order_id,
                    $client_id
                );

                $order_event = [
                    'event' => 'completed',
                    'title' => 'Order completed',
                    'summary' => $uses_unit_pricing && $actual_units_label
                        ? ($finalized['refund_amount'] > 0
                            ? "{$actual_units_label} were confirmed. Payment was released and the unused amount was returned."
                            : "{$actual_units_label} were confirmed and payment was released.")
                        : 'Both sides confirmed completion and payment was released to the provider.',
                    'extra' => [
                        'actorRole' => $is_provider ? 'provider' : 'client',
                        'statusLabel' => 'Completed',
                        'amountLabel' => '⬡ ' . format_hive_amount($finalized['subtotal']),
                        'preview' => 'Order completed',
                    ],
                ];
            } else {
                // First to complete — move to awaiting_completion with 48h auto-complete timer
                $stmt = $pdo->prepare(
                    'UPDATE orders SET status = \'awaiting_completion\', auto_complete_at = DATE_ADD(NOW(), INTERVAL 48 HOUR) WHERE id = ?'
                );
                $stmt->execute([$order_id]);

                // Notify the other party
                $other_id = $is_provider ? $client_id : $provider_id;
                $who = $is_provider ? 'The provider' : 'The client';
                create_notification(
                    $pdo, $other_id, 'order_status',
                    'Confirmation needed',
                    $uses_unit_pricing && $actual_units_label
                        ? "The provider submitted {$actual_units_label} for \"{$svc_title}\". Review the final scope, confirm, or dispute within 48 hours."
                        : "{$who} marked \"{$svc_title}\" as complete. You have 48 hours to confirm or dispute.",
                    '/orders/' . $order_id,
                    $user_id
                );

                $order_event = [
                    'event' => 'awaiting_completion',
                    'title' => $uses_unit_pricing && $actual_units_label ? 'Final quantity submitted' : 'Completion requested',
                    'summary' => $uses_unit_pricing && $actual_units_label
                        ? "Provider submitted {$actual_units_label} for final review."
                            . ($refund_preview > 0 ? " ⬡ " . format_hive_amount($refund_preview) . ' will be returned after confirmation.' : '')
                        : "{$who} marked the order complete. The other party now has 48 hours to confirm or dispute.",
                    'extra' => [
                        'actorRole' => $is_provider ? 'provider' : 'client',
                        'statusLabel' => 'Awaiting Confirmation',
                        'amountLabel' => $uses_unit_pricing ? ('⬡ ' . format_hive_amount($basis['subtotal'])) : null,
                        'preview' => 'Completion requested',
                    ],
                ];
            }
        } else {
            // --- Fallback: simple completion (pre-migration) ---
            $finalized = finalize_order_completion(
                $pdo,
                $order,
                $price,
                $order['service_fee'],
                "Earning from order #{$order_id}"
            );

            create_notification(
                $pdo, $client_id, 'order_status',
                'Order completed',
                "Your order for \"{$svc_title}\" has been completed.",
                '/orders/' . $order_id,
                $provider_id
            );
            create_notification(
                $pdo, $provider_id, 'payment',
                'Payment received',
                "You received ⬡ " . format_hive_amount($finalized['subtotal']) . " for \"{$svc_title}\"",
                '/orders/' . $order_id,
                $client_id
            );

            $order_event = [
                'event' => 'completed',
                'title' => 'Order completed',
                'summary' => 'The order was marked complete and payment was released to the provider.',
                'extra' => [
                    'actorRole' => $user_id === $provider_id ? 'provider' : 'client',
                    'statusLabel' => 'Completed',
                    'amountLabel' => '⬡ ' . format_hive_amount($finalized['subtotal']),
                    'preview' => 'Order completed',
                ],
            ];
        }
    }

    if ($new_status === 'cancelled') {
        // Update order status and payment
        $stmt = $pdo->prepare(
            'UPDATE orders
             SET status = \'cancelled\',
                 payment_status = \'refunded\',
                 auto_complete_at = NULL,
                 dispute_resolution_deadline = NULL,
                 actual_units = NULL,
                 settlement_subtotal = NULL,
                 settlement_service_fee = NULL,
                 settlement_total = NULL,
                 refunded_amount = total
             WHERE id = ?'
        );
        $stmt->execute([$order_id]);

        // Refund total to client
        $stmt = $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance + ? WHERE id = ?');
        $stmt->execute([$total, $client_id]);

        // Record refund transaction for client
        $stmt = $pdo->prepare(
            'INSERT INTO transactions (user_id, type, amount, description, order_id)
             VALUES (?, \'refund\', ?, ?, ?)'
        );
        $stmt->execute([$client_id, $total, "Refund for cancelled order #{$order_id}", $order_id]);

        // Notify the other party
        $notify_user = ($user_id === $provider_id) ? $client_id : $provider_id;
        create_notification(
            $pdo, $notify_user, 'order_status',
            'Order cancelled',
            "The order for \"{$svc_title}\" was cancelled" . ($notify_user === $client_id ? '. You have been refunded.' : ''),
            '/dashboard',
            $user_id
        );

        $order_event = [
            'event' => 'cancelled',
            'title' => 'Order cancelled',
            'summary' => ($user_id === $provider_id)
                ? 'Provider cancelled the order and the client was refunded.'
                : 'Client cancelled the order and the payment set aside for it was returned.',
            'extra' => [
                'actorRole' => $user_id === $provider_id ? 'provider' : 'client',
                'statusLabel' => 'Cancelled',
                'preview' => 'Order cancelled',
            ],
        ];
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    json_response(['error' => 'Failed to update order status. Please try again.'], 500);
}

if ($order_event) {
    try {
        create_order_event_message(
            $pdo,
            $user_id,
            $provider_id,
            $client_id,
            $order_id,
            $svc_title,
            $order_event['event'],
            $order_event['title'],
            $order_event['summary'],
            $order_event['extra']
        );
    } catch (Exception $e) {
        // Status update already succeeded; avoid surfacing chat side-effect failures.
    }
}

// Return updated order
$stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
$stmt->execute([$order_id]);
$order = $stmt->fetch();

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

json_response(['order' => $order]);
