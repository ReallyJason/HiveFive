<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
$admin_id = require_admin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $status_filter = $_GET['status'] ?? null;

    $sql = "SELECT r.id, r.reporter_id, r.reported_id, r.reason, r.description,
                   r.status, r.admin_note, r.created_at, r.resolved_at, r.resolved_by,
                   reporter.username AS reporter_username,
                   reporter.first_name AS reporter_first_name,
                   reporter.last_name AS reporter_last_name,
                   reporter.profile_image AS reporter_image,
                   reported.username AS reported_username,
                   reported.first_name AS reported_first_name,
                   reported.last_name AS reported_last_name,
                   reported.profile_image AS reported_image,
                   reported.suspended_until AS suspended_until,
                   reported.banned_at AS banned_at,
                   reported.ban_reason AS ban_reason
            FROM reports r
            JOIN users reporter ON reporter.id = r.reporter_id
            JOIN users reported ON reported.id = r.reported_id";

    $params = [];
    if ($status_filter) {
        $sql .= " WHERE r.status = ?";
        $params[] = $status_filter;
    }

    $sql .= " ORDER BY r.created_at DESC LIMIT 100";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $reports = $stmt->fetchAll();

    json_response(['reports' => $reports]);

} elseif ($method === 'PATCH') {
    $body = get_json_body();
    $id = $body['id'] ?? null;
    $status = $body['status'] ?? null;
    $admin_note = $body['admin_note'] ?? null;

    if (!$id || !$status) {
        json_response(['error' => 'id and status are required'], 400);
    }

    $valid_statuses = ['pending', 'acknowledged', 'dismissed', 'actioned'];
    if (!in_array($status, $valid_statuses, true)) {
        json_response(['error' => 'Invalid status'], 400);
    }

    // Fetch report to get reported_id before updating
    $stmt = $pdo->prepare("SELECT reported_id FROM reports WHERE id = ?");
    $stmt->execute([$id]);
    $report = $stmt->fetch();
    if (!$report) {
        json_response(['error' => 'Report not found'], 404);
    }

    $stmt = $pdo->prepare(
        "UPDATE reports
         SET status = ?, admin_note = ?, resolved_at = NOW(), resolved_by = ?
         WHERE id = ?"
    );
    $stmt->execute([$status, $admin_note, $admin_id, $id]);

    // Auto-escalation: when a report is acknowledged or actioned,
    // check if the reported user should be auto-suspended
    $auto_suspended = false;
    if (in_array($status, ['acknowledged', 'actioned'], true)) {
        $reported_id = (int) $report['reported_id'];

        // Check if user is already banned
        $stmt = $pdo->prepare("SELECT banned_at, suspended_until FROM users WHERE id = ?");
        $stmt->execute([$reported_id]);
        $reported_user = $stmt->fetch();

        if ($reported_user && $reported_user['banned_at'] === null) {
            // Count acknowledged + actioned reports in the last 30 days
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) FROM reports
                 WHERE reported_id = ? AND status IN ('acknowledged', 'actioned')
                   AND resolved_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            );
            $stmt->execute([$reported_id]);
            $recent_count = (int) $stmt->fetchColumn();

            // Count total acknowledged + actioned reports ever
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) FROM reports
                 WHERE reported_id = ? AND status IN ('acknowledged', 'actioned')"
            );
            $stmt->execute([$reported_id]);
            $total_count = (int) $stmt->fetchColumn();

            $suspend_days = 0;
            if ($total_count >= 5) {
                $suspend_days = 30;
            } elseif ($recent_count >= 3) {
                $suspend_days = 7;
            }

            if ($suspend_days > 0) {
                // Only apply if not already suspended for longer
                $current_until = $reported_user['suspended_until']
                    ? strtotime($reported_user['suspended_until'])
                    : 0;
                $new_until = strtotime("+{$suspend_days} days");

                if ($new_until > $current_until) {
                    $stmt = $pdo->prepare(
                        "UPDATE users SET suspended_until = DATE_ADD(NOW(), INTERVAL ? DAY) WHERE id = ?"
                    );
                    $stmt->execute([$suspend_days, $reported_id]);
                    $auto_suspended = true;
                }
            }
        }
    }

    json_response([
        'success' => true,
        'auto_suspended' => $auto_suspended,
    ]);

} else {
    json_response(['error' => 'Method not allowed'], 405);
}
