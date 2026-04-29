<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query('SELECT setting_key, setting_value, updated_at FROM system_settings ORDER BY setting_key');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response(['settings' => $rows]);
}

if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $body = get_json_body();
    if (empty($body) || !is_array($body)) {
        json_response(['error' => 'Request body must be a JSON object of key-value pairs'], 400);
    }

    $boolean_keys = ['feature_requests', 'feature_shop', 'feature_messaging', 'feature_leaderboard', 'feature_docs', 'mock_data', 'rate_limit_enabled'];
    $string_keys  = ['bypass_code', 'rate_limit_max_attempts', 'rate_limit_window_minutes'];
    $allowed_keys = array_merge($boolean_keys, $string_keys);
    $stmt = $pdo->prepare('
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    ');

    foreach ($body as $key => $value) {
        if (!in_array($key, $allowed_keys, true)) continue;
        if (in_array($key, $string_keys, true)) {
            $val = trim((string) $value);
            if ($key === 'bypass_code' && $val !== '' && !preg_match('/^\d{4,10}$/', $val)) {
                json_response(['error' => 'Bypass code must be 4-10 digits or empty to disable'], 400);
            }
            if (in_array($key, ['rate_limit_max_attempts', 'rate_limit_window_minutes'], true)) {
                if (!ctype_digit($val) || (int) $val < 1) {
                    json_response(['error' => "$key must be a positive integer"], 400);
                }
            }
        } else {
            $val = $value ? '1' : '0';
        }
        $stmt->execute([$key, $val]);
    }

    // Return updated settings
    $stmt2 = $pdo->query('SELECT setting_key, setting_value, updated_at FROM system_settings ORDER BY setting_key');
    $rows = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    json_response(['settings' => $rows]);
}

json_response(['error' => 'Method not allowed'], 405);
