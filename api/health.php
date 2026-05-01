<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db_config.php';

cors();

try {
    $pdo->query('SELECT 1');
    json_response([
        'status' => 'ok',
        'database' => 'connected',
        'timestamp' => date('c')
    ]);
} catch (Exception $e) {
    json_response([
        'status' => 'error',
        'database' => 'disconnected',
        'error' => 'Database connection failed'
    ], 503);
}
