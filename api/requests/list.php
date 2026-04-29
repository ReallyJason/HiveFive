<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_feature($pdo, 'feature_requests');

// Query parameters
$category  = $_GET['category'] ?? null;
$status    = $_GET['status']   ?? 'open';
$search    = $_GET['search']   ?? null;
if ($search) { $search = ltrim($search, '@'); }
$sort      = $_GET['sort']      ?? 'newest';
$budget_range = $_GET['budget_range'] ?? null;
$school_scope = $_GET['school_scope'] ?? null;
$requester = $_GET['requester'] ?? null;
$page      = max(1, (int) ($_GET['page'] ?? 1));
$limit     = min(50, max(1, (int) ($_GET['limit'] ?? 12)));
$offset    = ($page - 1) * $limit;

// Build WHERE clauses
$where  = [];
$params = [];

// Filter by current user's requests
if ($requester === 'me') {
    if (empty($_SESSION['user_id'])) {
        json_response(['error' => 'Unauthorized'], 401);
    }
    $where[] = 'r.requester_id = :requester_id';
    $params['requester_id'] = (int) $_SESSION['user_id'];
    $status = null; // show all statuses for own requests
}

if ($status) {
    $where[]  = 'r.status = :status';
    $params['status'] = $status;
}

if ($category) {
    $where[]  = 'r.category = :category';
    $params['category'] = $category;
}

if ($budget_range) {
    $where[] = 'r.budget_range = :budget_range';
    $params['budget_range'] = $budget_range;
}

if ($school_scope === 'my_school' && (!empty($_SESSION['impersonating_user_id']) || !empty($_SESSION['user_id']))) {
    $viewer_id = !empty($_SESSION['impersonating_user_id'])
        ? (int) $_SESSION['impersonating_user_id']
        : (int) $_SESSION['user_id'];
    $viewer_stmt = $pdo->prepare('SELECT email, university FROM users WHERE id = ? AND deactivated_at IS NULL');
    $viewer_stmt->execute([$viewer_id]);
    $viewer = $viewer_stmt->fetch(PDO::FETCH_ASSOC);
    $viewer_university = null;
    $viewer_domain = null;
    if ($viewer) {
        $viewer_email = strtolower(trim((string) ($viewer['email'] ?? '')));
        $at_pos = strrpos($viewer_email, '@');
        if ($at_pos !== false) {
            $viewer_domain = substr($viewer_email, $at_pos + 1);
        }

        $viewer_university = university_from_email($viewer_email);
        if ($viewer_university === null || $viewer_university === '') {
            $viewer_university = $viewer['university'] ?? null;
        }
    }

    $school_clauses = [];
    if ($viewer_university !== false && $viewer_university !== null && $viewer_university !== '') {
        $school_clauses[] = 'LOWER(TRIM(u.university)) = LOWER(TRIM(:viewer_university))';
        $params['viewer_university'] = $viewer_university;

        // Also match the base school name without acronym parentheses, e.g. "(MIT)".
        $viewer_university_base = trim((string) preg_replace('/\s*\([^)]*\)\s*/', '', (string) $viewer_university));
        if ($viewer_university_base !== '') {
            $school_clauses[] = 'LOWER(u.university) LIKE :viewer_university_like';
            $params['viewer_university_like'] = '%' . strtolower($viewer_university_base) . '%';
        }
    }
    if ($viewer_domain !== null && $viewer_domain !== '') {
        $school_clauses[] = 'LOWER(SUBSTRING_INDEX(u.email, \'@\', -1)) = :viewer_domain';
        $params['viewer_domain'] = strtolower($viewer_domain);
        $school_clauses[] = 'LOWER(SUBSTRING_INDEX(u.email, \'@\', -1)) LIKE :viewer_domain_sub';
        $params['viewer_domain_sub'] = '%.' . strtolower($viewer_domain);
    }
    if (!empty($school_clauses)) {
        $where[] = '(' . implode(' OR ', $school_clauses) . ')';
    }
}

if ($search) {
    $where[]  = '(r.title LIKE :search OR r.description LIKE :search2 OR u.username LIKE :search3 OR u.first_name LIKE :search4 OR u.last_name LIKE :search5 OR CONCAT(u.first_name, \' \', u.last_name) LIKE :search6 OR u.university LIKE :search7)';
    $params['search']  = "%$search%";
    $params['search2'] = "%$search%";
    $params['search3'] = "%$search%";
    $params['search4'] = "%$search%";
    $params['search5'] = "%$search%";
    $params['search6'] = "%$search%";
    $params['search7'] = "%$search%";
}

$where[] = 'u.deactivated_at IS NULL';
$where_sql = implode(' AND ', $where);

// Count total matching records
$count_sql  = "SELECT COUNT(*) as total FROM requests r JOIN users u ON r.requester_id = u.id WHERE $where_sql";
$count_stmt = $pdo->prepare($count_sql);
$count_stmt->execute($params);
$total = (int) $count_stmt->fetch()['total'];

// Fetch paginated results with requester info and proposal count
$cosmetic_select = cosmetic_select_sql();
$cosmetic_join   = cosmetic_join_sql('u');

$viewer_id = !empty($_SESSION['impersonating_user_id'])
    ? (int) $_SESSION['impersonating_user_id']
    : (int) ($_SESSION['user_id'] ?? 0);

$user_proposed_sql = $viewer_id
    ? "(SELECT COUNT(*) FROM proposals p2 WHERE p2.request_id = r.id AND p2.provider_id = :viewer_id) AS user_proposed,"
    : "0 AS user_proposed,";

$sql = "SELECT r.id, r.title, r.category, r.description, r.budget_range, r.deadline,
               r.status, r.created_at,
               u.id AS requester_id,
               u.first_name AS requester_first_name,
               u.last_name  AS requester_last_name,
               u.username   AS requester_username,
               u.profile_image AS requester_profile_image,
               {$cosmetic_select},
               {$user_proposed_sql}
               (SELECT COUNT(*) FROM proposals p WHERE p.request_id = r.id) AS proposal_count
        FROM requests r
        JOIN users u ON r.requester_id = u.id
        {$cosmetic_join}
        WHERE $where_sql
        ORDER BY " . ($sort === 'oldest' ? 'r.created_at ASC' : 'r.created_at DESC') . "
        LIMIT :lim OFFSET :off";

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $val) {
    $stmt->bindValue($key, $val);
}
if ($viewer_id) {
    $stmt->bindValue('viewer_id', $viewer_id, PDO::PARAM_INT);
}
$stmt->bindValue('lim', $limit, PDO::PARAM_INT);
$stmt->bindValue('off', $offset, PDO::PARAM_INT);
$stmt->execute();
$requests = $stmt->fetchAll();

// Budget range → human-readable label
$budget_labels = [
    'under-50' => 'Under ⬡50',
    '50-100'   => '⬡50–100',
    '100-200'  => '⬡100–200',
    '200-500'  => '⬡200–500',
    'over-500' => 'Over ⬡500',
    'flexible' => 'Flexible',
];

// Cast numeric fields and add derived fields
foreach ($requests as &$req) {
    $req['id']             = (int) $req['id'];
    $req['requester_id']   = (int) $req['requester_id'];
    $req['proposal_count'] = (int) $req['proposal_count'];
    $req['user_proposed']  = (bool) $req['user_proposed'];
    $req['budget']         = $budget_labels[$req['budget_range']] ?? $req['budget_range'];
    $req['cosmetics']      = build_cosmetics_from_row($req);
    unset($req['frame_metadata'], $req['badge_metadata']);
}

json_response([
    'requests'   => $requests,
    'pagination' => [
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $total,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
