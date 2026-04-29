<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

// Query parameters
$provider_id = $_GET['provider_id'] ?? null;
$category    = $_GET['category']   ?? null;
$search      = $_GET['search']     ?? null;
if ($search) { $search = ltrim($search, '@'); }
$school_scope = $_GET['school_scope'] ?? null;
$min_price  = $_GET['min_price']  ?? null;
$max_price  = $_GET['max_price']  ?? null;
$min_rating = $_GET['min_rating'] ?? null;
$sort       = $_GET['sort']       ?? 'rating';
$page       = max(1, (int) ($_GET['page'] ?? 1));
$limit      = min(50, max(1, (int) ($_GET['limit'] ?? 12)));
$offset     = ($page - 1) * $limit;

// Build WHERE clauses
$where  = ['s.is_active = 1', 'u.deactivated_at IS NULL'];
$params = [];

if ($provider_id) {
    $where[]  = 's.provider_id = :provider_id';
    $params['provider_id'] = (int) $provider_id;
}

if ($category) {
    $where[]  = 's.category = :category';
    $params['category'] = $category;
}

if ($search) {
    $where[]  = '(s.title LIKE :search OR s.description LIKE :search2 OR u.username LIKE :search3 OR u.first_name LIKE :search4 OR u.last_name LIKE :search5 OR CONCAT(u.first_name, \' \', u.last_name) LIKE :search6 OR u.university LIKE :search7)';
    $params['search']  = "%$search%";
    $params['search2'] = "%$search%";
    $params['search3'] = "%$search%";
    $params['search4'] = "%$search%";
    $params['search5'] = "%$search%";
    $params['search6'] = "%$search%";
    $params['search7'] = "%$search%";
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

if ($min_price !== null && $min_price !== '') {
    $where[]  = 's.price >= :min_price';
    $params['min_price'] = (float) $min_price;
}

if ($max_price !== null && $max_price !== '') {
    $where[]  = 's.price <= :max_price';
    $params['max_price'] = (float) $max_price;
}

if ($min_rating !== null && $min_rating !== '') {
    $where[]  = 's.avg_rating >= :min_rating';
    $params['min_rating'] = (float) $min_rating;
}

$where_sql = implode(' AND ', $where);

// Sort order
$order_sql = match ($sort) {
    'price_asc'    => 's.price ASC',
    'price_desc'   => 's.price DESC',
    'rating_desc'  => 's.avg_rating DESC, s.review_count DESC',
    'newest'       => 's.created_at DESC',
    'oldest'       => 's.created_at ASC',
    'reviews'      => 's.review_count DESC',
    default        => 's.avg_rating DESC, s.review_count DESC',
};

// Count total matching records
$count_sql  = "SELECT COUNT(*) as total FROM services s JOIN users u ON s.provider_id = u.id WHERE $where_sql";
$count_stmt = $pdo->prepare($count_sql);
$count_stmt->execute($params);
$total = (int) $count_stmt->fetch()['total'];

// Fetch paginated results
$cosmetic_select = cosmetic_select_sql();
$cosmetic_join   = cosmetic_join_sql('u');

$sql = "SELECT s.id, s.title, s.category, s.description, s.pricing_type, s.price,
               s.custom_price_unit, s.avg_rating, s.review_count, s.created_at,
               u.id AS provider_id, u.first_name, u.last_name, u.username, u.profile_image,
               {$cosmetic_select}
        FROM services s
        JOIN users u ON s.provider_id = u.id
        {$cosmetic_join}
        WHERE $where_sql
        ORDER BY $order_sql
        LIMIT :lim OFFSET :off";

$stmt = $pdo->prepare($sql);
foreach ($params as $key => $val) {
    $stmt->bindValue($key, $val);
}
$stmt->bindValue('lim', $limit, PDO::PARAM_INT);
$stmt->bindValue('off', $offset, PDO::PARAM_INT);
$stmt->execute();
$services = $stmt->fetchAll();

// Batch-fetch cover images (first image per service)
$service_ids = array_column($services, 'id');
$covers = [];
if (!empty($service_ids)) {
    $placeholders = implode(',', array_fill(0, count($service_ids), '?'));
    $img_sql = "SELECT service_id, image_url FROM service_images
                WHERE service_id IN ($placeholders)
                AND sort_order = 0";
    $img_stmt = $pdo->prepare($img_sql);
    $img_stmt->execute($service_ids);
    foreach ($img_stmt->fetchAll() as $row) {
        $covers[(int) $row['service_id']] = $row['image_url'];
    }
}

// Cast numeric fields and add derived fields
foreach ($services as &$s) {
    $s['id']           = (int) $s['id'];
    $s['provider_id']  = (int) $s['provider_id'];
    $s['price']        = (float) $s['price'];
    $s['rating']       = (float) $s['avg_rating'];
    $s['review_count'] = (int) $s['review_count'];
    $s['price_unit']   = service_price_unit($s['pricing_type'], $s['custom_price_unit']);
    $s['provider_username'] = $s['username'];
    $s['thumbnail']    = isset($covers[$s['id']]) ? public_asset_url($covers[$s['id']]) : null;
    $s['cosmetics']    = build_cosmetics_from_row($s);
    unset($s['frame_metadata'], $s['badge_metadata']);
}

json_response([
    'services'   => $services,
    'pagination' => [
        'page'        => $page,
        'limit'       => $limit,
        'total'       => $total,
        'total_pages' => (int) ceil($total / $limit),
    ],
]);
