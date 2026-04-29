<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
$admin_id = require_admin();

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $status = $_GET['status'] ?? '';
    $sort   = $_GET['sort'] ?? 'created_at';
    $dir    = strtoupper($_GET['dir'] ?? 'DESC') === 'ASC' ? 'ASC' : 'DESC';
    $page   = max(1, (int) ($_GET['page'] ?? 1));
    $limit  = 25;
    $offset = ($page - 1) * $limit;

    $base_select = "u.id, u.email, u.username, u.first_name, u.last_name,
                   u.university, u.profile_image, u.role,
                   u.suspended_until, u.banned_at, u.ban_reason,
                   u.created_at, u.last_seen_at,
                   (SELECT COUNT(*) FROM reports r
                    WHERE r.reported_id = u.id
                      AND r.status != 'pending') AS report_count";

    $base_from = "FROM users u";
    $conditions = ["u.role = 'user'", "u.deactivated_at IS NULL"];
    $params = [];

    if ($search !== '') {
        // Comma-separated terms are treated as combined filters (AND):
        // e.g. "Anakin Hoffman, Harvard" or "Anakin, Hoffman, Harvard".
        $chunks = array_values(array_filter(array_map('trim', preg_split('/\s*,\s*/', $search) ?: []), static fn($v) => $v !== ''));
        if (empty($chunks)) {
            $chunks = [$search];
        }

        foreach ($chunks as $chunk) {
            $chunk_like = '%' . $chunk . '%';

            // Phrase-level match (full text chunk in a single field / full name concatenation)
            $phrase_clause = '(u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.university LIKE ? OR CONCAT(u.first_name, \' \', u.last_name) LIKE ? OR CONCAT(u.last_name, \' \', u.first_name) LIKE ?)';
            $phrase_params = [$chunk_like, $chunk_like, $chunk_like, $chunk_like, $chunk_like, $chunk_like, $chunk_like];

            // Token-level match (all words in chunk must appear somewhere)
            $words = array_values(array_filter(array_map('trim', preg_split('/\s+/', $chunk) ?: []), static fn($v) => $v !== ''));
            $token_clause = '';
            $token_params = [];
            if (count($words) > 1) {
                $word_clauses = [];
                foreach ($words as $word) {
                    $word_like = '%' . $word . '%';
                    $word_clauses[] = '(u.username LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.university LIKE ? OR CONCAT(u.first_name, \' \', u.last_name) LIKE ? OR CONCAT(u.last_name, \' \', u.first_name) LIKE ?)';
                    array_push($token_params, $word_like, $word_like, $word_like, $word_like, $word_like, $word_like, $word_like);
                }
                $token_clause = '(' . implode(' AND ', $word_clauses) . ')';
            }

            if ($token_clause !== '') {
                $conditions[] = '((' . $phrase_clause . ') OR ' . $token_clause . ')';
                $params = array_merge($params, $phrase_params, $token_params);
            } else {
                $conditions[] = '(' . $phrase_clause . ')';
                $params = array_merge($params, $phrase_params);
            }
        }
    }

    if ($status === 'active') {
        $conditions[] = 'u.banned_at IS NULL AND (u.suspended_until IS NULL OR u.suspended_until < NOW())';
    } elseif ($status === 'suspended') {
        $conditions[] = 'u.banned_at IS NULL AND u.suspended_until IS NOT NULL AND u.suspended_until > NOW()';
    } elseif ($status === 'banned') {
        $conditions[] = 'u.banned_at IS NOT NULL';
    }

    $where = ' WHERE ' . implode(' AND ', $conditions);

    // Whitelist sort columns
    $sort_map = [
        'created_at'   => 'u.created_at',
        'first_name'   => 'u.first_name',
        'report_count' => 'report_count',
        'last_seen_at' => 'u.last_seen_at',
    ];
    $order_col = $sort_map[$sort] ?? 'u.created_at';

    // Count total
    $count_sql = "SELECT COUNT(*) " . $base_from . $where;
    $count_stmt = $pdo->prepare($count_sql);
    $count_stmt->execute($params);
    $total = (int) $count_stmt->fetchColumn();

    // Fetch page
    $sql = "SELECT " . $base_select . " " . $base_from . $where
         . " ORDER BY " . $order_col . " " . $dir
         . " LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $users = $stmt->fetchAll();

    json_response([
        'users' => $users,
        'total' => $total,
        'page'  => $page,
        'pages' => (int) ceil($total / $limit),
    ]);

} elseif ($method === 'PATCH') {
    $body = get_json_body();
    $user_id = $body['user_id'] ?? null;
    $action = $body['action'] ?? null;
    $reason = $body['reason'] ?? null;

    if (!$user_id || !$action) {
        json_response(['error' => 'user_id and action are required'], 400);
    }

    // Verify user exists
    $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['error' => 'User not found'], 404);
    }

    if ($user['role'] === 'admin') {
        json_response(['error' => 'Cannot modify admin users'], 403);
    }

    switch ($action) {
        case 'suspend_7d':
            $stmt = $pdo->prepare("UPDATE users SET suspended_until = DATE_ADD(NOW(), INTERVAL 7 DAY) WHERE id = ?");
            $stmt->execute([$user_id]);
            break;

        case 'suspend_30d':
            $stmt = $pdo->prepare("UPDATE users SET suspended_until = DATE_ADD(NOW(), INTERVAL 30 DAY) WHERE id = ?");
            $stmt->execute([$user_id]);
            break;

        case 'unsuspend':
            $stmt = $pdo->prepare("UPDATE users SET suspended_until = NULL WHERE id = ?");
            $stmt->execute([$user_id]);
            break;

        case 'ban':
            if (!$reason) {
                json_response(['error' => 'reason is required for ban'], 400);
            }
            $stmt = $pdo->prepare("UPDATE users SET banned_at = NOW(), ban_reason = ? WHERE id = ?");
            $stmt->execute([$reason, $user_id]);
            break;

        case 'unban':
            $stmt = $pdo->prepare("UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = ?");
            $stmt->execute([$user_id]);
            break;

        default:
            json_response(['error' => 'Invalid action'], 400);
    }

    json_response(['success' => true]);

} elseif ($method === 'DELETE') {
    $user_id = $_GET['user_id'] ?? null;
    if (!$user_id) {
        json_response(['error' => 'user_id is required'], 400);
    }

    $stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['error' => 'User not found'], 404);
    }
    if ($user['role'] === 'admin') {
        json_response(['error' => 'Cannot delete admin users'], 403);
    }

    $pdo->beginTransaction();
    try {
        $uid = (int) $user_id;
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

        $pdo->prepare("DELETE FROM review_votes WHERE user_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM notifications WHERE user_id = ? OR actor_id = ?")->execute([$uid, $uid]);
        $pdo->prepare("DELETE FROM tokens WHERE user_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM reports WHERE reporter_id = ? OR reported_id = ? OR resolved_by = ?")->execute([$uid, $uid, $uid]);
        $pdo->prepare("DELETE FROM shop_purchases WHERE user_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM messages WHERE sender_id = ? OR conversation_id IN (SELECT id FROM conversations WHERE user_one_id = ? OR user_two_id = ?)")->execute([$uid, $uid, $uid]);
        $pdo->prepare("DELETE FROM conversations WHERE user_one_id = ? OR user_two_id = ?")->execute([$uid, $uid]);
        $pdo->prepare("DELETE FROM transactions WHERE user_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM client_reviews WHERE reviewer_id = ? OR client_id = ?")->execute([$uid, $uid]);
        $pdo->prepare("DELETE FROM reviews WHERE reviewer_id = ? OR provider_id = ?")->execute([$uid, $uid]);
        $pdo->prepare("DELETE FROM orders WHERE provider_id = ? OR client_id = ? OR disputed_by = ? OR proposed_split_by = ?")->execute([$uid, $uid, $uid, $uid]);
        $pdo->prepare("DELETE FROM proposals WHERE provider_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM requests WHERE requester_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM service_images WHERE service_id IN (SELECT id FROM services WHERE provider_id = ?)")->execute([$uid]);
        $pdo->prepare("DELETE FROM services WHERE provider_id = ?")->execute([$uid]);
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$uid]);

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        $pdo->commit();
    } catch (\Exception $e) {
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        $pdo->rollBack();
        error_log('Delete user failed (uid=' . $user_id . '): ' . $e->getMessage());
        json_response(['error' => 'Failed to delete user'], 500);
    }

    json_response(['success' => true]);

} else {
    json_response(['error' => 'Method not allowed'], 405);
}
