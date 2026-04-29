<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

// 1. Popular categories — count of active services per category, top 8
$cats = $pdo->query(
    "SELECT category, COUNT(*) AS cnt
     FROM services
     WHERE is_active = 1
     GROUP BY category
     ORDER BY cnt DESC
     LIMIT 8"
)->fetchAll();

$categories = array_map(fn($r) => [
    'name'  => $r['category'],
    'count' => (int) $r['cnt'],
], $cats);

// 1b. Popular request categories — count of open requests per category, top 8
$req_cats = $pdo->query(
    "SELECT r.category, COUNT(*) AS cnt
     FROM requests r
     JOIN users u ON u.id = r.requester_id
     WHERE r.status = 'open'
       AND u.deactivated_at IS NULL
     GROUP BY r.category
     ORDER BY cnt DESC
     LIMIT 8"
)->fetchAll();

$request_categories = array_map(fn($r) => [
    'name'  => $r['category'],
    'count' => (int) $r['cnt'],
], $req_cats);

// 2. Top 3 providers this month by completed-order earnings
$cosmetic_select = cosmetic_select_sql();
$cosmetic_join   = cosmetic_join_sql('u');

$sql = "SELECT u.id, u.first_name, u.last_name, u.username, u.profile_image,
               COALESCE(AVG(rv.rating), 0) AS avg_rating,
               SUM(o.price) AS weekly_earnings,
               {$cosmetic_select}
        FROM users u
        JOIN orders o ON o.provider_id = u.id
                      AND o.status = 'completed'
                      AND o.completed_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        LEFT JOIN reviews rv ON rv.provider_id = u.id
        {$cosmetic_join}
        WHERE u.deactivated_at IS NULL
        GROUP BY u.id
        ORDER BY weekly_earnings DESC
        LIMIT 3";

$rows = $pdo->query($sql)->fetchAll();

$providers = [];
foreach ($rows as $i => $r) {
    $providers[] = [
        'rank'          => $i + 1,
        'id'            => (int) $r['id'],
        'name'          => $r['first_name'] . ' ' . $r['last_name'],
        'username'      => $r['username'],
        'profile_image' => $r['profile_image'],
        'rating'        => round((float) $r['avg_rating'], 1),
        'cosmetics'     => build_cosmetics_from_row($r),
    ];
}

json_response([
    'categories'         => $categories,
    'request_categories' => $request_categories,
    'top_providers'      => $providers,
]);
