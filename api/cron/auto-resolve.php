<?php
/**
 * Auto-complete and auto-resolve expired orders.
 *
 * Called automatically from auth/me.php on every page load (throttled to once per 5 min).
 * Can also be run directly:  php api/cron/auto-resolve.php
 */

// If called directly (CLI or HTTP), bootstrap DB + helpers
if (!isset($pdo)) {
    require_once __DIR__ . '/../db_config.php';
    require_once __DIR__ . '/../helpers.php';
}

// ── Throttle: skip if last run was < 5 minutes ago ──
$lock_file = sys_get_temp_dir() . '/hive_auto_resolve.lock';
$now = time();
if (file_exists($lock_file) && ($now - filemtime($lock_file)) < 300) {
    // Ran less than 5 minutes ago, skip
    if (php_sapi_name() === 'cli') echo "Skipped (throttled)\n";
    return;
}
touch($lock_file);

$resolved = ['auto_completed' => 0, 'disputes_resolved' => 0];

// ───────────────────────────────────────────────
// 1. Auto-complete orders past their 48-hour deadline
// ───────────────────────────────────────────────
try {
    $stmt = $pdo->query(
        "SELECT * FROM orders
         WHERE status = 'awaiting_completion'
           AND auto_complete_at IS NOT NULL
           AND auto_complete_at <= NOW()"
    );
    $expired = $stmt->fetchAll();

    foreach ($expired as $exp) {
        $id      = (int) $exp['id'];
        $prov_id = (int) $exp['provider_id'];
        $cli_id  = (int) $exp['client_id'];

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
            $stmt->execute([$id]);
            $locked = $stmt->fetch();

            if (!$locked || $locked['status'] !== 'awaiting_completion') {
                $pdo->rollBack();
                continue;
            }

            $locked_basis = order_settlement_basis($locked);
            $finalized = finalize_order_completion(
                $pdo,
                $locked,
                $locked_basis['subtotal'],
                $locked_basis['service_fee'],
                "Earning from auto-completed order #{$id}",
                "Unused amount returned for auto-completed order #{$id}"
            );

            $pdo->prepare(
                'UPDATE orders
                 SET client_completed_at = COALESCE(client_completed_at, NOW()),
                     provider_completed_at = COALESCE(provider_completed_at, NOW())
                 WHERE id = ?'
            )->execute([$id]);

            $pdo->commit();

            $svc_title = order_title($pdo, $exp);

            create_notification($pdo, $cli_id, 'order_status',
                'Order auto-completed',
                "Your order for \"{$svc_title}\" was auto-completed after 48 hours."
                    . ($finalized['refund_amount'] > 0 ? ' The unused amount was returned.' : ''),
                '/orders/' . $id, null);
            create_notification($pdo, $prov_id, 'payment',
                'Payment received',
                "You received ⬡ " . format_hive_amount($finalized['subtotal']) . " for \"{$svc_title}\" (auto-completed)",
                '/orders/' . $id, null);

            try {
                create_order_event_message(
                    $pdo,
                    null,
                    $prov_id,
                    $cli_id,
                    $id,
                    $svc_title,
                    'auto_completed',
                    'Order auto-completed',
                    'The confirmation window expired, so the order completed automatically and payment was released.'
                        . ($finalized['refund_amount'] > 0 ? ' The unused amount was returned.' : ''),
                    [
                        'actorRole' => 'system',
                        'statusLabel' => 'Completed',
                        'amountLabel' => '⬡ ' . format_hive_amount($finalized['subtotal']),
                        'preview' => 'Order auto-completed',
                    ]
                );
            } catch (Exception $e) {
                // Auto-resolution already succeeded; skip chat side-effect failures.
            }

            $resolved['auto_completed']++;
        } catch (Exception $e) {
            $pdo->rollBack();
        }
    }
} catch (Exception $e) {
    // auto_complete_at column may not exist yet
}

// ───────────────────────────────────────────────
// 2. Auto-resolve disputes past their 7-day deadline (50/50 split)
// ───────────────────────────────────────────────
try {
    $stmt = $pdo->query(
        "SELECT * FROM orders
         WHERE status = 'disputed'
           AND dispute_resolution_deadline IS NOT NULL
           AND dispute_resolution_deadline <= NOW()"
    );
    $expired_disputes = $stmt->fetchAll();

    foreach ($expired_disputes as $exp) {
        $id      = (int) $exp['id'];
        $prov_id = (int) $exp['provider_id'];
        $cli_id  = (int) $exp['client_id'];

        $provider_pct  = 50;
        $svc_title = order_title($pdo, $exp);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
            $stmt->execute([$id]);
            $locked = $stmt->fetch();

            if (!$locked || $locked['status'] !== 'disputed') {
                $pdo->rollBack();
                continue;
            }

            $resolution = calculate_dispute_split_resolution($locked, $provider_pct);
            $finalized = finalize_order_completion(
                $pdo,
                $locked,
                $resolution['subtotal'],
                $resolution['service_fee'],
                "Earning from disputed order #{$id} (50/50 split)",
                "Partial refund from disputed order #{$id} (50/50 split)"
            );

            $pdo->prepare(
                'UPDATE orders
                 SET proposed_split_by = NULL,
                     proposed_split_provider_pct = ?,
                     disputed_at = COALESCE(disputed_at, NOW())
                 WHERE id = ?'
            )->execute([$provider_pct, $id]);

            $pdo->commit();

            create_notification($pdo, $prov_id, 'payment', 'Dispute resolved',
                "Dispute on order #{$id} auto-resolved. You received ⬡ " . format_hive_amount($finalized['subtotal']) . ' (50%).',
                '/orders/' . $id, null);
            create_notification($pdo, $cli_id, 'payment', 'Dispute resolved',
                "Dispute on order #{$id} auto-resolved. You received ⬡ " . format_hive_amount($finalized['refund_amount']) . ' refund (50%).',
                '/orders/' . $id, null);

            try {
                create_order_event_message(
                    $pdo,
                    null,
                    $prov_id,
                    $cli_id,
                    $id,
                    $svc_title,
                    'auto_resolved',
                    'Dispute auto-resolved',
                    'The dispute deadline expired, so the order resolved automatically with a 50/50 split.',
                    [
                        'actorRole' => 'system',
                        'statusLabel' => 'Completed',
                        'amountLabel' => '⬡ ' . format_hive_amount($finalized['subtotal']),
                        'preview' => 'Dispute auto-resolved',
                    ]
                );
            } catch (Exception $e) {
                // Auto-resolution already succeeded; skip chat side-effect failures.
            }

            $resolved['disputes_resolved']++;
        } catch (Exception $e) {
            $pdo->rollBack();
        }
    }
} catch (Exception $e) {
    // dispute columns may not exist yet
}

// ── Output (only when run directly) ──
if (php_sapi_name() === 'cli') {
    $ts = date('Y-m-d H:i:s');
    echo "[{$ts}] Auto-completed: {$resolved['auto_completed']}, Disputes resolved: {$resolved['disputes_resolved']}\n";
}
