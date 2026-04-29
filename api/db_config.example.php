<?php
// Database configuration
// Copy this file to db_config.php and fill in your credentials
// NEVER commit db_config.php to the repo

$DB_HOST = '127.0.0.1';
$DB_NAME = 'your_database_name';
$DB_USER = 'your_username';
$DB_PASS = 'your_password';

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
