<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$body = get_json_body();

$title        = trim($body['title'] ?? '');
$category     = trim($body['category'] ?? '');
$description  = trim($body['description'] ?? '');
$included     = $body['included'] ?? [];
$pricing_type     = trim($body['pricing_type'] ?? '');
$price            = $body['price'] ?? null;
$custom_price_unit = trim($body['custom_price_unit'] ?? '');

// Validate required fields
if (!$title || !$category || !$description || !$pricing_type || $price === null) {
    json_response(['error' => 'title, category, description, pricing_type, and price are required'], 400);
}

// Length validation
if (mb_strlen($title) > 150) {
    json_response(['error' => 'Title must be 150 characters or less'], 400);
}
if (mb_strlen($description) > 2000) {
    json_response(['error' => 'Description must be 2,000 characters or less'], 400);
}
if ($custom_price_unit !== '' && mb_strlen($custom_price_unit) > 50) {
    json_response(['error' => 'Custom price unit must be 50 characters or less'], 400);
}
if (!is_array($included)) {
    $included = [];
}
if (count($included) > 10) {
    json_response(['error' => 'Included list must have 10 items or fewer'], 400);
}
foreach ($included as $item) {
    if (is_string($item) && mb_strlen($item) > 150) {
        json_response(['error' => 'Each included item must be 150 characters or less'], 400);
    }
}

if (!in_array($category, valid_categories(), true)) {
    json_response(['error' => 'Invalid category'], 400);
}

$valid_pricing = ['hourly','flat','custom'];
if (!in_array($pricing_type, $valid_pricing, true)) {
    json_response(['error' => 'Invalid pricing_type. Must be hourly, flat, or custom'], 400);
}

$price = (float) $price;
if ($price < 0) {
    json_response(['error' => 'Price must be non-negative'], 400);
}
if ($price > 9999.99) {
    json_response(['error' => 'Maximum price is ⬡ 9,999.99'], 400);
}

$included_json = json_encode(is_array($included) ? $included : []);

// Only store custom_price_unit when pricing_type is 'custom'
$unit_to_store = $pricing_type === 'custom' && $custom_price_unit !== '' ? $custom_price_unit : null;

$stmt = $pdo->prepare(
    'INSERT INTO services (provider_id, title, category, description, included, pricing_type, price, custom_price_unit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);
$images = $body['images'] ?? [];
if (!is_array($images)) {
    $images = [];
}

try {
    $pdo->beginTransaction();
    $stmt->execute([$user_id, $title, $category, $description, $included_json, $pricing_type, $price, $unit_to_store]);
    $service_id = (int) $pdo->lastInsertId();

    if (count($images) > 0) {
        persist_service_images($pdo, $service_id, $user_id, $images);
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

// Fetch the created service
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

json_response(['service' => $service], 201);
