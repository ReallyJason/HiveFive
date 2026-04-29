#!/bin/bash
# Generate db_config.php from environment variables
cat > /var/www/html/api/db_config.php <<'PHP'
<?php
date_default_timezone_set('UTC');

$DB_HOST = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
$DB_NAME = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'cse442_2026_spring_team_j_db';
$DB_USER = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'intesarj';
$DB_PASS = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?: '50548218';

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
    $pdo->exec("SET time_zone = '+00:00'");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit;
}
PHP

# Generate ai_config.php from environment variables (if API key is provided)
OPENROUTER_KEY="${OPENROUTER_API_KEY:-$(printenv OPENROUTER_API_KEY 2>/dev/null)}"
if [ -n "$OPENROUTER_KEY" ]; then
cat > /var/www/html/api/ai_config.php <<PHP
<?php
\$OPENROUTER_API_KEY = '$OPENROUTER_KEY';
\$OPENROUTER_MODEL   = '${OPENROUTER_MODEL:-google/gemini-2.0-flash-001}';
PHP
echo "ai_config.php generated from environment variables."
else
echo "WARNING: OPENROUTER_API_KEY not set — AI features will be disabled."
fi

# Start Apache
exec apache2-foreground
