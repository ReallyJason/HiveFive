<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

// Allow auth'd user or public view via ?id=X
$target_id = isset($_GET['id']) ? (int) $_GET['id'] : null;

if (!$target_id) {
    $target_id = require_auth();
}

// Verify user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE id = :id");
$stmt->execute([':id' => $target_id]);
if (!$stmt->fetch()) {
    json_response(['error' => 'User not found'], 404);
}

// Total earnings (sum of 'earning' transactions)
$stmt = $pdo->prepare("
    SELECT COALESCE(SUM(amount), 0) FROM transactions
    WHERE user_id = :id AND type = 'earning'
");
$stmt->execute([':id' => $target_id]);
$total_earnings = round((float) $stmt->fetchColumn(), 2);

// Total spent (sum of 'spending' transactions)
$stmt = $pdo->prepare("
    SELECT COALESCE(SUM(amount), 0) FROM transactions
    WHERE user_id = :id AND type = 'spending'
");
$stmt->execute([':id' => $target_id]);
$total_spent = round((float) $stmt->fetchColumn(), 2);

// Services offered (active services)
$stmt = $pdo->prepare("SELECT COUNT(*) FROM services WHERE provider_id = :id");
$stmt->execute([':id' => $target_id]);
$services_offered = (int) $stmt->fetchColumn();

// Completed orders (as provider or client)
$stmt = $pdo->prepare("
    SELECT COUNT(*) FROM orders
    WHERE (provider_id = :id1 OR client_id = :id2) AND status = 'completed'
");
$stmt->execute([':id1' => $target_id, ':id2' => $target_id]);
$completed_orders = (int) $stmt->fetchColumn();

// Average rating (as provider)
$stmt = $pdo->prepare("
    SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE provider_id = :id
");
$stmt->execute([':id' => $target_id]);
$average_rating = round((float) $stmt->fetchColumn(), 2);

// Response time (real calculation)
$avg_response_minutes = null;
try {
    $rt_stmt = $pdo->prepare("
        SELECT AVG(reply_gap) AS avg_gap FROM (
            SELECT
                TIMESTAMPDIFF(MINUTE, prev.created_at, cur.created_at) AS reply_gap
            FROM messages cur
            JOIN messages prev ON prev.conversation_id = cur.conversation_id
                AND prev.id = (
                    SELECT MAX(p.id) FROM messages p
                    WHERE p.conversation_id = cur.conversation_id
                      AND p.id < cur.id
                )
            WHERE cur.sender_id = :id
              AND prev.sender_id != :id2
        ) gaps
        WHERE reply_gap <= 10080
    ");
    $rt_stmt->execute([':id' => $target_id, ':id2' => $target_id]);
    $avg_gap = $rt_stmt->fetchColumn();
    if ($avg_gap !== null && $avg_gap !== false) {
        $avg_response_minutes = round((float) $avg_gap);
    }
} catch (Exception $e) {}

// Buzz Score (action-based, all-time)
$buzz_score = 0;
try {
    $has_cr = false;
    try { $pdo->query('SELECT 1 FROM client_reviews LIMIT 0'); $has_cr = true; } catch (Exception $e) {}

    // Fetch user row for profile completion check
    $u_stmt = $pdo->prepare('SELECT bio, profile_image, last_seen_at FROM users WHERE id = ?');
    $u_stmt->execute([$target_id]);
    $u_row = $u_stmt->fetch();

    $buzz_sql = "
        SELECT SUM(points) AS raw_points FROM (
            SELECT 15 AS points FROM orders WHERE provider_id = :u1 AND status = 'completed'
            UNION ALL
            SELECT 5 FROM orders WHERE client_id = :u2 AND status = 'completed'
            UNION ALL
            SELECT CASE rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2 WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END
            FROM reviews WHERE provider_id = :u3
            UNION ALL
            SELECT 4 FROM reviews WHERE reviewer_id = :u4
            UNION ALL
            SELECT -10 FROM orders WHERE provider_id = :u5 AND status = 'cancelled'
            UNION ALL
            SELECT -10 FROM orders WHERE client_id = :u6 AND status = 'cancelled'
            UNION ALL
            SELECT 8 FROM (
                SELECT provider_id, client_id FROM orders WHERE provider_id = :u7 AND status = 'completed'
                GROUP BY provider_id, client_id HAVING COUNT(*) >= 2
            ) rc1
            UNION ALL
            SELECT 8 FROM (
                SELECT client_id, provider_id FROM orders WHERE client_id = :u8 AND status = 'completed'
                GROUP BY client_id, provider_id HAVING COUNT(*) >= 2
            ) rc2
            " . ($has_cr ? "
            UNION ALL
            SELECT CASE rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2 WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END
            FROM client_reviews WHERE client_id = :u9
            UNION ALL
            SELECT 4 FROM client_reviews WHERE reviewer_id = :u10
            " : "") . "
        ) actions
    ";
    $buzz_stmt = $pdo->prepare($buzz_sql);
    $bind = [':u1' => $target_id, ':u2' => $target_id, ':u3' => $target_id, ':u4' => $target_id,
             ':u5' => $target_id, ':u6' => $target_id, ':u7' => $target_id, ':u8' => $target_id];
    if ($has_cr) { $bind[':u9'] = $target_id; $bind[':u10'] = $target_id; }
    $buzz_stmt->execute($bind);
    $raw = (float) ($buzz_stmt->fetchColumn() ?: 0);

    if ($u_row && !empty($u_row['bio']) && !empty($u_row['profile_image'])) $raw += 10;
    if ($u_row && !empty($u_row['last_seen_at'])) {
        $days_inactive = max(0, (int) ((time() - strtotime($u_row['last_seen_at'])) / 86400));
        if ($days_inactive > 14) $raw -= min($days_inactive - 14, 20);
    }

    $k = 300;
    $buzz_score = ($raw > 0) ? round(1000 * (1 - exp(-$raw / $k)), 1) : 0;
} catch (Exception $e) {
    $buzz_score = 0;
}

json_response([
    'total_earnings'       => $total_earnings,
    'total_spent'          => $total_spent,
    'services_offered'     => $services_offered,
    'completed_orders'     => $completed_orders,
    'average_rating'       => $average_rating,
    'buzz_score'           => $buzz_score,
    'avg_response_minutes' => $avg_response_minutes,
]);
