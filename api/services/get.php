<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$id = $_GET['id'] ?? null;
if (!$id) {
    json_response(['error' => 'Missing required parameter: id'], 400);
}

// Fetch service with provider info
$cosmetic_select = cosmetic_select_sql();
$cosmetic_join   = cosmetic_join_sql('u');

$stmt = $pdo->prepare(
    "SELECT s.id, s.provider_id, s.title, s.category, s.description, s.included,
            s.pricing_type, s.price, s.custom_price_unit, s.avg_rating, s.review_count, s.is_active, s.created_at,
            u.first_name AS provider_first_name, u.last_name AS provider_last_name,
            u.username AS provider_username, u.profile_image AS provider_profile_image,
            u.bio AS provider_bio, u.major AS provider_major, u.university AS provider_university,
            u.verified AS provider_verified,
            u.last_verified_at AS provider_last_verified_at,
            u.deactivated_at AS provider_deactivated_at,
            {$cosmetic_select}
     FROM services s
     JOIN users u ON s.provider_id = u.id
     {$cosmetic_join}
     WHERE s.id = :id"
);
$stmt->execute(['id' => (int) $id]);
$service = $stmt->fetch();

if (!$service) {
    json_response(['error' => 'Service not found'], 404);
}

// If the service is deactivated, only the owner can view it
if (!$service['is_active']) {
    $viewer_id = $_SESSION['user_id'] ?? null;
    if ((int) $viewer_id !== (int) $service['provider_id']) {
        json_response(['error' => 'Service not found'], 404);
    }
}

// If the provider account is deactivated, only the provider themselves can view their service
$provider_deactivated = !empty($service['provider_deactivated_at']);
if ($provider_deactivated) {
    $viewer_id = $_SESSION['user_id'] ?? null;
    if ((int) $viewer_id !== (int) $service['provider_id']) {
        json_response(['error' => 'Service not found'], 404);
    }
}

// Cast numeric fields
$service['id']           = (int) $service['id'];
$service['provider_id']  = (int) $service['provider_id'];
$service['price']        = (float) $service['price'];
$service['rating']       = (float) $service['avg_rating'];
$service['review_count'] = (int) $service['review_count'];
$service['price_unit']   = service_price_unit($service['pricing_type'], $service['custom_price_unit']);
$service['is_active']    = (bool) $service['is_active'];
$service['cosmetics']    = build_cosmetics_from_row($service);
unset($service['frame_metadata'], $service['badge_metadata']);

// Provider verified within the last year?
$service['provider_verified_recently'] = false;
if ($service['provider_verified'] && $service['provider_last_verified_at']) {
    $verified_at = new DateTime($service['provider_last_verified_at']);
    $one_year_ago = new DateTime('-1 year');
    $service['provider_verified_recently'] = $verified_at >= $one_year_ago;
}
unset($service['provider_verified'], $service['provider_last_verified_at']);

// Decode JSON included field
$service['included'] = json_decode($service['included'], true) ?? [];

// Fetch service images (return as flat URL array)
$img_stmt = $pdo->prepare(
    'SELECT image_url FROM service_images WHERE service_id = :service_id ORDER BY sort_order ASC'
);
$img_stmt->execute(['service_id' => (int) $id]);
$service['images'] = $img_stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($service['images'] as &$img_url) {
    $img_url = public_asset_url($img_url);
}
unset($img_url);

// Fetch recent reviews (latest 5) with reviewer names
$rev_stmt = $pdo->prepare(
    'SELECT r.id, r.rating, r.comment, r.helpful_count, r.created_at,
            u.first_name AS reviewer_first_name, u.last_name AS reviewer_last_name,
            u.username AS reviewer_username, u.profile_image AS reviewer_profile_image
     FROM reviews r
     JOIN users u ON r.reviewer_id = u.id
     WHERE r.service_id = :service_id
     ORDER BY r.created_at DESC
     LIMIT 5'
);
$rev_stmt->execute(['service_id' => (int) $id]);
$service['reviews'] = $rev_stmt->fetchAll();

foreach ($service['reviews'] as &$rev) {
    $rev['id']            = (int) $rev['id'];
    $rev['rating']        = (int) $rev['rating'];
    $rev['helpful_count'] = (int) $rev['helpful_count'];
}

// Average response time (in minutes) for the provider
$service['avg_response_minutes'] = null;
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
    $rt_stmt->execute([':id' => (int) $service['provider_id'], ':id2' => (int) $service['provider_id']]);
    $avg_gap = $rt_stmt->fetchColumn();
    if ($avg_gap !== null && $avg_gap !== false) {
        $service['avg_response_minutes'] = round((float) $avg_gap);
    }
} catch (Exception $e) {
    // skip if query fails
}

json_response(['service' => $service]);
