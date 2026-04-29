<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db_config.php';
cors();
require_method('GET');

$q     = $_GET['q']     ?? '';
$q     = ltrim($q, '@');
$type  = $_GET['type']  ?? 'all';
$limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));

if (trim($q) === '') {
    json_response(['error' => 'Missing required parameter: q'], 400);
}

$search_term = "%$q%";
$results = [];

// Search services
if ($type === 'all' || $type === 'services') {
    $svc_stmt = $pdo->prepare(
        'SELECT s.id, s.title, s.category, s.description, s.pricing_type, s.price,
                s.avg_rating, s.review_count,
                u.first_name, u.last_name, u.username, u.profile_image
         FROM services s
         JOIN users u ON s.provider_id = u.id
         WHERE s.is_active = 1
           AND u.deactivated_at IS NULL
           AND (s.title LIKE :search1 OR s.description LIKE :search2 OR u.username LIKE :search3 OR u.first_name LIKE :search4 OR u.last_name LIKE :search5 OR CONCAT(u.first_name, \' \', u.last_name) LIKE :search6)
         ORDER BY s.avg_rating DESC, s.review_count DESC
         LIMIT :lim'
    );
    $svc_stmt->bindValue('search1', $search_term);
    $svc_stmt->bindValue('search2', $search_term);
    $svc_stmt->bindValue('search3', $search_term);
    $svc_stmt->bindValue('search4', $search_term);
    $svc_stmt->bindValue('search5', $search_term);
    $svc_stmt->bindValue('search6', $search_term);
    $svc_stmt->bindValue('lim', $limit, PDO::PARAM_INT);
    $svc_stmt->execute();
    $services = $svc_stmt->fetchAll();

    // Batch-fetch cover images
    $svc_ids = array_column($services, 'id');
    $svc_covers = [];
    if (!empty($svc_ids)) {
        $ph = implode(',', array_fill(0, count($svc_ids), '?'));
        $ci = $pdo->prepare("SELECT service_id, image_url FROM service_images WHERE service_id IN ($ph) AND sort_order = 0");
        $ci->execute($svc_ids);
        foreach ($ci->fetchAll() as $row) {
            $svc_covers[(int) $row['service_id']] = $row['image_url'];
        }
    }

    foreach ($services as &$s) {
        $s['id']           = (int) $s['id'];
        $s['price']        = (float) $s['price'];
        $s['avg_rating']   = (float) $s['avg_rating'];
        $s['review_count'] = (int) $s['review_count'];
        $s['result_type']  = 'service';
        $s['thumbnail']    = isset($svc_covers[$s['id']]) ? public_asset_url($svc_covers[$s['id']]) : null;
    }

    $results['services'] = $services;
}

// Search requests
if ($type === 'all' || $type === 'requests') {
    $req_stmt = $pdo->prepare(
        'SELECT r.id, r.title, r.category, r.description, r.budget_range, r.deadline,
                r.status, r.created_at,
                u.first_name, u.last_name, u.username, u.profile_image
         FROM requests r
         JOIN users u ON r.requester_id = u.id
         WHERE u.deactivated_at IS NULL
           AND (r.title LIKE :search1 OR r.description LIKE :search2 OR u.username LIKE :search3 OR u.first_name LIKE :search4 OR u.last_name LIKE :search5 OR CONCAT(u.first_name, \' \', u.last_name) LIKE :search6)
         ORDER BY r.created_at DESC
         LIMIT :lim'
    );
    $req_stmt->bindValue('search1', $search_term);
    $req_stmt->bindValue('search2', $search_term);
    $req_stmt->bindValue('search3', $search_term);
    $req_stmt->bindValue('search4', $search_term);
    $req_stmt->bindValue('search5', $search_term);
    $req_stmt->bindValue('search6', $search_term);
    $req_stmt->bindValue('lim', $limit, PDO::PARAM_INT);
    $req_stmt->execute();
    $requests = $req_stmt->fetchAll();

    foreach ($requests as &$r) {
        $r['id']          = (int) $r['id'];
        $r['result_type'] = 'request';
    }

    $results['requests'] = $requests;
}

// Combined count
$total_count = 0;
if (isset($results['services'])) {
    $total_count += count($results['services']);
}
if (isset($results['requests'])) {
    $total_count += count($results['requests']);
}

json_response([
    'query'   => $q,
    'type'    => $type,
    'total'   => $total_count,
    'results' => $results,
]);
