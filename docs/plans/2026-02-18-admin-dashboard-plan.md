# Admin Dashboard & Moderation System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single `/admin` page with Overview, Reports, Users, and Revenue tabs, plus a user reporting system with automated escalation and admin impersonation.

**Architecture:** Tabbed admin SPA page at `/admin` (pattern from Settings.tsx). PHP REST APIs under `api/admin/`. Report submission from UserProfile. Session-based impersonation. Automated suspension/ban escalation on report creation.

**Tech Stack:** React 18 + TypeScript, PHP 8 + PDO/MariaDB, recharts (already installed), lucide-react icons, inline styles (pre-compiled Tailwind, no plugin).

**Codebase:** `/sector_D/The Foundation/IJ03-School/IJ302-UB/26-Spring/CSE442/Hive`

---

## Task 1: Database Schema Changes

**Files:**
- Modify: `sql/setup.sql`
- Create: `sql/admin-setup.sql` (gitignored)
- Modify: `.gitignore`

**Step 1: Add columns to users table in setup.sql**

After the `deactivated_at` column (line ~34), add before the closing `);`:

```sql
role              ENUM('user','admin') DEFAULT 'user',
suspended_until   DATETIME DEFAULT NULL,
ban_reason        VARCHAR(255) DEFAULT NULL,
banned_at         DATETIME DEFAULT NULL,
```

**Step 2: Add reports table to setup.sql**

After the users table (and before any ALTER/FK statements), add:

```sql
CREATE TABLE IF NOT EXISTS reports (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id     INT NOT NULL,
    reported_id     INT NOT NULL,
    reason          ENUM('harassment','academic_dishonesty','scam_fraud',
                         'inappropriate_content','spam','impersonation','other') NOT NULL,
    description     TEXT NOT NULL,
    status          ENUM('pending','reviewed','dismissed','actioned') DEFAULT 'pending',
    admin_note      TEXT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at     DATETIME DEFAULT NULL,
    resolved_by     INT DEFAULT NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);
```

**Step 3: Create sql/admin-setup.sql**

This file is gitignored. It inserts the admin account as user ID 1. Pre-compute bcrypt hash of `Admin@team.random()` using PHP's `password_hash()`.

```sql
-- Admin account setup (DO NOT COMMIT TO GIT)
-- Run AFTER setup.sql, BEFORE seed.sql
-- Password: Admin@team.random()

INSERT INTO users (id, email, username, password_hash, first_name, last_name, university, role, verified, onboarding_done, hivecoin_balance)
VALUES (1, 'admin@hivefive.com', 'admin', '$2y$10$HASH_HERE', 'HiveFive', 'Admin', 'HiveFive HQ', 'admin', 1, 1, 99999.00);
```

Generate the hash: `php -r "echo password_hash('Admin@team.random()', PASSWORD_DEFAULT);"` and paste it in.

**Step 4: Update .gitignore**

Add at the end:

```
# Admin credentials (never commit)
sql/admin-setup.sql
```

**Step 5: Update seed.sql**

Ensure seed.sql user IDs start from 2 (check current `INSERT INTO users` — if it uses AUTO_INCREMENT without explicit IDs, set `ALTER TABLE users AUTO_INCREMENT = 2;` at the top of seed.sql, or use explicit IDs starting at 2).

**Step 6: Run the schema changes locally**

```bash
mysql -u intesar test_hivefive < sql/setup.sql
php -r "echo password_hash('Admin@team.random()', PASSWORD_DEFAULT);"
# Paste hash into sql/admin-setup.sql
mysql -u intesar test_hivefive < sql/admin-setup.sql
mysql -u intesar test_hivefive < sql/seed.sql
```

**Step 7: Commit**

```bash
git add sql/setup.sql .gitignore
git commit -m "feat: add role, suspension, ban columns and reports table"
```

Note: `sql/admin-setup.sql` is NOT committed (gitignored).

---

## Task 2: Backend — Auth Changes (me.php + helpers.php)

**Files:**
- Modify: `api/auth/me.php`
- Modify: `api/helpers.php`

**Step 1: Add require_admin() helper to helpers.php**

After the `require_auth()` function (~line 39), add:

```php
function require_admin() {
    $user_id = require_auth();
    if (empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        json_response(['error' => 'Not found'], 404);
    }
    return $user_id;
}
```

Returns 404 (not 403) to hide the route's existence.

**Step 2: Update me.php — add role to SELECT**

In the SELECT query, add `u.role, u.suspended_until, u.banned_at, u.ban_reason,` to the column list.

**Step 3: Update me.php — handle impersonation**

After `$user_id = require_auth();`, add:

```php
// Handle admin impersonation
$impersonating = null;
if (!empty($_SESSION['impersonating_user_id'])) {
    $impersonating = (int) $_SESSION['impersonating_user_id'];
    // Use impersonated user's ID for data fetch
    $user_id = $impersonating;
}
```

**Step 4: Update me.php — add role + impersonation to response**

In the JSON response array, add:

```php
'role'             => $row['role'] ?? 'user',
'suspended_until'  => $row['suspended_until'],
'banned_at'        => $row['banned_at'],
'ban_reason'       => $row['ban_reason'],
'impersonating'    => $impersonating,
```

**Step 5: Update me.php — store role in session on login**

Find where `$_SESSION['user_id']` is set during login (in `api/auth/login.php`). After that line, add:

```php
$_SESSION['user_role'] = $user['role'] ?? 'user';
```

**Step 6: Check suspended/banned status**

In `require_auth()` in helpers.php OR in a new middleware, after confirming the session exists, check if the user is suspended or banned. If so, return an error response the frontend can handle. Add after the session check in `require_auth()`:

```php
// Check ban/suspension (skip for admin endpoints checking their own session)
if (!empty($_SESSION['user_banned'])) {
    json_response(['error' => 'Your account has been banned', 'banned' => true, 'ban_reason' => $_SESSION['ban_reason'] ?? ''], 403);
}
if (!empty($_SESSION['user_suspended_until']) && strtotime($_SESSION['user_suspended_until']) > time()) {
    json_response(['error' => 'Your account is suspended', 'suspended' => true, 'suspended_until' => $_SESSION['user_suspended_until']], 403);
}
```

Note: Session ban/suspension data should be set during login. Alternatively, check against DB on each request (simpler but slower). Given this is a student project, checking session is fine — bans take effect on next login.

**Step 7: Commit**

```bash
git add api/helpers.php api/auth/me.php api/auth/login.php
git commit -m "feat: add admin role to auth, impersonation support in me.php"
```

---

## Task 3: Backend — Report Submission API

**Files:**
- Create: `api/reports/create.php`
- Create: `api/reports/check.php`

**Step 1: Create api/reports/ directory**

```bash
mkdir -p api/reports
```

**Step 2: Create api/reports/create.php**

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$user_id = require_auth();
$data = get_json_body();

$reported_id = (int) ($data['reported_id'] ?? 0);
$reason      = trim($data['reason'] ?? '');
$description = trim($data['description'] ?? '');

$valid_reasons = ['harassment','academic_dishonesty','scam_fraud','inappropriate_content','spam','impersonation','other'];

if (!$reported_id) json_response(['error' => 'reported_id is required'], 400);
if ($reported_id === $user_id) json_response(['error' => 'You cannot report yourself'], 400);
if (!in_array($reason, $valid_reasons)) json_response(['error' => 'Invalid reason'], 400);
if (mb_strlen($description) < 20) json_response(['error' => 'Description must be at least 20 characters'], 400);
if (mb_strlen($description) > 1000) json_response(['error' => 'Description must be 1000 characters or less'], 400);

// Check reported user exists
$stmt = $pdo->prepare('SELECT id FROM users WHERE id = ? AND deactivated_at IS NULL');
$stmt->execute([$reported_id]);
if (!$stmt->fetch()) json_response(['error' => 'User not found'], 404);

// Check for existing pending report from this reporter to this user
$stmt = $pdo->prepare('SELECT id FROM reports WHERE reporter_id = ? AND reported_id = ? AND status = "pending"');
$stmt->execute([$user_id, $reported_id]);
if ($stmt->fetch()) json_response(['error' => 'You already have a pending report for this user'], 409);

// Insert report
$stmt = $pdo->prepare(
    'INSERT INTO reports (reporter_id, reported_id, reason, description) VALUES (?, ?, ?, ?)'
);
$stmt->execute([$user_id, $reported_id, $reason, $description]);
$report_id = (int) $pdo->lastInsertId();

// ── Automated escalation check ──
$stmt = $pdo->prepare('SELECT COUNT(*) FROM reports WHERE reported_id = ? AND status = "actioned" AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)');
$stmt->execute([$reported_id]);
$recent_actioned = (int) $stmt->fetchColumn();

$stmt = $pdo->prepare('SELECT COUNT(*) FROM reports WHERE reported_id = ? AND status = "actioned"');
$stmt->execute([$reported_id]);
$total_actioned = (int) $stmt->fetchColumn();

// Count previous suspensions (by checking how many times suspended_until was set — tracked via admin_note containing "auto-suspend")
// Simpler: count distinct suspension events from reports where admin_note LIKE '%auto-suspend%'
$stmt = $pdo->prepare('SELECT suspended_until, banned_at FROM users WHERE id = ?');
$stmt->execute([$reported_id]);
$target = $stmt->fetch();

if (empty($target['banned_at'])) {
    // Only escalate if not already banned
    if ($total_actioned >= 5) {
        // Auto-suspend 30 days
        $suspend_until = date('Y-m-d H:i:s', strtotime('+30 days'));
        $stmt = $pdo->prepare('UPDATE users SET suspended_until = ? WHERE id = ? AND banned_at IS NULL');
        $stmt->execute([$suspend_until, $reported_id]);
    } elseif ($recent_actioned >= 3) {
        // Auto-suspend 7 days
        $suspend_until = date('Y-m-d H:i:s', strtotime('+7 days'));
        $stmt = $pdo->prepare('UPDATE users SET suspended_until = ? WHERE id = ? AND banned_at IS NULL');
        $stmt->execute([$suspend_until, $reported_id]);
    }
}

// Notify admin (create a notification for all admin users)
$stmt = $pdo->prepare('SELECT id FROM users WHERE role = "admin"');
$stmt->execute();
$admins = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($admins as $admin_id) {
    create_notification($pdo, (int) $admin_id, 'report', 'New user report', "A report was filed against a user. Reason: {$reason}", '/admin', $user_id);
}

json_response(['report' => ['id' => $report_id]], 201);
```

**Step 3: Create api/reports/check.php**

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');

$user_id = require_auth();
$reported_id = (int) ($_GET['user_id'] ?? 0);

if (!$reported_id) json_response(['error' => 'user_id is required'], 400);

$stmt = $pdo->prepare('SELECT id FROM reports WHERE reporter_id = ? AND reported_id = ? AND status = "pending"');
$stmt->execute([$user_id, $reported_id]);
$existing = $stmt->fetch();

json_response(['has_pending_report' => (bool) $existing]);
```

**Step 4: Commit**

```bash
git add api/reports/
git commit -m "feat: add report submission and check endpoints"
```

---

## Task 4: Backend — Admin API Endpoints

**Files:**
- Create: `api/admin/stats.php`
- Create: `api/admin/reports.php`
- Create: `api/admin/users.php`
- Create: `api/admin/revenue.php`
- Create: `api/admin/activity.php`
- Create: `api/admin/impersonate.php`
- Create: `api/admin/stop-impersonate.php`

This is the largest backend task. Each endpoint follows the same pattern: `require_admin()` + query + `json_response()`.

**Step 1: Create api/admin/ directory**

```bash
mkdir -p api/admin
```

**Step 2: Create api/admin/stats.php** (Overview tab data)

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_admin();

// Total revenue: service fees from completed orders + shop purchases
$stmt = $pdo->query("SELECT COALESCE(SUM(service_fee), 0) as total FROM orders WHERE status = 'completed'");
$service_fee_revenue = (float) $stmt->fetchColumn();

$stmt = $pdo->query("SELECT COALESCE(SUM(price_paid), 0) as total FROM shop_purchases");
$shop_revenue = (float) $stmt->fetchColumn();

$total_revenue = $service_fee_revenue + $shop_revenue;

// Active users (last 7 days)
$stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE last_seen_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND deactivated_at IS NULL AND role = 'user'");
$active_users = (int) $stmt->fetchColumn();

// Open reports
$stmt = $pdo->query("SELECT COUNT(*) FROM reports WHERE status = 'pending'");
$open_reports = (int) $stmt->fetchColumn();

// Orders this month
$stmt = $pdo->query("SELECT COUNT(*) FROM orders WHERE MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())");
$orders_this_month = (int) $stmt->fetchColumn();

// Revenue over time (last 30 days) — daily breakdown
$stmt = $pdo->query("
    SELECT DATE(o.completed_at) as day,
           COALESCE(SUM(o.service_fee), 0) as fees
    FROM orders o
    WHERE o.status = 'completed'
      AND o.completed_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(o.completed_at)
    ORDER BY day
");
$fee_by_day = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $pdo->query("
    SELECT DATE(sp.created_at) as day,
           COALESCE(SUM(sp.price_paid), 0) as shop
    FROM shop_purchases sp
    WHERE sp.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(sp.created_at)
    ORDER BY day
");
$shop_by_day = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Orders by status (for donut chart)
$stmt = $pdo->query("SELECT status, COUNT(*) as count FROM orders GROUP BY status");
$orders_by_status = $stmt->fetchAll(PDO::FETCH_ASSOC);

json_response([
    'total_revenue'    => $total_revenue,
    'service_fees'     => $service_fee_revenue,
    'shop_revenue'     => $shop_revenue,
    'active_users'     => $active_users,
    'open_reports'     => $open_reports,
    'orders_this_month'=> $orders_this_month,
    'fee_by_day'       => $fee_by_day,
    'shop_by_day'      => $shop_by_day,
    'orders_by_status' => $orders_by_status,
]);
```

**Step 3: Create api/admin/reports.php** (GET list + PATCH update)

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();

$admin_id = require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $status = trim($_GET['status'] ?? '');
    $where = '';
    $params = [];
    if ($status && in_array($status, ['pending','reviewed','dismissed','actioned'])) {
        $where = 'WHERE r.status = ?';
        $params[] = $status;
    }

    $stmt = $pdo->prepare("
        SELECT r.*,
               reporter.username as reporter_username, reporter.first_name as reporter_first_name, reporter.last_name as reporter_last_name, reporter.profile_image as reporter_image,
               reported.username as reported_username, reported.first_name as reported_first_name, reported.last_name as reported_last_name, reported.profile_image as reported_image,
               reported.suspended_until, reported.banned_at, reported.ban_reason
        FROM reports r
        JOIN users reporter ON reporter.id = r.reporter_id
        JOIN users reported ON reported.id = r.reported_id
        {$where}
        ORDER BY r.created_at DESC
        LIMIT 100
    ");
    $stmt->execute($params);
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(['reports' => $reports]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = get_json_body();
    $report_id = (int) ($data['id'] ?? 0);
    $new_status = trim($data['status'] ?? '');
    $admin_note = trim($data['admin_note'] ?? '');

    if (!$report_id) json_response(['error' => 'id is required'], 400);
    if (!in_array($new_status, ['reviewed','dismissed','actioned'])) json_response(['error' => 'Invalid status'], 400);

    $stmt = $pdo->prepare('UPDATE reports SET status = ?, admin_note = ?, resolved_at = NOW(), resolved_by = ? WHERE id = ?');
    $stmt->execute([$new_status, $admin_note ?: null, $admin_id, $report_id]);

    json_response(['success' => true]);

} else {
    json_response(['error' => 'Method not allowed'], 405);
}
```

**Step 4: Create api/admin/users.php** (GET search + PATCH suspend/ban)

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();

require_admin();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $params = [];
    $where = "WHERE role = 'user' AND deactivated_at IS NULL";

    if ($search) {
        $where .= " AND (username LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
        $like = "%{$search}%";
        $params = [$like, $like, $like, $like];
    }

    $stmt = $pdo->prepare("
        SELECT id, email, username, first_name, last_name, university, profile_image, role,
               suspended_until, banned_at, ban_reason, created_at, last_seen_at,
               (SELECT COUNT(*) FROM reports WHERE reported_id = users.id AND status = 'actioned') as report_count
        FROM users
        {$where}
        ORDER BY created_at DESC
        LIMIT 100
    ");
    $stmt->execute($params);
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_response(['users' => $users]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $data = get_json_body();
    $target_id = (int) ($data['user_id'] ?? 0);
    $action = trim($data['action'] ?? '');

    if (!$target_id) json_response(['error' => 'user_id is required'], 400);

    switch ($action) {
        case 'suspend_7d':
            $until = date('Y-m-d H:i:s', strtotime('+7 days'));
            $stmt = $pdo->prepare('UPDATE users SET suspended_until = ? WHERE id = ?');
            $stmt->execute([$until, $target_id]);
            break;
        case 'suspend_30d':
            $until = date('Y-m-d H:i:s', strtotime('+30 days'));
            $stmt = $pdo->prepare('UPDATE users SET suspended_until = ? WHERE id = ?');
            $stmt->execute([$until, $target_id]);
            break;
        case 'unsuspend':
            $stmt = $pdo->prepare('UPDATE users SET suspended_until = NULL WHERE id = ?');
            $stmt->execute([$target_id]);
            break;
        case 'ban':
            $reason = trim($data['reason'] ?? 'Banned by admin');
            $stmt = $pdo->prepare('UPDATE users SET banned_at = NOW(), ban_reason = ?, suspended_until = NULL WHERE id = ?');
            $stmt->execute([$reason, $target_id]);
            break;
        case 'unban':
            $stmt = $pdo->prepare('UPDATE users SET banned_at = NULL, ban_reason = NULL WHERE id = ?');
            $stmt->execute([$target_id]);
            break;
        default:
            json_response(['error' => 'Invalid action'], 400);
    }

    json_response(['success' => true]);

} else {
    json_response(['error' => 'Method not allowed'], 405);
}
```

**Step 5: Create api/admin/revenue.php**

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_admin();

$period = trim($_GET['period'] ?? '30d');
$days = match($period) {
    '7d'  => 7,
    '30d' => 30,
    '90d' => 90,
    'all' => 99999,
    default => 30,
};

$date_filter = $days < 99999 ? "AND completed_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)" : '';
$shop_date_filter = $days < 99999 ? "AND created_at >= DATE_SUB(NOW(), INTERVAL {$days} DAY)" : '';

// Service fees
$stmt = $pdo->query("SELECT COALESCE(SUM(service_fee), 0) FROM orders WHERE status = 'completed' {$date_filter}");
$service_fees = (float) $stmt->fetchColumn();

// Shop revenue
$stmt = $pdo->query("SELECT COALESCE(SUM(price_paid), 0) FROM shop_purchases WHERE 1=1 {$shop_date_filter}");
$shop_revenue = (float) $stmt->fetchColumn();

// Avg order value
$stmt = $pdo->query("SELECT COALESCE(AVG(total), 0) FROM orders WHERE status = 'completed' {$date_filter}");
$avg_order = (float) $stmt->fetchColumn();

// Daily chart data
$stmt = $pdo->query("
    SELECT DATE(completed_at) as day, COALESCE(SUM(service_fee), 0) as fees
    FROM orders WHERE status = 'completed' {$date_filter}
    GROUP BY DATE(completed_at) ORDER BY day
");
$fee_chart = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $pdo->query("
    SELECT DATE(created_at) as day, COALESCE(SUM(price_paid), 0) as shop
    FROM shop_purchases WHERE 1=1 {$shop_date_filter}
    GROUP BY DATE(created_at) ORDER BY day
");
$shop_chart = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Top shop items
$stmt = $pdo->query("
    SELECT si.name, si.type, COUNT(sp.id) as purchases, SUM(sp.price_paid) as revenue
    FROM shop_purchases sp JOIN shop_items si ON si.id = sp.item_id
    WHERE 1=1 {$shop_date_filter}
    GROUP BY sp.item_id ORDER BY revenue DESC LIMIT 10
");
$top_items = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Top categories by order volume
$stmt = $pdo->query("
    SELECT s.category, COUNT(o.id) as order_count, SUM(o.service_fee) as fees
    FROM orders o JOIN services s ON s.id = o.service_id
    WHERE o.status = 'completed' {$date_filter}
    GROUP BY s.category ORDER BY fees DESC LIMIT 10
");
$top_categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

json_response([
    'service_fees'    => $service_fees,
    'shop_revenue'    => $shop_revenue,
    'total_revenue'   => $service_fees + $shop_revenue,
    'avg_order_value' => round($avg_order, 2),
    'fee_chart'       => $fee_chart,
    'shop_chart'      => $shop_chart,
    'top_items'       => $top_items,
    'top_categories'  => $top_categories,
]);
```

**Step 6: Create api/admin/activity.php**

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('GET');
require_admin();

// Union of recent events from multiple tables
$stmt = $pdo->query("
    (SELECT 'signup' as type, u.id as user_id, u.username, u.first_name, u.profile_image,
            CONCAT(u.first_name, ' ', u.last_name, ' joined HiveFive') as description,
            u.created_at as event_at
     FROM users u WHERE u.role = 'user' ORDER BY u.created_at DESC LIMIT 5)
    UNION ALL
    (SELECT 'order_completed' as type, o.client_id as user_id, u.username, u.first_name, u.profile_image,
            CONCAT(u.first_name, ' completed an order for ⬡', o.total) as description,
            o.completed_at as event_at
     FROM orders o JOIN users u ON u.id = o.client_id WHERE o.status = 'completed' AND o.completed_at IS NOT NULL ORDER BY o.completed_at DESC LIMIT 5)
    UNION ALL
    (SELECT 'report' as type, r.reporter_id as user_id, u.username, u.first_name, u.profile_image,
            CONCAT(u.first_name, ' reported a user for ', r.reason) as description,
            r.created_at as event_at
     FROM reports r JOIN users u ON u.id = r.reporter_id ORDER BY r.created_at DESC LIMIT 5)
    UNION ALL
    (SELECT 'purchase' as type, sp.user_id, u.username, u.first_name, u.profile_image,
            CONCAT(u.first_name, ' bought ', si.name, ' for ⬡', sp.price_paid) as description,
            sp.created_at as event_at
     FROM shop_purchases sp JOIN users u ON u.id = sp.user_id JOIN shop_items si ON si.id = sp.item_id ORDER BY sp.created_at DESC LIMIT 5)
    ORDER BY event_at DESC
    LIMIT 10
");
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);

json_response(['events' => $events]);
```

**Step 7: Create api/admin/impersonate.php**

```php
<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../db_config.php';
cors();
require_method('POST');

$admin_id = require_admin();
$data = get_json_body();
$target_id = (int) ($data['user_id'] ?? 0);

if (!$target_id) json_response(['error' => 'user_id is required'], 400);

// Verify target exists and is not admin
$stmt = $pdo->prepare("SELECT id, role FROM users WHERE id = ? AND deactivated_at IS NULL");
$stmt->execute([$target_id]);
$target = $stmt->fetch();

if (!$target) json_response(['error' => 'User not found'], 404);
if ($target['role'] === 'admin') json_response(['error' => 'Cannot impersonate another admin'], 400);

$_SESSION['impersonating_user_id'] = $target_id;

json_response(['success' => true, 'impersonating' => $target_id]);
```

**Step 8: Create api/admin/stop-impersonate.php**

```php
<?php
require_once __DIR__ . '/../helpers.php';
cors();
require_method('POST');

// Check that the REAL user (not impersonated) is admin
if (empty($_SESSION['user_id']) || empty($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    json_response(['error' => 'Not found'], 404);
}

unset($_SESSION['impersonating_user_id']);

json_response(['success' => true]);
```

**Step 9: Commit**

```bash
git add api/admin/
git commit -m "feat: add admin API endpoints (stats, reports, users, revenue, activity, impersonation)"
```

---

## Task 5: Frontend — Auth Type Updates

**Files:**
- Modify: `src/lib/auth.ts`

**Step 1: Add role and moderation fields to User interface**

```typescript
// Add to User interface:
role: 'user' | 'admin';
suspended_until: string | null;
banned_at: string | null;
ban_reason: string | null;
impersonating: number | null;
```

**Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add role and moderation fields to User type"
```

---

## Task 6: Frontend — Impersonation Banner + NavBar Admin Link

**Files:**
- Create: `src/components/ImpersonationBanner.tsx`
- Modify: `src/components/NavBar.tsx`
- Modify: `src/App.tsx`

**Step 1: Create ImpersonationBanner.tsx**

A fixed banner at the top of the viewport. Uses `useAuth()` to check if impersonating. Uses `apiPost` to stop impersonation.

```typescript
import { useAuth } from '../lib/auth';
import { apiPost } from '../lib/api';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';

export function ImpersonationBanner() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (!user?.impersonating) return null;

  const handleStop = async () => {
    await apiPost('/admin/stop-impersonate.php');
    await refreshUser();
    navigate('/admin');
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      background: 'linear-gradient(90deg, #1C1917, #292524)', color: '#FAF8F5',
      fontSize: 13, fontWeight: 600, borderBottom: '2px solid #E9A020',
    }}>
      <span style={{ color: '#E9A020' }}>Viewing as</span>
      <span>@{user.username}</span>
      <button
        onClick={handleStop}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '4px 12px', borderRadius: 6,
          background: '#E9A020', color: '#1C1917',
          fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Back to Admin
      </button>
    </div>
  );
}
```

**Step 2: Add ImpersonationBanner to App.tsx**

The banner needs to be inside `AuthProvider` (to use `useAuth`) but also needs `BrowserRouter` context (for `useNavigate`). Since `RouterProvider` provides the router context, the banner should be rendered inside the route tree, not above it.

Better approach: render it inside a layout wrapper. Add to `App.tsx`:

```typescript
import { ImpersonationBanner } from './components/ImpersonationBanner';
```

The `ImpersonationBanner` should be rendered inside each page that has a NavBar, OR as a wrapper in the router. The simplest approach: add it to `NavBar.tsx` above the nav content, since NavBar is on every page.

**Step 3: Add banner to NavBar.tsx**

At the very top of NavBar's return JSX, before the `<nav>`:

```typescript
import { ImpersonationBanner } from './ImpersonationBanner';

// In the return:
<>
  <ImpersonationBanner />
  <nav style={{ marginTop: user?.impersonating ? 40 : 0 }}>
    {/* existing nav content */}
  </nav>
</>
```

**Step 4: Add Admin nav link to NavBar**

In the logged-in variant's nav links section, add conditionally:

```typescript
{user?.role === 'admin' && !user?.impersonating && (
  <Link to="/admin" className={`text-sm font-sans relative transition-colors ${isActive('/admin') ? 'font-bold text-charcoal-900' : 'text-charcoal-400 hover:text-charcoal-700'}`}>
    Admin
    {isActive('/admin') && <div className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-honey-500" />}
  </Link>
)}
```

Also add to the avatar dropdown menu and mobile menu.

**Step 5: Commit**

```bash
git add src/components/ImpersonationBanner.tsx src/components/NavBar.tsx
git commit -m "feat: add impersonation banner and admin nav link"
```

---

## Task 7: Frontend — Report Button on UserProfile

**Files:**
- Modify: `src/pages/UserProfile.tsx`

**Step 1: Add Report button and modal**

In the flex container with the Message and Share buttons (~line 277), add a Report button:

```typescript
{user && user.id !== provider.id && user.role !== 'admin' && (
  <button onClick={() => setShowReportModal(true)} disabled={hasReported} ...>
    <Flag className="size-4" />
    {hasReported ? 'Reported' : 'Report'}
  </button>
)}
```

Add state variables:
```typescript
const [showReportModal, setShowReportModal] = useState(false);
const [hasReported, setHasReported] = useState(false);
const [reportReason, setReportReason] = useState('');
const [reportDescription, setReportDescription] = useState('');
```

On mount, check if already reported:
```typescript
useEffect(() => {
  if (user && provider) {
    apiGet<{ has_pending_report: boolean }>('/reports/check.php', { user_id: provider.id })
      .then(d => setHasReported(d.has_pending_report))
      .catch(() => {});
  }
}, [user, provider]);
```

Report modal: overlay + centered card with reason dropdown, description textarea, submit button. On submit, POST to `/reports/create.php`, show toast, close modal, set `hasReported = true`.

Admin users see a "View As" button instead of Report:
```typescript
{user?.role === 'admin' && user.id !== provider.id && (
  <button onClick={handleViewAs}>
    <Eye className="size-4" />
    View As
  </button>
)}
```

**Step 2: Commit**

```bash
git add src/pages/UserProfile.tsx
git commit -m "feat: add Report button and View As for admins on user profiles"
```

---

## Task 8: Frontend — Admin Page (The Big One)

**Files:**
- Create: `src/pages/Admin.tsx`
- Modify: `src/routes.tsx`

**Step 1: Create Admin.tsx**

This is a large file. Structure it with the tab pattern from Settings.tsx. Use recharts for charts (already in dependencies). Use inline styles for anything not in compiled Tailwind.

Tabs: Overview, Reports, Users, Revenue

Each tab fetches its own data on activation (lazy loading). Use `useState` + `useEffect` per tab.

**Overview tab components:**
- `StatCard` — animated counter (use `useEffect` with `requestAnimationFrame` to count up)
- Revenue line chart — `<LineChart>` from recharts with two `<Line>` series
- Orders donut — `<PieChart>` from recharts with `<Pie>`
- Activity feed — simple list with avatars and timestamps

**Reports tab components:**
- Filter buttons (All | Pending | Reviewed | Dismissed | Actioned)
- Report table rows with expandable detail
- Action buttons (Dismiss, Warn, Suspend 7d, Suspend 30d, Ban)

**Users tab components:**
- Search input with debounce
- User table rows with status badges
- Action buttons (Suspend, Ban/Unban, View As)

**Revenue tab components:**
- Period selector (7d | 30d | 90d | All time)
- Stat cards
- Stacked area chart — `<AreaChart>` from recharts
- Top items and top categories tables

The page should check `user.role === 'admin'` and render `<NotFound />` if not admin.

**Step 2: Add route to routes.tsx**

```typescript
import Admin from './pages/Admin';

// In the public routes section (before protected routes):
{
  path: "/admin",
  Component: Admin,
},
```

Making it a "public" route means it doesn't require the ProtectedRoute wrapper — but the Admin component itself checks for admin role and shows 404 if not. This avoids the redirect-to-login behavior that ProtectedRoute would trigger.

Actually, it should be inside ProtectedRoute since admin must be logged in. Add it inside the protected children:

```typescript
{
  path: "/admin",
  Component: Admin,
},
```

The Admin component handles the role check internally (showing 404 for non-admins).

**Step 3: Commit**

```bash
git add src/pages/Admin.tsx src/routes.tsx
git commit -m "feat: add admin dashboard page with Overview, Reports, Users, Revenue tabs"
```

---

## Task 9: Frontend — Suspended/Banned User Screens

**Files:**
- Modify: `src/lib/auth.ts` or `src/App.tsx`

**Step 1: Handle suspended/banned state**

In the AuthProvider or a wrapper component, check if the user is suspended or banned after `refreshUser()`. If so, render a full-screen overlay instead of the normal app:

- **Suspended:** "Your account is suspended until [date]. If you believe this is a mistake, contact hivefive@buffalo.edu."
- **Banned:** "Your account has been permanently banned. Reason: [reason]. If you believe this is a mistake, contact hivefive@buffalo.edu."

Both screens have a "Log Out" button.

**Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "feat: add suspended and banned user screens"
```

---

## Task 10: Safety Page Fix + Final Cleanup

**Files:**
- Modify: `src/pages/Safety.tsx` (in Hive repo)

**Step 1: Update the Reporting & Moderation section**

Replace the current text that claims report buttons exist everywhere. Update to accurately describe:
- Report button on user profiles
- Automated escalation (suspensions, bans)
- Admin review team

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Final commit**

```bash
git add src/pages/Safety.tsx
git commit -m "fix: update Safety page reporting section to match actual feature"
```

---

## Execution Order & Dependencies

```
Task 1 (DB schema) ← must be first
    ↓
Task 2 (Auth changes) ← depends on Task 1
Task 3 (Report API) ← depends on Task 1
    ↓
Task 4 (Admin API) ← depends on Task 1, 2
    ↓
Task 5 (Frontend types) ← depends on Task 2
    ↓
Task 6 (Banner + NavBar) ← depends on Task 5
Task 7 (Report button) ← depends on Task 3, 5
Task 8 (Admin page) ← depends on Task 4, 5, 6
    ↓
Task 9 (Suspended/banned screens) ← depends on Task 5
Task 10 (Safety page fix) ← independent, do last
```

**Parallelizable groups:**
- Group A: Tasks 2 + 3 (after Task 1)
- Group B: Tasks 6 + 7 (after Task 5)
- Group C: Task 9 + 10 (after Task 5)
