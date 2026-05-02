<?php
require_once __DIR__ . '/api/db_config.php';
try {
    $pdo->exec("ALTER TABLE users DROP COLUMN major, DROP COLUMN year, ADD COLUMN job VARCHAR(100) DEFAULT '', ADD COLUMN is_student TINYINT(1) DEFAULT 0;");
    echo "Migration successful.\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
