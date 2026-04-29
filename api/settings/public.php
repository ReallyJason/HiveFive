<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

// No auth required — these are public feature flags
$stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key LIKE 'feature_%' OR setting_key = 'mock_data'");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$features = [];
foreach ($rows as $row) {
    if (str_starts_with($row['setting_key'], 'feature_')) {
        $key = str_replace('feature_', '', $row['setting_key']);
    } else {
        $key = $row['setting_key'];
    }
    $features[$key] = $row['setting_value'] === '1';
}

json_response(['features' => $features]);
