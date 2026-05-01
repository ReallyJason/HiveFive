<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db_config.php';
cors();
require_method('GET');

$limit    = min(50, max(1, (int) ($_GET['limit'] ?? 20)));
$period   = $_GET['period'] ?? 'alltime';
$category = $_GET['category'] ?? '';

// -----------------------------------------------------------------------
// Action-Based Buzz Score
//
// Every meaningful action earns/loses points.  Raw points are accumulated
// over a rolling window (30d / 365d / all-time) and normalised to a
// 0-1000 display score via:  display = 1000 * (1 - e^(-raw / k))
//
// Point values:
//   Provider completion  +15    Client completion     +5
//   5-star received      +10    4-star received       +6
//   3-star received       +2    2-star received       -3
//   1-star received       -8    Review left           +4
//   Repeat relationship   +8    Order cancelled      -10
//   Profile complete     +10    Inactivity (>14d)    -1/day (cap -20)
//
// Global view  = all actions (provider + client + reviewer)
// Category view = provider-side actions only, filtered by service category
// -----------------------------------------------------------------------

$valid_categories = [
    'Beauty','Career','Coaching','Coding','Consulting','Cooking',
    'Design','Errands','Events','Fitness','Language','Moving','Music',
    'Pet Care','Photography','Rides','Tech Support','Tutoring','Video',
    'Writing','Other',
];
$is_category = ($category !== '' && in_array($category, $valid_categories, true));

// Check if client_reviews table exists (migration may not have run yet)
$has_client_reviews = false;
try {
    $pdo->query('SELECT 1 FROM client_reviews LIMIT 0');
    $has_client_reviews = true;
} catch (Exception $e) {}

// Date window conditions (table aliases: o = orders, r = reviews, cr = client_reviews)
$o_window  = '';   // orders.completed_at filter
$o_cancel  = '';   // orders.created_at filter (cancellations lack cancelled_at)
$r_window  = '';   // reviews.created_at filter
$cr_window = '';   // client_reviews.created_at filter

if ($period === 'month') {
    $o_window  = "AND o.completed_at  >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $o_cancel  = "AND o.created_at   >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $r_window  = "AND r.created_at   >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
    $cr_window = "AND cr.created_at  >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
} elseif ($period === 'year') {
    $o_window  = "AND o.completed_at  >= DATE_SUB(NOW(), INTERVAL 365 DAY)";
    $o_cancel  = "AND o.created_at   >= DATE_SUB(NOW(), INTERVAL 365 DAY)";
    $r_window  = "AND r.created_at   >= DATE_SUB(NOW(), INTERVAL 365 DAY)";
    $cr_window = "AND cr.created_at  >= DATE_SUB(NOW(), INTERVAL 365 DAY)";
}

// ---- Build the UNION ALL of all point-earning/losing actions -----------

if ($is_category) {
    $cat_q = $pdo->quote($category);

    // Category view: provider-side actions only
    $points_sql = "
        SELECT user_id, SUM(points) AS raw_points FROM (
            /* Provider completions: +15 */
            SELECT o.provider_id AS user_id, 15 AS points
            FROM orders o JOIN services s ON o.service_id = s.id
            WHERE o.status = 'completed' {$o_window} AND s.category = {$cat_q}

            UNION ALL
            /* Reviews received (by rating) */
            SELECT r.provider_id AS user_id,
                CASE r.rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2
                              WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END
            FROM reviews r JOIN services s ON r.service_id = s.id
            WHERE 1=1 {$r_window} AND s.category = {$cat_q}

            UNION ALL
            /* Cancellations (provider): -10 */
            SELECT o.provider_id AS user_id, -10 AS points
            FROM orders o JOIN services s ON o.service_id = s.id
            WHERE o.status = 'cancelled' {$o_cancel} AND s.category = {$cat_q}

            UNION ALL
            /* Repeat clients: +8 per pair */
            SELECT rc.provider_id AS user_id, 8 AS points FROM (
                SELECT o.provider_id, o.client_id
                FROM orders o JOIN services s ON o.service_id = s.id
                WHERE o.status = 'completed' {$o_window} AND s.category = {$cat_q}
                GROUP BY o.provider_id, o.client_id HAVING COUNT(*) >= 2
            ) AS rc
        ) AS actions
        GROUP BY user_id
    ";
} else {
    // Global view: all actions for all users
    $points_sql = "
        SELECT user_id, SUM(points) AS raw_points FROM (
            /* Provider completions: +15 */
            SELECT o.provider_id AS user_id, 15 AS points
            FROM orders o WHERE o.status = 'completed' {$o_window}

            UNION ALL
            /* Client completions: +5 */
            SELECT o.client_id AS user_id, 5 AS points
            FROM orders o WHERE o.status = 'completed' {$o_window}

            UNION ALL
            /* Reviews received (by rating) */
            SELECT r.provider_id AS user_id,
                CASE r.rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2
                              WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END
            FROM reviews r WHERE 1=1 {$r_window}

            UNION ALL
            /* Reviews left: +4 */
            SELECT r.reviewer_id AS user_id, 4 AS points
            FROM reviews r WHERE 1=1 {$r_window}

            UNION ALL
            /* Cancellations (provider side): -10 */
            SELECT o.provider_id AS user_id, -10 AS points
            FROM orders o WHERE o.status = 'cancelled' {$o_cancel}

            UNION ALL
            /* Cancellations (client side): -10 */
            SELECT o.client_id AS user_id, -10 AS points
            FROM orders o WHERE o.status = 'cancelled' {$o_cancel}

            UNION ALL
            /* Repeat clients (provider earns +8) */
            SELECT rc.provider_id AS user_id, 8 AS points FROM (
                SELECT o.provider_id, o.client_id
                FROM orders o WHERE o.status = 'completed' {$o_window}
                GROUP BY o.provider_id, o.client_id HAVING COUNT(*) >= 2
            ) AS rc

            UNION ALL
            /* Repeat providers (client earns +8) */
            SELECT rc.client_id AS user_id, 8 AS points FROM (
                SELECT o.client_id, o.provider_id
                FROM orders o WHERE o.status = 'completed' {$o_window}
                GROUP BY o.client_id, o.provider_id HAVING COUNT(*) >= 2
            ) AS rc

            " . ($has_client_reviews ? "
            UNION ALL
            /* Client reviews received (by rating) — bidirectional */
            SELECT cr.client_id AS user_id,
                CASE cr.rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2
                               WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END
            FROM client_reviews cr WHERE 1=1 {$cr_window}

            UNION ALL
            /* Client reviews left by provider: +4 */
            SELECT cr.reviewer_id AS user_id, 4 AS points
            FROM client_reviews cr WHERE 1=1 {$cr_window}
            " : "") . "
        ) AS actions
        GROUP BY user_id
    ";
}

// ---- Fetch raw points --------------------------------------------------

$stmt = $pdo->prepare($points_sql);
$stmt->execute();
$points_by_user = [];
foreach ($stmt->fetchAll() as $r) {
    $points_by_user[(int) $r['user_id']] = (float) $r['raw_points'];
}

if (empty($points_by_user)) {
    json_response(['leaderboard' => [], 'total' => 0]);
}

// ---- Fetch user details + display stats --------------------------------

$user_ids    = array_keys($points_by_user);
$placeholders = implode(',', array_fill(0, count($user_ids), '?'));
$cosmetic_select = cosmetic_select_sql();
$cosmetic_join   = cosmetic_join_sql('u');

$user_sql = "
    SELECT u.id, u.first_name, u.last_name, u.username, u.profile_image,
           u.major, u.university, u.bio, u.last_seen_at,
           COALESCE(AVG(rv.rating), 0) AS avg_rating,
           COUNT(DISTINCT rv.id) AS review_count,
           (SELECT COUNT(*) FROM orders
            WHERE provider_id = u.id AND status = 'completed') AS completed_orders,
           {$cosmetic_select}
    FROM users u
    LEFT JOIN reviews rv ON rv.provider_id = u.id
    {$cosmetic_join}
    WHERE u.id IN ({$placeholders}) AND u.deactivated_at IS NULL AND u.role != 'admin'
    GROUP BY u.id
";
$stmt = $pdo->prepare($user_sql);
$stmt->execute($user_ids);
$users = $stmt->fetchAll();

// ---- Compute final Buzz Scores -----------------------------------------

$k = 300; // logarithmic curve constant
$leaders = [];

foreach ($users as $u) {
    $uid = (int) $u['id'];
    $raw = $points_by_user[$uid] ?? 0;

    // Profile completion bonus (+10)
    if (!empty($u['bio']) && !empty($u['profile_image'])) {
        $raw += 10;
    }

    // Inactivity penalty: -1/day after 14 days, cap -20
    if (!empty($u['last_seen_at'])) {
        $days_inactive = max(0, (int) ((time() - strtotime($u['last_seen_at'])) / 86400));
        if ($days_inactive > 14) {
            $raw -= min($days_inactive - 14, 20);
        }
    }

    // Logarithmic normalisation: display = 1000 × (1 − e^(−raw/k))
    $display = ($raw > 0)
        ? round(1000 * (1 - exp(-$raw / $k)), 1)
        : 0;

    $leaders[] = [
        'id'               => $uid,
        'first_name'       => $u['first_name'],
        'last_name'        => $u['last_name'],
        'username'         => $u['username'],
        'profile_image'    => $u['profile_image'],
        'major'            => $u['major'],
        'university'       => $u['university'],
        'buzz_score'       => $display,
        'completed_orders' => (int) $u['completed_orders'],
        'avg_rating'       => round((float) $u['avg_rating'], 2),
        'review_count'     => (int) $u['review_count'],
        'cosmetics'        => build_cosmetics_from_row($u),
    ];
}

// Sort by buzz_score descending, then limit
usort($leaders, fn($a, $b) => $b['buzz_score'] <=> $a['buzz_score']);
$leaders = array_slice($leaders, 0, $limit);

json_response([
    'leaderboard' => $leaders,
    'total'       => count($leaders),
]);
