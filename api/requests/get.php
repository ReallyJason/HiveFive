<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_feature($pdo, 'feature_requests');

$id = $_GET['id'] ?? null;
if (!$id) {
    json_response(['error' => 'Missing required parameter: id'], 400);
}

// Fetch request with requester info
$cosmetic_select = cosmetic_select_sql();
$cosmetic_join   = cosmetic_join_sql('u');

$stmt = $pdo->prepare(
    "SELECT r.id, r.requester_id, r.title, r.category, r.description,
            r.budget_range, r.deadline, r.status, r.created_at,
            u.first_name AS requester_first_name,
            u.last_name  AS requester_last_name,
            u.username   AS requester_username,
            u.profile_image AS requester_profile_image,
            u.university AS requester_university,
            {$cosmetic_select}
     FROM requests r
     JOIN users u ON r.requester_id = u.id
     {$cosmetic_join}
     WHERE r.id = :id AND u.deactivated_at IS NULL"
);
$stmt->execute(['id' => (int) $id]);
$request = $stmt->fetch();

if (!$request) {
    json_response(['error' => 'Request not found'], 404);
}

// Cast numeric fields and add derived fields
$request['id']           = (int) $request['id'];
$request['requester_id'] = (int) $request['requester_id'];
$request['cosmetics']    = build_cosmetics_from_row($request);
unset($request['frame_metadata'], $request['badge_metadata']);

$budget_labels = [
    'under-50' => 'Under ⬡50',
    '50-100'   => '⬡50–100',
    '100-200'  => '⬡100–200',
    '200-500'  => '⬡200–500',
    'over-500' => 'Over ⬡500',
    'flexible' => 'Flexible',
];
$request['budget'] = $budget_labels[$request['budget_range']] ?? $request['budget_range'];

// Check if current user is the request owner
$current_user_id = $_SESSION['user_id'] ?? null;
$is_owner = $current_user_id && (int) $current_user_id === $request['requester_id'];

// Get proposal count (always visible)
$cnt_stmt = $pdo->prepare('SELECT COUNT(*) FROM proposals WHERE request_id = ?');
$cnt_stmt->execute([(int) $id]);
$proposal_count = (int) $cnt_stmt->fetchColumn();

// Fetch proposals: owner sees all, others see only their own
if ($is_owner) {
    $prop_stmt = $pdo->prepare(
        'SELECT p.id, p.provider_id, p.price, p.message, p.estimated_delivery, p.scheduled_date, p.scheduled_time, p.status, p.created_at,
                u.first_name AS provider_first_name,
                u.last_name  AS provider_last_name,
                u.username   AS provider_username,
                u.profile_image AS provider_profile_image
         FROM proposals p
         JOIN users u ON p.provider_id = u.id
         WHERE p.request_id = :request_id AND u.deactivated_at IS NULL
         ORDER BY p.created_at DESC'
    );
    $prop_stmt->execute(['request_id' => (int) $id]);
} elseif ($current_user_id) {
    $prop_stmt = $pdo->prepare(
        'SELECT p.id, p.provider_id, p.price, p.message, p.estimated_delivery, p.scheduled_date, p.scheduled_time, p.status, p.created_at,
                u.first_name AS provider_first_name,
                u.last_name  AS provider_last_name,
                u.username   AS provider_username,
                u.profile_image AS provider_profile_image
         FROM proposals p
         JOIN users u ON p.provider_id = u.id
         WHERE p.request_id = :request_id AND p.provider_id = :uid AND u.deactivated_at IS NULL
         ORDER BY p.created_at DESC'
    );
    $prop_stmt->execute(['request_id' => (int) $id, 'uid' => (int) $current_user_id]);
} else {
    $prop_stmt = null;
}

$proposals = $prop_stmt ? $prop_stmt->fetchAll() : [];

// Cast numeric fields on proposals
foreach ($proposals as &$prop) {
    $prop['id']          = (int) $prop['id'];
    $prop['provider_id'] = (int) $prop['provider_id'];
    $prop['price']       = (float) $prop['price'];
}

$request['proposals']      = $proposals;
$request['proposal_count'] = $proposal_count;

json_response(['request' => $request]);
