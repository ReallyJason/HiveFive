<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('PATCH');

$user_id = require_auth();

$service_id = (int) ($_GET['id'] ?? 0);
if (!$service_id) {
    json_response(['error' => 'Service id is required (?id=X)'], 400);
}

// Verify ownership
$stmt = $pdo->prepare('SELECT * FROM services WHERE id = ? AND provider_id = ?');
$stmt->execute([$service_id, $user_id]);
$service = $stmt->fetch();

if (!$service) {
    json_response(['error' => 'Service not found or you do not own it'], 404);
}

$body = get_json_body();

$allowed_fields = ['title', 'category', 'description', 'included', 'pricing_type', 'price', 'is_active', 'custom_price_unit'];
$valid_pricing = ['hourly','flat','custom'];

$updates = [];
$params  = [];

foreach ($allowed_fields as $field) {
    if (!array_key_exists($field, $body)) {
        continue;
    }

    $value = $body[$field];

    if ($field === 'category') {
        if (!in_array($value, valid_categories(), true)) {
            json_response(['error' => 'Invalid category'], 400);
        }
    }

    if ($field === 'pricing_type') {
        if (!in_array($value, $valid_pricing, true)) {
            json_response(['error' => 'Invalid pricing_type'], 400);
        }
    }

    if ($field === 'price') {
        $value = (float) $value;
        if ($value < 0) {
            json_response(['error' => 'Price must be non-negative'], 400);
        }
        if ($value > 9999.99) {
            json_response(['error' => 'Maximum price is ⬡ 9,999.99'], 400);
        }
    }

    if ($field === 'included') {
        if (!is_array($value)) { $value = []; }
        if (count($value) > 10) {
            json_response(['error' => 'Included list must have 10 items or fewer'], 400);
        }
        $value = json_encode($value);
    }

    if ($field === 'is_active') {
        $value = $value ? 1 : 0;
    }

    if ($field === 'title' || $field === 'description') {
        $value = trim($value);
        if ($value === '') {
            json_response(['error' => "$field cannot be empty"], 400);
        }
        if ($field === 'title' && mb_strlen($value) > 150) {
            json_response(['error' => 'Title must be 150 characters or less'], 400);
        }
        if ($field === 'description' && mb_strlen($value) > 2000) {
            json_response(['error' => 'Description must be 2,000 characters or less'], 400);
        }
    }

    if ($field === 'custom_price_unit') {
        $value = trim($value);
        if ($value === '') {
            $value = null;
        }
        if ($value !== null && mb_strlen($value) > 50) {
            json_response(['error' => 'Custom price unit must be 50 characters or less'], 400);
        }
    }

    $updates[] = "$field = ?";
    $params[]  = $value;
}

if (empty($updates)) {
    json_response(['error' => 'No valid fields to update'], 400);
}

$images = $body['images'] ?? null;
if ($images !== null && !is_array($images)) {
    json_response(['error' => 'Images must be an array'], 400);
}

$params[] = $service_id;
$sql = 'UPDATE services SET ' . implode(', ', $updates) . ' WHERE id = ?';
$stmt = $pdo->prepare($sql);
$old_image_urls = [];

try {
    $pdo->beginTransaction();
    $stmt->execute($params);

    $old_image_urls = [];
    if (is_array($images)) {
        $old_imgs = $pdo->prepare('SELECT image_url FROM service_images WHERE service_id = ?');
        $old_imgs->execute([$service_id]);
        $old_image_urls = $old_imgs->fetchAll(PDO::FETCH_COLUMN);

        $del_stmt = $pdo->prepare('DELETE FROM service_images WHERE service_id = ?');
        $del_stmt->execute([$service_id]);

        if (count($images) > 0) {
            persist_service_images($pdo, $service_id, $user_id, $images);
        }
    }

    $pdo->commit();
} catch (RuntimeException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    json_response(['error' => $e->getMessage()], 500);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    throw $e;
}

if (!empty($old_image_urls) && is_array($images)) {
    delete_uploaded_service_files($old_image_urls);
}

// Return updated service
$stmt = $pdo->prepare('SELECT * FROM services WHERE id = ?');
$stmt->execute([$service_id]);
$service = $stmt->fetch();

$service['id']           = (int) $service['id'];
$service['provider_id']  = (int) $service['provider_id'];
$service['price']        = (float) $service['price'];
$service['avg_rating']   = (float) $service['avg_rating'];
$service['review_count'] = (int) $service['review_count'];
$service['is_active']    = (bool) $service['is_active'];
$service['included']     = json_decode($service['included'], true);

json_response(['service' => $service]);
