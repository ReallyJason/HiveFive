<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$body = get_json_body();

$data_url = $body['image'] ?? '';
if (!$data_url) {
    json_response(['error' => 'No image provided'], 400);
}

try {
    $decoded = parse_base64_data_url($data_url);
    if (image_upload_meta($decoded['mime']) === null) {
        json_response(['error' => 'Invalid image format. Accepted: JPEG, PNG, GIF, WebP, HEIC, HEIF, AVIF'], 400);
    }
    $binary = $decoded['binary'];
    $mime = $decoded['mime'];
    if (strlen($binary) > 5 * 1024 * 1024) {
        json_response(['error' => 'Image too large. Maximum size is 5MB'], 400);
    }
} catch (RuntimeException $e) {
    json_response(['error' => $e->getMessage()], 400);
}

// Delete old profile image file if it exists
$stmt = $pdo->prepare('SELECT profile_image FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$old_image = $stmt->fetchColumn();

if ($old_image && str_starts_with($old_image, '/api/uploads/profiles/')) {
    $old_path = __DIR__ . '/../uploads/profiles/' . basename($old_image);
    if (file_exists($old_path)) {
        unlink($old_path);
    }
}

$upload_dir = __DIR__ . '/../uploads/profiles';
ensure_upload_dir($upload_dir, 0755);

$filename = "{$user_id}_" . time() . ".jpg";
$filepath = $upload_dir . '/' . $filename;

try {
    $input_ext = image_upload_meta($mime)['input_ext'];
    $processed = convert_image_binary_with_magick(
        $binary,
        $input_ext,
        'jpg',
        ['-auto-orient', '-strip', '-thumbnail', '400x400^', '-gravity', 'center', '-extent', '400x400', '-quality', '90']
    );
    $bytes_written = file_put_contents($filepath, $processed, LOCK_EX);
    if ($bytes_written === false || $bytes_written !== strlen($processed)) {
        throw new RuntimeException('Failed to save the uploaded photo');
    }
} catch (RuntimeException $e) {
    try {
        $normalized = normalize_uploaded_image_binary($binary, $mime);
        $filename = "{$user_id}_" . time() . '.' . $normalized['extension'];
        $filepath = $upload_dir . '/' . $filename;
        $bytes_written = file_put_contents($filepath, $normalized['binary'], LOCK_EX);
        if ($bytes_written === false || $bytes_written !== strlen($normalized['binary'])) {
            json_response(['error' => 'Failed to save the uploaded photo'], 500);
        }
    } catch (RuntimeException $fallbackError) {
        json_response(['error' => $fallbackError->getMessage()], 400);
    }
}

$url = '/api/uploads/profiles/' . $filename;

// Update database
$stmt = $pdo->prepare('UPDATE users SET profile_image = ? WHERE id = ?');
$stmt->execute([$url, $user_id]);

json_response(['profile_image' => $url]);
