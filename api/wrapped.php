<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db_config.php';
cors();
require_method('GET');

$user_id = require_auth();

// Semester window detection
$semester_param = $_GET['semester'] ?? null;

if ($semester_param && preg_match('/^(\d{4})-(spring|summer|fall)$/', $semester_param, $m)) {
    $year = (int) $m[1];
    $season = $m[2];
} else {
    $year = (int) date('Y');
    $month = (int) date('n');
    $day = (int) date('j');

    if ($month <= 5 || ($month == 5 && $day <= 31)) {
        $season = 'spring';
    } elseif ($month < 8 || ($month == 8 && $day < 15)) {
        $season = 'summer';
    } else {
        $season = 'fall';
    }
}

switch ($season) {
    case 'spring':
        $window_start = "$year-01-15 00:00:00";
        $window_end   = "$year-05-31 23:59:59";
        $semester_label = "Spring $year";
        break;
    case 'summer':
        $window_start = "$year-06-01 00:00:00";
        $window_end   = "$year-08-14 23:59:59";
        $semester_label = "Summer $year";
        break;
    case 'fall':
    default:
        $window_start = "$year-08-15 00:00:00";
        $window_end   = "$year-12-31 23:59:59";
        $semester_label = "Fall $year";
        break;
}

// Fetch user details
$u_stmt = $pdo->prepare('SELECT first_name, last_name, username, email, university, profile_image, bio, last_seen_at, created_at FROM users WHERE id = ? AND deactivated_at IS NULL');
$u_stmt->execute([$user_id]);
$user_row = $u_stmt->fetch();
if (!$user_row) {
    json_response(['error' => 'User not found'], 404);
}

$university = $user_row['university'] ?: university_from_email($user_row['email']);

// --- Total earned in semester ---
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'earning' AND created_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$total_earned = round((float) $stmt->fetchColumn(), 2);

// --- Total spent in semester ---
$stmt = $pdo->prepare("SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'spending' AND created_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$total_spent = round((float) $stmt->fetchColumn(), 2);

// --- Orders completed as provider ---
$stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE provider_id = ? AND status = 'completed' AND completed_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$orders_as_provider = (int) $stmt->fetchColumn();

// --- Orders completed as client ---
$stmt = $pdo->prepare("SELECT COUNT(*) FROM orders WHERE client_id = ? AND status = 'completed' AND completed_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$orders_as_client = (int) $stmt->fetchColumn();

// --- 5-star reviews received ---
$stmt = $pdo->prepare("SELECT COUNT(*) FROM reviews WHERE provider_id = ? AND rating = 5 AND created_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$five_star_reviews = (int) $stmt->fetchColumn();

// --- Average rating in semester ---
$stmt = $pdo->prepare("SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE provider_id = ? AND created_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$average_rating = round((float) $stmt->fetchColumn(), 2);

// --- Top category from completed provider orders ---
$stmt = $pdo->prepare("
    SELECT s.category, COUNT(*) AS cnt
    FROM orders o
    JOIN services s ON o.service_id = s.id
    WHERE o.provider_id = ? AND o.status = 'completed' AND o.completed_at BETWEEN ? AND ?
    GROUP BY s.category
    ORDER BY cnt DESC
    LIMIT 1
");
$stmt->execute([$user_id, $window_start, $window_end]);
$top_cat_row = $stmt->fetch();
$top_category = $top_cat_row ? $top_cat_row['category'] : null;

// --- Count distinct categories ---
$stmt = $pdo->prepare("
    SELECT COUNT(DISTINCT s.category)
    FROM orders o
    JOIN services s ON o.service_id = s.id
    WHERE o.provider_id = ? AND o.status = 'completed' AND o.completed_at BETWEEN ? AND ?
");
$stmt->execute([$user_id, $window_start, $window_end]);
$category_count = (int) $stmt->fetchColumn();

// --- Best review (highest rated, then longest comment) ---
$stmt = $pdo->prepare("
    SELECT r.rating, r.comment, u.first_name AS reviewer_name
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.provider_id = ? AND r.created_at BETWEEN ? AND ? AND r.comment IS NOT NULL AND r.comment != ''
    ORDER BY r.rating DESC, LENGTH(r.comment) DESC
    LIMIT 1
");
$stmt->execute([$user_id, $window_start, $window_end]);
$best_review_row = $stmt->fetch();
$best_review = $best_review_row ? [
    'quote' => mb_substr($best_review_row['comment'], 0, 280),
    'reviewer_name' => $best_review_row['reviewer_name'],
    'rating' => (int) $best_review_row['rating'],
] : null;

// --- Unique clients served ---
$stmt = $pdo->prepare("SELECT COUNT(DISTINCT client_id) FROM orders WHERE provider_id = ? AND status = 'completed' AND completed_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$unique_clients = (int) $stmt->fetchColumn();

// --- Services posted in semester ---
$stmt = $pdo->prepare("SELECT COUNT(*) FROM services WHERE provider_id = ? AND created_at BETWEEN ? AND ?");
$stmt->execute([$user_id, $window_start, $window_end]);
$services_posted = (int) $stmt->fetchColumn();

// --- Buzz Score for semester window ---
$has_cr = false;
try { $pdo->query('SELECT 1 FROM client_reviews LIMIT 0'); $has_cr = true; } catch (Exception $e) {}

$o_window_sql  = "AND o.completed_at BETWEEN '$window_start' AND '$window_end'";
$o_cancel_sql  = "AND o.created_at   BETWEEN '$window_start' AND '$window_end'";
$r_window_sql  = "AND r.created_at   BETWEEN '$window_start' AND '$window_end'";
$cr_window_sql = "AND cr.created_at  BETWEEN '$window_start' AND '$window_end'";

$all_buzz_sql = "
    SELECT user_id, SUM(points) AS raw_points FROM (
        SELECT o.provider_id AS user_id, 15 AS points FROM orders o WHERE o.status = 'completed' {$o_window_sql}
        UNION ALL
        SELECT o.client_id AS user_id, 5 FROM orders o WHERE o.status = 'completed' {$o_window_sql}
        UNION ALL
        SELECT r.provider_id, CASE r.rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2 WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END FROM reviews r WHERE 1=1 {$r_window_sql}
        UNION ALL
        SELECT r.reviewer_id, 4 FROM reviews r WHERE 1=1 {$r_window_sql}
        UNION ALL
        SELECT o.provider_id, -10 FROM orders o WHERE o.status = 'cancelled' {$o_cancel_sql}
        UNION ALL
        SELECT o.client_id, -10 FROM orders o WHERE o.status = 'cancelled' {$o_cancel_sql}
        UNION ALL
        SELECT rc.provider_id, 8 FROM (SELECT o.provider_id, o.client_id FROM orders o WHERE o.status = 'completed' {$o_window_sql} GROUP BY o.provider_id, o.client_id HAVING COUNT(*) >= 2) rc
        UNION ALL
        SELECT rc.client_id, 8 FROM (SELECT o.client_id, o.provider_id FROM orders o WHERE o.status = 'completed' {$o_window_sql} GROUP BY o.client_id, o.provider_id HAVING COUNT(*) >= 2) rc
        " . ($has_cr ? "
        UNION ALL
        SELECT cr.client_id, CASE cr.rating WHEN 5 THEN 10 WHEN 4 THEN 6 WHEN 3 THEN 2 WHEN 2 THEN -3 WHEN 1 THEN -8 ELSE 0 END FROM client_reviews cr WHERE 1=1 {$cr_window_sql}
        UNION ALL
        SELECT cr.reviewer_id, 4 FROM client_reviews cr WHERE 1=1 {$cr_window_sql}
        " : "") . "
    ) actions
    GROUP BY user_id
    HAVING raw_points > 0
";

$stmt = $pdo->query($all_buzz_sql);
$all_scores = [];
$k = 300;
foreach ($stmt->fetchAll() as $row) {
    $raw = (float) $row['raw_points'];
    $display = round(1000 * (1 - exp(-$raw / $k)), 1);
    $all_scores[(int) $row['user_id']] = $display;
}

$my_buzz = $all_scores[$user_id] ?? 0;

// Percentile and campus rank
$total_with_scores = count($all_scores);
$below_me = 0;
foreach ($all_scores as $uid => $score) {
    if ($score < $my_buzz) $below_me++;
}
$buzz_percentile = $total_with_scores > 0 ? round(($below_me / $total_with_scores) * 100) : 0;

// Campus rank — filter to same university
$campus_rank = 1;
$total_users_at_campus = 0;
if ($university) {
    $campus_stmt = $pdo->prepare("SELECT id FROM users WHERE university = ? AND deactivated_at IS NULL");
    $campus_stmt->execute([$university]);
    $campus_user_ids = array_column($campus_stmt->fetchAll(), 'id');
    $campus_user_ids = array_map('intval', $campus_user_ids);

    $campus_scores = [];
    foreach ($campus_user_ids as $cuid) {
        if (isset($all_scores[$cuid])) {
            $campus_scores[$cuid] = $all_scores[$cuid];
        }
    }

    arsort($campus_scores);
    $total_users_at_campus = count($campus_scores);
    $rank = 1;
    foreach ($campus_scores as $cuid => $cscore) {
        if ($cuid === $user_id) { $campus_rank = $rank; break; }
        $rank++;
    }
    if (!isset($campus_scores[$user_id])) {
        $campus_rank = $total_users_at_campus + 1;
        $total_users_at_campus++;
    }
}

$has_activity = ($orders_as_provider + $orders_as_client + $services_posted + $five_star_reviews) > 0;

json_response([
    'wrapped' => [
        'semester_label'              => $semester_label,
        'has_activity'                => $has_activity,
        'total_earned'                => $total_earned,
        'total_spent'                 => $total_spent,
        'orders_completed_as_provider'=> $orders_as_provider,
        'orders_completed_as_client'  => $orders_as_client,
        'five_star_reviews'           => $five_star_reviews,
        'average_rating'              => $average_rating,
        'top_category'                => $top_category,
        'category_count'              => $category_count,
        'best_review'                 => $best_review,
        'unique_clients'              => $unique_clients,
        'buzz_score'                  => $my_buzz,
        'buzz_percentile'             => $buzz_percentile,
        'campus_rank'                 => $campus_rank,
        'total_users_at_campus'       => $total_users_at_campus,
        'services_posted'             => $services_posted,
    ],
    'user' => [
        'first_name'    => $user_row['first_name'],
        'university'    => $university,
        'profile_image' => public_asset_url($user_row['profile_image']),
        'username'      => $user_row['username'],
    ],
]);
