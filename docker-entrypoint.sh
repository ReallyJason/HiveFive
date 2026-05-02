#!/bin/bash
set -e

# Generate db_config.php from environment variables
cat > /var/www/html/api/db_config.php <<'PHP'
<?php
date_default_timezone_set('UTC');

$DB_HOST = $_ENV['DB_HOST'] ?? $_ENV['MYSQLHOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
$DB_PORT = $_ENV['DB_PORT'] ?? $_ENV['MYSQLPORT'] ?? getenv('DB_PORT') ?: '3306';
$DB_NAME = $_ENV['DB_NAME'] ?? $_ENV['MYSQLDATABASE'] ?? getenv('DB_NAME') ?: 'cse442_2026_spring_team_j_db';
$DB_USER = $_ENV['DB_USER'] ?? $_ENV['MYSQLUSER'] ?? getenv('DB_USER') ?: 'intesarj';
$DB_PASS = $_ENV['DB_PASS'] ?? $_ENV['MYSQLPASSWORD'] ?? getenv('DB_PASS') ?: '50548218';

try {
    $pdo = new PDO(
        "mysql:host=$DB_HOST;port=$DB_PORT;dbname=$DB_NAME;charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
    $pdo->exec("SET time_zone = '+00:00'");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
PHP

# AI features disabled
# OPENROUTER_KEY="${OPENROUTER_API_KEY:-$(printenv OPENROUTER_API_KEY 2>/dev/null)}"
# if [ -n "$OPENROUTER_KEY" ]; then
# ...
# fi

# ── Fix "More than one MPM loaded" at runtime ──
echo "=== MPM fix: removing all MPM modules ==="
rm -f /etc/apache2/mods-enabled/mpm_*.load /etc/apache2/mods-enabled/mpm_*.conf
echo "=== MPM fix: enabling only mpm_prefork ==="
ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load
if [ -f /etc/apache2/mods-available/mpm_prefork.conf ]; then
    ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf
fi
echo "=== MPM modules now enabled: ==="
ls -la /etc/apache2/mods-enabled/mpm_* 2>/dev/null || echo "NONE"

# ── Apache listens on port 80 (Railway target port must be set to 80) ──
echo "=== Apache listening on port 80 ==="

# Verify config before starting
apache2ctl configtest 2>&1 || true

# Start Apache on port 80
exec apache2-foreground
