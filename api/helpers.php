<?php
// Session: server-side files live 30 days (for remember-me users)
// Default cookie = browser session (lifetime 0); login overrides for remember-me
$thirty_days = 30 * 24 * 60 * 60; // 2592000 seconds
ini_set('session.gc_maxlifetime', $thirty_days);
ini_set('session.use_strict_mode', 1);
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => !empty($_SERVER['HTTPS']) || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
    'httponly'  => true,
    'samesite' => 'Lax',
]);
session_start();

function cors() {
    header('Content-Type: application/json');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = ['http://localhost:3000', 'http://localhost:5173',
                'https://aptitude.cse.buffalo.edu', 'https://cattle.cse.buffalo.edu',
                'https://jasonhusoftware.com', 'https://www.jasonhusoftware.com',
                'https://hive.jasonhusoftware.com'];
    if (in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_response($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function require_auth() {
    if (empty($_SESSION['user_id'])) {
        json_response(['error' => 'Unauthorized'], 401);
    }
    return (int) $_SESSION['user_id'];
}

function require_admin() {
    $user_id = require_auth();
    if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        json_response(['error' => 'Not found'], 404);
    }
    return $user_id;
}

function get_json_body() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return $data ?? [];
}

function require_method($method) {
    $method = strtoupper($method);
    if ($_SERVER['REQUEST_METHOD'] !== $method) {
        json_response(['error' => "Method $method required"], 405);
    }
}

/**
 * Canonical university mapping for known .edu email domains.
 * For known domains, university identity is derived from email domain
 * rather than user-provided text.
 */
function university_from_email(string $email): ?string {
    $domain = strtolower(trim(substr(strrchr($email, '@') ?: '', 1)));
    if ($domain === '') return null;

    static $map = [
        'harvard.edu'      => 'Harvard University',
        'yale.edu'         => 'Yale University',
        'princeton.edu'    => 'Princeton University',
        'columbia.edu'     => 'Columbia University',
        'upenn.edu'        => 'University of Pennsylvania',
        'brown.edu'        => 'Brown University',
        'dartmouth.edu'    => 'Dartmouth College',
        'cornell.edu'      => 'Cornell University',
        'stanford.edu'     => 'Stanford University',
        'mit.edu'          => 'Massachusetts Institute of Technology (MIT)',
        'caltech.edu'      => 'California Institute of Technology (Caltech)',
        'cmu.edu'          => 'Carnegie Mellon University',
        'duke.edu'         => 'Duke University',
        'northwestern.edu' => 'Northwestern University',
        'nd.edu'           => 'University of Notre Dame',
        'vanderbilt.edu'   => 'Vanderbilt University',
        'emory.edu'        => 'Emory University',
        'rice.edu'         => 'Rice University',
        'wustl.edu'        => 'Washington University in St. Louis',
        'georgetown.edu'   => 'Georgetown University',
        'nyu.edu'          => 'New York University (NYU)',
        'bu.edu'           => 'Boston University',
        'northeastern.edu' => 'Northeastern University',
        'usc.edu'          => 'University of Southern California (USC)',
        'buffalo.edu'      => 'University at Buffalo (SUNY)',
        'umich.edu'        => 'University of Michigan',
        'unc.edu'          => 'University of North Carolina at Chapel Hill',
        'uva.edu'          => 'University of Virginia',
        'gatech.edu'       => 'Georgia Institute of Technology',
        'utexas.edu'       => 'University of Texas at Austin',
        'ucla.edu'         => 'University of California, Los Angeles (UCLA)',
        'berkeley.edu'     => 'University of California, Berkeley',
        'ucsd.edu'         => 'University of California, San Diego',
        'ucdavis.edu'      => 'University of California, Davis',
        'uci.edu'          => 'University of California, Irvine',
        'ucsb.edu'         => 'University of California, Santa Barbara',
        'uw.edu'           => 'University of Washington',
        'wisc.edu'         => 'University of Wisconsin-Madison',
        'umn.edu'          => 'University of Minnesota',
        'osu.edu'          => 'Ohio State University',
        'psu.edu'          => 'Pennsylvania State University',
        'illinois.edu'     => 'University of Illinois Urbana-Champaign',
        'purdue.edu'       => 'Purdue University',
        'iu.edu'           => 'Indiana University Bloomington',
        'ufl.edu'          => 'University of Florida',
        'fsu.edu'          => 'Florida State University',
        'tamu.edu'         => 'Texas A&M University',
        'rutgers.edu'      => 'Rutgers University',
        'umd.edu'          => 'University of Maryland',
        'virginia.edu'     => 'University of Virginia',
        'umass.edu'        => 'University of Massachusetts Amherst',
    ];

    if (isset($map[$domain])) return $map[$domain];

    // Accept recognized parent domains for departmental subdomains
    foreach ($map as $known_domain => $university) {
        if (str_ends_with($domain, '.' . $known_domain)) {
            return $university;
        }
    }

    return 'Not a University student';
}

/**
 * Canonical marketplace categories shared by service/request endpoints.
 */
function valid_categories(): array {
    return [
        'Beauty',
        'Career',
        'Coaching',
        'Coding',
        'Consulting',
        'Cooking',
        'Design',
        'Errands',
        'Events',
        'Fitness',
        'Language',
        'Moving',
        'Music',
        'Pet Care',
        'Photography',
        'Rides',
        'Tech Support',
        'Tutoring',
        'Video',
        'Writing',
        'Other',
    ];
}

function ensure_upload_dir(string $dir, int $permissions = 0775): void {
    if (!is_dir($dir) && !mkdir($dir, $permissions, true) && !is_dir($dir)) {
        throw new RuntimeException('Unable to prepare an upload directory');
    }
    if (!is_writable($dir)) {
        throw new RuntimeException('Upload directory is not writable');
    }
}

function parse_base64_data_url(string $data_url): array {
    if (!preg_match('/^data:([^;,]+)(?:;[^,]*)*;base64,(.+)$/s', $data_url, $matches)) {
        throw new RuntimeException('Unsupported uploaded file format');
    }

    $binary = base64_decode($matches[2], true);
    if ($binary === false) {
        throw new RuntimeException('Uploaded file data is invalid');
    }

    return [
        'mime' => strtolower(trim($matches[1])),
        'binary' => $binary,
    ];
}

function uploaded_image_mime_map(): array {
    return [
        'image/jpeg' => ['input_ext' => 'jpg', 'storage_ext' => 'jpg', 'convert' => false],
        'image/png' => ['input_ext' => 'png', 'storage_ext' => 'png', 'convert' => false],
        'image/gif' => ['input_ext' => 'gif', 'storage_ext' => 'gif', 'convert' => false],
        'image/webp' => ['input_ext' => 'webp', 'storage_ext' => 'webp', 'convert' => false],
        'image/heic' => ['input_ext' => 'heic', 'storage_ext' => 'jpg', 'convert' => true],
        'image/heif' => ['input_ext' => 'heif', 'storage_ext' => 'jpg', 'convert' => true],
        'image/avif' => ['input_ext' => 'avif', 'storage_ext' => 'jpg', 'convert' => true],
    ];
}

function image_upload_meta(string $mime): ?array {
    return uploaded_image_mime_map()[$mime] ?? null;
}

function find_magick_binary(): ?string {
    static $binary = false;
    if ($binary !== false) {
        return $binary;
    }

    foreach (['magick', 'convert'] as $candidate) {
        $output = [];
        $exit = 1;
        @exec("command -v {$candidate} 2>/dev/null", $output, $exit);
        if ($exit === 0 && !empty($output[0])) {
            $binary = trim($output[0]);
            return $binary;
        }
    }

    $binary = null;
    return null;
}

function convert_image_binary_with_magick(string $binary, string $input_ext, string $output_ext, array $args): string {
    $magick = find_magick_binary();
    if ($magick === null) {
        throw new RuntimeException('This server cannot process that image format yet. Please convert it and try again.');
    }

    $input_base = tempnam(sys_get_temp_dir(), 'hive-img-in-');
    $output_base = tempnam(sys_get_temp_dir(), 'hive-img-out-');
    if ($input_base === false || $output_base === false) {
        throw new RuntimeException('Unable to prepare a temporary image file');
    }

    $input_path = $input_base . '.' . $input_ext;
    $output_path = $output_base . '.' . $output_ext;
    @unlink($input_base);
    @unlink($output_base);

    if (file_put_contents($input_path, $binary, LOCK_EX) !== strlen($binary)) {
        @unlink($input_path);
        throw new RuntimeException('Failed to stage the uploaded image');
    }

    $command = escapeshellarg($magick) . ' ' . escapeshellarg($input_path . '[0]');
    foreach ($args as $arg) {
        $command .= ' ' . escapeshellarg($arg);
    }
    $command .= ' ' . escapeshellarg($output_path) . ' 2>&1';

    $output = [];
    $exit_code = 1;
    @exec($command, $output, $exit_code);

    $converted = ($exit_code === 0 && file_exists($output_path))
        ? file_get_contents($output_path)
        : false;

    @unlink($input_path);
    @unlink($output_path);

    if (!is_string($converted) || $converted === '') {
        throw new RuntimeException('Failed to process the uploaded image');
    }

    return $converted;
}

function normalize_uploaded_image_binary(string $binary, string $mime, int $max_bytes = 5 * 1024 * 1024): array {
    $meta = image_upload_meta($mime);
    if ($meta === null) {
        throw new RuntimeException('Unsupported image format');
    }
    if (strlen($binary) > $max_bytes) {
        throw new RuntimeException('Uploaded image exceeds the 5MB limit');
    }

    if (!$meta['convert']) {
        return [
            'binary' => $binary,
            'extension' => $meta['storage_ext'],
            'mime' => $mime,
        ];
    }

    $converted = convert_image_binary_with_magick(
        $binary,
        $meta['input_ext'],
        'jpg',
        ['-auto-orient', '-strip', '-resize', '2400x2400>', '-quality', '88']
    );

    if (strlen($converted) > $max_bytes) {
        throw new RuntimeException('Converted image exceeds the 5MB limit');
    }

    return [
        'binary' => $converted,
        'extension' => 'jpg',
        'mime' => 'image/jpeg',
    ];
}

/**
 * Absolute filesystem path used for service cover uploads.
 */
function service_upload_dir(): string {
    return __DIR__ . '/uploads/services';
}

/**
 * Convert a stored /api/uploads/... URL into a local filesystem path.
 */
function uploaded_service_file_path(string $image_url): ?string {
    $prefix = '/api/uploads/services/';
    if (!str_starts_with($image_url, $prefix)) {
        return null;
    }

    return service_upload_dir() . '/' . basename($image_url);
}

/**
 * Persist service cover images and return the stored URL paths.
 * Accepts either new data URLs or already-stored /api/uploads/... URLs.
 *
 * @throws RuntimeException when an image is provided but cannot be persisted.
 */
function persist_service_images(PDO $pdo, int $service_id, int $user_id, array $images): array {
    if (count($images) === 0) {
        return [];
    }

    $upload_dir = service_upload_dir();
    ensure_upload_dir($upload_dir);

    $img_stmt = $pdo->prepare(
        'INSERT INTO service_images (service_id, image_url, sort_order) VALUES (?, ?, ?)'
    );

    $stored_urls = [];
    $sort = 0;

    foreach (array_slice($images, 0, 1) as $img) {
        if (is_string($img) && str_starts_with($img, 'data:')) {
            $decoded = parse_base64_data_url($img);
            $normalized = normalize_uploaded_image_binary($decoded['binary'], $decoded['mime']);

            $filename = "{$service_id}_{$sort}_{$user_id}." . $normalized['extension'];
            $filepath = $upload_dir . '/' . $filename;
            $bytes_written = file_put_contents($filepath, $normalized['binary'], LOCK_EX);
            if ($bytes_written === false || $bytes_written !== strlen($normalized['binary'])) {
                if (file_exists($filepath)) {
                    unlink($filepath);
                }
                throw new RuntimeException('Failed to save the uploaded image to disk');
            }

            $url = '/api/uploads/services/' . $filename;
            $img_stmt->execute([$service_id, $url, $sort]);
            $stored_urls[] = $url;
            $sort++;
            continue;
        }

        if (is_string($img) && str_starts_with($img, '/api/uploads/')) {
            $img_stmt->execute([$service_id, $img, $sort]);
            $stored_urls[] = $img;
            $sort++;
            continue;
        }

        throw new RuntimeException('Unsupported service image format');
    }

    if (count($stored_urls) === 0) {
        throw new RuntimeException('No service image could be saved');
    }

    return $stored_urls;
}

/**
 * Remove previously stored uploaded service image files from disk.
 */
function delete_uploaded_service_files(array $image_urls): void {
    foreach ($image_urls as $old_url) {
        if (!is_string($old_url)) {
            continue;
        }
        $old_path = uploaded_service_file_path($old_url);
        if ($old_path === null) {
            continue;
        }
        if (file_exists($old_path)) {
            unlink($old_path);
        }
    }
}

function message_attachment_dir(): string {
    return __DIR__ . '/uploads/messages_private';
}

function message_attachment_file_path(string $storage_name): string {
    return message_attachment_dir() . '/' . basename($storage_name);
}

function message_attachment_allowed_file_map(): array {
    return [
        'application/pdf' => ['kind' => 'file', 'ext' => 'pdf'],
        'text/markdown' => ['kind' => 'file', 'ext' => 'md'],
        'text/x-markdown' => ['kind' => 'file', 'ext' => 'md'],
        'text/plain' => ['kind' => 'file', 'ext' => 'txt'],
        'text/csv' => ['kind' => 'file', 'ext' => 'csv'],
        'application/msword' => ['kind' => 'file', 'ext' => 'doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['kind' => 'file', 'ext' => 'docx'],
        'application/vnd.ms-excel' => ['kind' => 'file', 'ext' => 'xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' => ['kind' => 'file', 'ext' => 'xlsx'],
        'application/vnd.ms-powerpoint' => ['kind' => 'file', 'ext' => 'ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => ['kind' => 'file', 'ext' => 'pptx'],
    ];
}

function message_attachment_url(int $attachment_id, bool $download = false): string {
    return app_base_path() . '/api/messages/attachment.php?id=' . $attachment_id . ($download ? '&download=1' : '');
}

function sanitize_attachment_name(?string $name, string $fallback_ext): string {
    $candidate = trim((string) $name);
    $candidate = str_replace('\\', '/', $candidate);
    $candidate = basename($candidate);
    $candidate = preg_replace('/[^\pL\pN ._-]+/u', '_', $candidate) ?? '';
    $candidate = trim($candidate, " .\t\n\r\0\x0B");

    if ($candidate === '' || $candidate === '.' || $candidate === '..') {
        return 'attachment.' . $fallback_ext;
    }

    if (!str_contains($candidate, '.')) {
        return $candidate . '.' . $fallback_ext;
    }

    return mb_substr($candidate, 0, 255);
}

function message_preview_text(string $body, array $attachments = []): string {
    $trimmed = trim(message_plain_text($body));
    if ($trimmed !== '') {
        return mb_substr($trimmed, 0, 255);
    }

    $attachment_count = count($attachments);
    if ($attachment_count === 0) {
        return '';
    }

    $image_count = 0;
    foreach ($attachments as $attachment) {
        if (($attachment['kind'] ?? null) === 'image') {
            $image_count++;
        }
    }

    if ($image_count === $attachment_count) {
        return $attachment_count === 1 ? 'Sent a photo' : "Sent {$attachment_count} photos";
    }

    return $attachment_count === 1 ? 'Sent an attachment' : "Sent {$attachment_count} attachments";
}

function message_plain_text(string $body): string {
    $text = str_replace("\r\n", "\n", $body);
    $text = preg_replace('/!\[([^\]]*)\]\(([^)]+)\)/', '$1', $text) ?? $text;
    $text = preg_replace('/\[([^\]]+)\]\(([^)]+)\)/', '$1', $text) ?? $text;
    $text = preg_replace('/^>\s?/m', '', $text) ?? $text;
    $text = preg_replace('/^#{1,6}\s+/m', '', $text) ?? $text;
    $text = preg_replace('/(```|~~~)/', '', $text) ?? $text;
    $text = preg_replace('/(`)([^`]+)(`)/', '$2', $text) ?? $text;
    $text = preg_replace('/(\*\*|__|\*|_|~~)/', '', $text) ?? $text;
    $text = preg_replace("/\n{3,}/", "\n\n", $text) ?? $text;
    return trim($text);
}

function delete_message_attachment_files(array $storage_names): void {
    foreach ($storage_names as $storage_name) {
        if (!is_string($storage_name) || $storage_name === '') {
            continue;
        }

        $path = message_attachment_file_path($storage_name);
        if (file_exists($path)) {
            @unlink($path);
        }
    }
}

function persist_message_attachments(PDO $pdo, int $message_id, array $attachments): array {
    if (count($attachments) === 0) {
        return ['attachments' => [], 'stored_files' => []];
    }
    if (count($attachments) > 5) {
        throw new RuntimeException('You can send up to 5 attachments at a time');
    }

    $upload_dir = message_attachment_dir();
    ensure_upload_dir($upload_dir);

    $stmt = $pdo->prepare(
        'INSERT INTO message_attachments (message_id, kind, original_name, mime_type, file_size, storage_name, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    $stored = [];
    $stored_files = [];

    foreach (array_values($attachments) as $sort => $attachment) {
        if (!is_array($attachment)) {
            throw new RuntimeException('Each attachment must be a file upload');
        }

        $data_url = trim((string) ($attachment['data_url'] ?? ''));
        if ($data_url === '') {
            throw new RuntimeException('Each attachment must include file data');
        }

        $declared_mime = strtolower(trim((string) ($attachment['type'] ?? '')));
        $decoded = parse_base64_data_url($data_url);
        $mime = $decoded['mime'];
        if (($mime === '' || $mime === 'application/octet-stream') && $declared_mime !== '') {
            $mime = $declared_mime;
        }

        if (str_starts_with($mime, 'image/')) {
            $normalized = normalize_uploaded_image_binary($decoded['binary'], $mime);
            $kind = 'image';
            $binary = $normalized['binary'];
            $stored_ext = $normalized['extension'];
            $stored_mime = $normalized['mime'];
        } else {
            $file_meta = message_attachment_allowed_file_map()[$mime] ?? null;
            if ($file_meta === null) {
                throw new RuntimeException('That file type is not supported in chat yet');
            }

            $kind = $file_meta['kind'];
            $binary = $decoded['binary'];
            $stored_ext = $file_meta['ext'];
            $stored_mime = $mime;
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            throw new RuntimeException('Each chat attachment must be 5MB or less');
        }

        $storage_name = $message_id . '_' . $sort . '_' . bin2hex(random_bytes(6)) . '.' . $stored_ext;
        $path = $upload_dir . '/' . $storage_name;
        $bytes_written = file_put_contents($path, $binary, LOCK_EX);
        if ($bytes_written === false || $bytes_written !== strlen($binary)) {
            delete_message_attachment_files($stored_files);
            throw new RuntimeException('Failed to save an attachment');
        }

        $safe_name = sanitize_attachment_name($attachment['name'] ?? null, $stored_ext);
        $stmt->execute([
            $message_id,
            $kind,
            $safe_name,
            $stored_mime,
            strlen($binary),
            $storage_name,
            $sort,
        ]);

        $attachment_id = (int) $pdo->lastInsertId();
        $stored[] = [
            'id' => $attachment_id,
            'kind' => $kind,
            'name' => $safe_name,
            'mime_type' => $stored_mime,
            'size_bytes' => strlen($binary),
            'url' => message_attachment_url($attachment_id),
            'download_url' => message_attachment_url($attachment_id, true),
        ];
        $stored_files[] = $storage_name;
    }

    return ['attachments' => $stored, 'stored_files' => $stored_files];
}

function load_message_attachments(PDO $pdo, array $message_ids): array {
    $message_ids = array_values(array_filter(array_map('intval', $message_ids), static fn($id) => $id > 0));
    if (count($message_ids) === 0) {
        return [];
    }

    try {
        $placeholders = implode(',', array_fill(0, count($message_ids), '?'));
        $stmt = $pdo->prepare(
            "SELECT id, message_id, kind, original_name, mime_type, file_size, sort_order
             FROM message_attachments
             WHERE message_id IN ($placeholders)
             ORDER BY message_id ASC, sort_order ASC, id ASC"
        );
        $stmt->execute($message_ids);
    } catch (Throwable $e) {
        return [];
    }

    $grouped = [];
    foreach ($stmt->fetchAll() as $row) {
        $message_id = (int) $row['message_id'];
        $grouped[$message_id][] = [
            'id' => (int) $row['id'],
            'kind' => $row['kind'],
            'name' => $row['original_name'],
            'mime_type' => $row['mime_type'],
            'size_bytes' => (int) $row['file_size'],
            'url' => message_attachment_url((int) $row['id']),
            'download_url' => message_attachment_url((int) $row['id'], true),
        ];
    }

    return $grouped;
}

/**
 * Compute deployment base path from the executing API script.
 * Examples:
 * - /api/services/list.php                     -> ''
 * - /CSE442/2026-Spring/cse-442j/api/list.php -> '/CSE442/2026-Spring/cse-442j'
 */
function app_base_path(): string {
    static $base_path = null;
    if ($base_path !== null) return $base_path;

    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    $api_pos = strpos($script, '/api/');
    if ($api_pos === false) {
        $base_path = '';
        return $base_path;
    }

    $base_path = rtrim(substr($script, 0, $api_pos), '/');
    if ($base_path === '/') $base_path = '';
    return $base_path;
}

/**
 * Some hosts expose stock service media under /public/services/webp while
 * others expose it under /services/webp. Pick the correct prefix per host.
 */
function service_media_prefix_for_host(): string {
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    if (str_contains($host, 'aptitude.cse.buffalo.edu') || str_contains($host, 'cattle.cse.buffalo.edu')) {
        return '/public/services/webp/';
    }
    return '/services/webp/';
}

/**
 * Rewrite stock service media paths to the host-correct prefix.
 * Keeps non-stock paths unchanged (e.g. /api/uploads/services/...).
 */
function normalize_service_media_path(string $path): string {
    $target_abs = service_media_prefix_for_host();
    $target_rel = ltrim($target_abs, '/');

    if (str_starts_with($path, '/services/webp/')) {
        return $target_abs . substr($path, strlen('/services/webp/'));
    }
    if (str_starts_with($path, '/public/services/webp/')) {
        return $target_abs . substr($path, strlen('/public/services/webp/'));
    }
    if (str_starts_with($path, 'services/webp/')) {
        return $target_rel . substr($path, strlen('services/webp/'));
    }
    if (str_starts_with($path, 'public/services/webp/')) {
        return $target_rel . substr($path, strlen('public/services/webp/'));
    }
    return $path;
}

/**
 * Convert stored public asset paths into deployment-aware URLs.
 * Keeps full URLs/data URLs unchanged.
 */
function public_asset_url(?string $path): ?string {
    if ($path === null || $path === '') return $path;

    // Already absolute/protocol/data/blob URL.
    if (preg_match('#^(https?:)?//#i', $path) === 1 ||
        str_starts_with($path, 'data:') ||
        str_starts_with($path, 'blob:')
    ) {
        return $path;
    }

    $path = normalize_service_media_path($path);

    $base = app_base_path();
    if ($base === '') {
        return str_starts_with($path, '/') ? $path : ('/' . $path);
    }

    return str_starts_with($path, '/') ? ($base . $path) : ($base . '/' . $path);
}

/**
 * Insert a notification row.
 * $type: message | order | order_status | payment | proposal | review
 */
function create_notification(PDO $pdo, int $user_id, string $type, string $title, string $body, ?string $link = null, ?int $actor_id = null): void {
    $stmt = $pdo->prepare(
        'INSERT INTO notifications (user_id, type, title, body, link, actor_id) VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$user_id, $type, $title, mb_substr($body, 0, 255), $link, $actor_id]);
}

/**
 * Format a HiveCoin amount for compact user-facing labels.
 */
function format_hive_amount(float $amount): string {
    return number_format(round($amount, 2), 2, '.', '');
}

/**
 * Round money amounts to 2 decimals consistently.
 */
function round_money(float $amount): float {
    return round($amount, 2);
}

/**
 * Shared marketplace fee rate for service orders.
 */
function service_fee_rate(): float {
    return 0.10;
}

/**
 * Calculate the marketplace fee for a subtotal.
 */
function calculate_service_fee(float $subtotal): float {
    return round_money($subtotal * service_fee_rate());
}

/**
 * Calculate subtotal, fee, and total for a unit-rated order.
 */
function calculate_order_financials(float $unit_rate, float $units): array {
    $subtotal = round_money($unit_rate * $units);
    $service_fee = calculate_service_fee($subtotal);
    $total = round_money($subtotal + $service_fee);

    return [
        'subtotal' => $subtotal,
        'service_fee' => $service_fee,
        'total' => $total,
    ];
}

/**
 * Resolve the display unit label for a service snapshot.
 */
function service_price_unit(?string $pricing_type, ?string $custom_price_unit): ?string {
    if ($pricing_type === 'hourly') {
        return 'hr';
    }

    if ($pricing_type === 'custom') {
        $unit = trim((string) $custom_price_unit);
        return $unit !== '' ? $unit : null;
    }

    return null;
}

/**
 * Whether a service supports unit-based ordering and settlement.
 */
function service_supports_unit_pricing(array $service): bool {
    return service_price_unit($service['pricing_type'] ?? null, $service['custom_price_unit'] ?? null) !== null;
}

/**
 * Whether an order supports unit-based ordering and settlement.
 */
function order_supports_unit_pricing(array $order): bool {
    $unit = trim((string) ($order['unit_label_snapshot'] ?? ''));
    return $unit !== '';
}

/**
 * Minimum quantity allowed for a pricing type.
 */
function minimum_units_for_pricing(?string $pricing_type): float {
    return $pricing_type === 'hourly' ? 0.5 : 1.0;
}

/**
 * Quantity step size for a pricing type.
 */
function unit_step_for_pricing(?string $pricing_type): float {
    return $pricing_type === 'hourly' ? 0.5 : 1.0;
}

/**
 * Normalize a user-provided units value.
 */
function normalize_units_value($value): ?float {
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_numeric($value)) {
        return null;
    }

    return round((float) $value, 2);
}

/**
 * Validate units against the pricing type's min and increment rules.
 */
function units_value_is_valid(float $units, ?string $pricing_type): bool {
    $min = minimum_units_for_pricing($pricing_type);
    if ($units < $min) {
        return false;
    }

    $step = unit_step_for_pricing($pricing_type);
    $multiple = round($units / $step);
    return abs(($multiple * $step) - $units) < 0.001;
}

/**
 * Format quantity labels for UI and notifications.
 */
function format_units_label(float $units, ?string $unit_label): string {
    $amount = rtrim(rtrim(number_format($units, 2, '.', ''), '0'), '.');
    if (!$unit_label) {
        return $amount . ' units';
    }
    if ($unit_label === 'hr') {
        return $amount . ' ' . ((abs($units - 1.0) < 0.001) ? 'hour' : 'hours');
    }
    return $amount . ' ' . $unit_label;
}

/**
 * Current settlement basis for an order.
 * While active, this is the current escrow. While awaiting confirmation, it may
 * be the provider-submitted settlement proposal.
 */
function order_settlement_basis(array $order): array {
    if (
        array_key_exists('settlement_total', $order)
        && $order['settlement_total'] !== null
        && $order['settlement_subtotal'] !== null
        && $order['settlement_service_fee'] !== null
    ) {
        return [
            'subtotal' => round_money((float) $order['settlement_subtotal']),
            'service_fee' => round_money((float) $order['settlement_service_fee']),
            'total' => round_money((float) $order['settlement_total']),
        ];
    }

    return [
        'subtotal' => round_money((float) $order['price']),
        'service_fee' => round_money((float) $order['service_fee']),
        'total' => round_money((float) $order['total']),
    ];
}

/**
 * Apply final settlement, release provider funds, and refund any unused escrow.
 * Expects to run inside an existing transaction.
 */
function finalize_order_completion(
    PDO $pdo,
    array $order,
    float $final_subtotal,
    float $final_service_fee,
    string $provider_description,
    ?string $client_refund_description = null
): array {
    $final_subtotal = round_money($final_subtotal);
    $final_service_fee = round_money($final_service_fee);
    $final_total = round_money($final_subtotal + $final_service_fee);
    $authorized_total = round_money((float) $order['total']);
    $refund_amount = round_money(max(0, $authorized_total - $final_total));

    $pdo->prepare(
        "UPDATE orders
         SET status = 'completed',
             payment_status = 'released',
             completed_at = NOW(),
             auto_complete_at = NULL,
             dispute_resolution_deadline = NULL,
             price = ?,
             service_fee = ?,
             total = ?,
             settlement_subtotal = ?,
             settlement_service_fee = ?,
             settlement_total = ?,
             refunded_amount = ?
         WHERE id = ?"
    )->execute([
        $final_subtotal,
        $final_service_fee,
        $final_total,
        $final_subtotal,
        $final_service_fee,
        $final_total,
        $refund_amount,
        (int) $order['id'],
    ]);

    if ($final_subtotal > 0) {
        $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance + ? WHERE id = ?')
            ->execute([$final_subtotal, (int) $order['provider_id']]);

        $pdo->prepare(
            "INSERT INTO transactions (user_id, type, amount, description, order_id)
             VALUES (?, 'earning', ?, ?, ?)"
        )->execute([(int) $order['provider_id'], $final_subtotal, $provider_description, (int) $order['id']]);
    }

    if ($refund_amount > 0) {
        $pdo->prepare('UPDATE users SET hivecoin_balance = hivecoin_balance + ? WHERE id = ?')
            ->execute([$refund_amount, (int) $order['client_id']]);

        $pdo->prepare(
            "INSERT INTO transactions (user_id, type, amount, description, order_id)
             VALUES (?, 'refund', ?, ?, ?)"
        )->execute([
            (int) $order['client_id'],
            $refund_amount,
            $client_refund_description ?: ("Unused amount returned for order #{$order['id']}"),
            (int) $order['id'],
        ]);
    }

    return [
        'subtotal' => $final_subtotal,
        'service_fee' => $final_service_fee,
        'total' => $final_total,
        'refund_amount' => $refund_amount,
    ];
}

/**
 * Resolve provider payout and client refund for a dispute split while
 * preserving the fee on the current settlement basis.
 */
function calculate_dispute_split_resolution(array $order, int $provider_pct): array {
    $provider_pct = max(0, min(100, $provider_pct));
    $basis = order_settlement_basis($order);
    $provider_subtotal = round_money($basis['subtotal'] * ($provider_pct / 100));
    $service_fee = round_money($basis['service_fee']);
    $final_total = round_money($provider_subtotal + $service_fee);
    $authorized_total = round_money((float) $order['total']);

    return [
        'provider_pct' => $provider_pct,
        'subtotal' => $provider_subtotal,
        'service_fee' => $service_fee,
        'total' => $final_total,
        'refund_amount' => round_money(max(0, $authorized_total - $final_total)),
    ];
}

/**
 * Resolve a display title for an order, preferring the linked service title.
 */
function order_title(PDO $pdo, array $order): string {
    if (!empty($order['service_id'])) {
        $stmt = $pdo->prepare('SELECT title FROM services WHERE id = ?');
        $stmt->execute([(int) $order['service_id']]);
        $title = $stmt->fetchColumn();
        if ($title) {
            return $title;
        }
    }

    if (!empty($order['request_id'])) {
        $stmt = $pdo->prepare('SELECT title FROM requests WHERE id = ?');
        $stmt->execute([(int) $order['request_id']]);
        $title = $stmt->fetchColumn();
        if ($title) {
            return $title;
        }
    }

    return 'Custom Request';
}

/**
 * Find or create the single conversation between two users.
 */
function ensure_direct_conversation(
    PDO $pdo,
    int $user_a,
    int $user_b,
    ?string $context_type = null,
    ?int $context_id = null,
    ?string $context_title = null
): int {
    if ($user_a === $user_b) {
        throw new InvalidArgumentException('Cannot create a direct conversation with the same user');
    }

    $user_one = min($user_a, $user_b);
    $user_two = max($user_a, $user_b);

    $stmt = $pdo->prepare('SELECT id FROM conversations WHERE user_one_id = ? AND user_two_id = ?');
    $stmt->execute([$user_one, $user_two]);
    $existing_id = $stmt->fetchColumn();

    if ($existing_id) {
        $conversation_id = (int) $existing_id;
        if ($context_type && $context_id) {
            $pdo->prepare(
                'UPDATE conversations SET context_type = ?, context_id = ?, context_title = ? WHERE id = ?'
            )->execute([$context_type, $context_id, $context_title, $conversation_id]);
        }
        return $conversation_id;
    }

    $pdo->prepare(
        'INSERT INTO conversations (user_one_id, user_two_id, last_message, last_message_at, context_type, context_id, context_title, created_at)
         VALUES (?, ?, \'\', NOW(), ?, ?, ?, NOW())'
    )->execute([$user_one, $user_two, $context_type, $context_id, $context_title]);

    return (int) $pdo->lastInsertId();
}

/**
 * Persist a structured order-event message into the shared conversation.
 * This is intentionally a no-op when messaging is disabled so order flows still work.
 */
function create_order_event_message(
    PDO $pdo,
    ?int $sender_id,
    int $provider_id,
    int $client_id,
    int $order_id,
    string $service_title,
    string $event,
    string $title,
    string $summary,
    array $extra = []
): ?int {
    if (!is_feature_enabled($pdo, 'feature_messaging')) {
        return null;
    }

    $effective_sender_id = in_array($sender_id, [$provider_id, $client_id], true) ? $sender_id : $provider_id;
    $conversation_id = ensure_direct_conversation($pdo, $provider_id, $client_id, 'order', $order_id, $service_title);

    $payload = array_merge([
        'version' => 1,
        'event' => $event,
        'title' => $title,
        'summary' => $summary,
        'orderId' => $order_id,
        'serviceTitle' => $service_title,
    ], $extra);

    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return null;
    }
    $body = '[[HIVE_ORDER_EVENT_V1]]' . $json;

    $pdo->prepare(
        'INSERT INTO messages (conversation_id, sender_id, body, created_at)
         VALUES (?, ?, ?, NOW())'
    )->execute([$conversation_id, $effective_sender_id, $body]);

    $message_id = (int) $pdo->lastInsertId();
    $preview = trim((string) ($extra['preview'] ?? $title));

    $pdo->prepare(
        'UPDATE conversations
         SET last_message = ?, last_message_at = NOW(), context_type = \'order\', context_id = ?, context_title = ?
         WHERE id = ?'
    )->execute([mb_substr($preview, 0, 255), $order_id, $service_title, $conversation_id]);

    return $message_id;
}

/**
 * Build a cosmetics object from a DB row that includes frame/badge JOINed columns.
 * Expected columns: frame_metadata, badge_metadata (JSON strings from shop_items.metadata)
 * Returns: ['frame' => FrameData|null, 'badge' => BadgeData|null]
 */
function build_cosmetics_from_row(array $row): array {
    $cosmetics = ['frame' => null, 'badge' => null];

    // When HiveShop is disabled, hide equipped cosmetics site-wide
    // without mutating saved active_* IDs in the database.
    if (!shop_cosmetics_enabled()) {
        return $cosmetics;
    }

    if (!empty($row['frame_metadata'])) {
        $fm = json_decode($row['frame_metadata'], true) ?: [];
        $cosmetics['frame'] = [
            'gradient'      => $fm['gradient'] ?? '',
            'glow'          => $fm['glow'] ?? '',
            'css_animation' => $fm['css_animation'] ?? null,
            'ring_size'     => $fm['ring_size'] ?? 4,
        ];
    }

    if (!empty($row['badge_metadata'])) {
        $bm = json_decode($row['badge_metadata'], true) ?: [];
        $cosmetics['badge'] = [
            'tag'           => $bm['tag'] ?? '',
            'bg_color'      => $bm['bg_color'] ?? '#E9A020',
            'text_color'    => $bm['text_color'] ?? '#131210',
            'bg_gradient'   => $bm['bg_gradient'] ?? null,
            'css_animation' => $bm['css_animation'] ?? null,
        ];
    }

    return $cosmetics;
}

/**
 * SQL fragment to LEFT JOIN frame and badge shop_items for a given user alias.
 * Usage: $sql .= cosmetic_join_sql('u');
 */
function cosmetic_join_sql(string $user_alias): string {
    return "
        LEFT JOIN shop_items frame_item ON frame_item.id = {$user_alias}.active_frame_id
        LEFT JOIN shop_items badge_item ON badge_item.id = {$user_alias}.active_badge_id
    ";
}

/**
 * SQL SELECT columns for cosmetic metadata.
 */
function cosmetic_select_sql(): string {
    return "frame_item.metadata AS frame_metadata, badge_item.metadata AS badge_metadata";
}

/**
 * Whether cosmetic equipment should be rendered.
 * Falls back to enabled if DB context is unavailable.
 */
function shop_cosmetics_enabled(): bool {
    static $enabled = null;
    if ($enabled !== null) return $enabled;

    if (!isset($GLOBALS['pdo']) || !($GLOBALS['pdo'] instanceof PDO)) {
        $enabled = true;
        return $enabled;
    }

    /** @var PDO $pdo */
    $pdo = $GLOBALS['pdo'];
    $enabled = is_feature_enabled($pdo, 'feature_shop');
    return $enabled;
}

/**
 * Check if a system feature is enabled.
 * Uses a static cache to avoid repeated DB queries within a single request.
 */
function is_feature_enabled(PDO $pdo, string $key): bool {
    static $cache = [];
    if (isset($cache[$key])) return $cache[$key];

    $stmt = $pdo->prepare('SELECT setting_value FROM system_settings WHERE setting_key = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $enabled = $row ? ($row['setting_value'] === '1') : true; // default enabled if not found
    $cache[$key] = $enabled;
    return $enabled;
}

/**
 * Abort with 403 if the named feature is disabled.
 */
function require_feature(PDO $pdo, string $key): void {
    if (!is_feature_enabled($pdo, $key)) {
        json_response(['error' => 'This feature is currently disabled'], 403);
    }
}

/**
 * IP-based rate limiting for auth endpoints.
 * Reads config from system_settings; does nothing when rate_limit_enabled is '0'.
 */
function check_rate_limit(PDO $pdo, string $endpoint): void {
    if (!is_feature_enabled($pdo, 'rate_limit_enabled')) return;

    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $ip = trim(explode(',', $ip)[0]);

    $cfg = $pdo->prepare('SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?, ?)');
    $cfg->execute(['rate_limit_max_attempts', 'rate_limit_window_minutes']);
    $settings = [];
    foreach ($cfg->fetchAll(PDO::FETCH_ASSOC) as $r) $settings[$r['setting_key']] = $r['setting_value'];
    $max      = max(1, (int) ($settings['rate_limit_max_attempts'] ?? 10));
    $window   = max(1, (int) ($settings['rate_limit_window_minutes'] ?? 15));

    $stmt = $pdo->prepare('SELECT id, attempts, window_start FROM rate_limits WHERE ip_address = ? AND endpoint = ?');
    $stmt->execute([$ip, $endpoint]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $pdo->prepare('INSERT INTO rate_limits (ip_address, endpoint) VALUES (?, ?)')->execute([$ip, $endpoint]);
        return;
    }

    $started = strtotime($row['window_start']);
    $elapsed = time() - $started;

    if ($elapsed > $window * 60) {
        $pdo->prepare('UPDATE rate_limits SET attempts = 1, window_start = NOW() WHERE id = ?')->execute([$row['id']]);
        return;
    }

    if ((int) $row['attempts'] >= $max) {
        $retry = ($window * 60) - $elapsed;
        json_response([
            'error'       => 'Too many attempts. Please try again later.',
            'retry_after' => $retry,
        ], 429);
    }

    $pdo->prepare('UPDATE rate_limits SET attempts = attempts + 1 WHERE id = ?')->execute([$row['id']]);
}
