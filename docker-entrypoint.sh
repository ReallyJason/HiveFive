#!/bin/bash
set -e

# Generate db_config.php from environment variables
# Resolve values at bash level so they're baked into the PHP file.
# (Apache often strips env vars from PHP, making $_ENV/getenv() unreliable.)
_DB_HOST="${DB_HOST:-${MYSQLHOST:-127.0.0.1}}"
_DB_PORT="${DB_PORT:-${MYSQLPORT:-3306}}"
_DB_NAME="${DB_NAME:-${MYSQLDATABASE:-railway}}"
_DB_USER="${DB_USER:-${MYSQLUSER:-root}}"
_DB_PASS="${DB_PASS:-${MYSQLPASSWORD:-}}"

echo "=== DB config: host=$_DB_HOST port=$_DB_PORT db=$_DB_NAME user=$_DB_USER ==="

cat > /var/www/html/api/db_config.php <<PHP
<?php
date_default_timezone_set('UTC');

\$DB_HOST = '$_DB_HOST';
\$DB_PORT = '$_DB_PORT';
\$DB_NAME = '$_DB_NAME';
\$DB_USER = '$_DB_USER';
\$DB_PASS = '$_DB_PASS';

try {
    \$pdo = new PDO(
        "mysql:host=\$DB_HOST;port=\$DB_PORT;dbname=\$DB_NAME;charset=utf8mb4",
        \$DB_USER,
        \$DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
    \$pdo->exec("SET time_zone = '+00:00'");
} catch (PDOException \$e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . \$e->getMessage()]);
    exit;
}
PHP

# Inject Resend API key into mail.php so emails work on Railway
_RESEND_KEY="${RESEND_API_KEY:-}"
if [ -n "$_RESEND_KEY" ]; then
    echo "=== Resend API key detected, injecting into mail.php ==="
    sed -i "s|define('RESEND_API_KEY', getenv('RESEND_API_KEY') ?: '');|define('RESEND_API_KEY', '$_RESEND_KEY');|" /var/www/html/api/mail.php
else
    echo "=== WARNING: RESEND_API_KEY not set — emails will not be sent ==="
fi

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
