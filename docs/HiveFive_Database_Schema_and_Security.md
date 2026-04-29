# HiveFive — Complete Database Schema & Setup Instructions

*This document contains every table the app needs. Set it all up once, set it up right, and the frontend team can build against real endpoints without waiting on you.*

---

## Before You Touch Anything

Read this entire document first. Don't skim. Don't skip to the SQL and start running things. Understand what you're building and why.

---

## How to Set Up the Database

### Step 1: Log into phpMyAdmin

- **Aptitude (test):** `https://aptitude.cse.buffalo.edu/phpmyadmin/`
- **Cattle (prod):** `https://cattle.cse.buffalo.edu/phpmyadmin/`
- **Username:** Your UBIT username
- **Password:** Your **8-digit person number** (NOT your UBIT password)

You must be on **UB VPN or campus network**.

### Step 2: Select the database

Click `cse442_2026_spring_team_j_db` in the left sidebar.

### Step 3: Run the setup SQL

Click the **SQL** tab. Copy the contents of `sql/setup.sql` and click **Go**. This creates all 17 tables, indexes, and foreign keys in one shot.

### Step 4: Run the admin setup SQL

Same SQL tab. Run `sql/admin-setup.sql` to insert the admin user (id=1, role='admin'). This must run before seed.sql.

### Step 5: Run the seed SQL (development only)

Same SQL tab. Run `sql/seed.sql` to populate demo data — 1,000 users, 2,000 services, 5,000 orders, and supporting records across 27 universities. This is for development only and should not run on production.

### Step 6: Do it again on the other server

Aptitude and cattle have **separate databases**. If you only set up aptitude, cattle will have empty tables (or no tables at all). You must run the setup on both.

---

## The Schema: 17 Tables

Here's what we're building and why.

```
users ─────────┬── services ──── service_images
               │        │
               │        ├── orders ──┬── reviews ──── review_votes
               │        │            └── client_reviews
               │        │
               ├── requests ──── proposals
               │
               ├── conversations ──── messages
               │
               ├── transactions
               │
               ├── shop_purchases ──── shop_items
               │
               ├── notifications
               │
               └── reports

               tokens (standalone — for password reset & email verification)
```

### Design Decisions (Read This)

- **Balance** lives on `users` as a cached column, but `transactions` is the source of truth for all money movement
- **avg_rating** and **review_count** are denormalized on `services` — updated when reviews are added so we don't need a JOIN + AVG() on every browse query
- **Leaderboard** is computed via query, not a separate table
- **Shop items** are one table with a `type` column, not 3 separate tables for frames/badges/themes
- **Escrow** is `payment_status` on `orders`, not a separate entity
- **included** on services is JSON, not a join table — it's a display list, not relational data
- **Conversations** enforce `user_one_id` is always the lower ID — prevents duplicate conversations between the same two users. **Enforce this in PHP every time you create or look up a conversation**
- **Dual completion** — both client and provider must mark an order complete (or it auto-completes after 48h) before payment releases
- **Disputes** are tracked inline on orders with dedicated columns, not a separate table
- **Reports** have an auto-escalation system — acknowledged/actioned reports count toward automatic suspension thresholds
- **Two review tables** — `reviews` (client rates provider) and `client_reviews` (provider rates client) — separate tables because they have different foreign key relationships and query patterns

---

## Table Definitions

### 1. users

Accounts, profiles, preferences, balance, equipped cosmetics, moderation state.

```sql
CREATE TABLE users (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    email             VARCHAR(100) NOT NULL UNIQUE,
    username          VARCHAR(50)  NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    first_name        VARCHAR(50)  NOT NULL,
    last_name         VARCHAR(50)  NOT NULL,
    bio               TEXT,
    major             VARCHAR(100) DEFAULT '',
    year              ENUM('Freshman','Sophomore','Junior','Senior','Graduate') DEFAULT NULL,
    university        VARCHAR(100) DEFAULT 'University at Buffalo',
    profile_image     VARCHAR(255) DEFAULT '',
    hivecoin_balance  DECIMAL(10,2) DEFAULT 0.00,
    verified          TINYINT(1)   DEFAULT 0,
    last_verified_at  TIMESTAMP    NULL DEFAULT NULL,
    onboarding_done   TINYINT(1)   DEFAULT 0,
    wants_to_offer    TINYINT(1)   DEFAULT 0,
    wants_to_find     TINYINT(1)   DEFAULT 0,
    notify_orders     TINYINT(1)   DEFAULT 1,
    notify_messages   TINYINT(1)   DEFAULT 1,
    notify_proposals  TINYINT(1)   DEFAULT 0,
    active_frame_id   INT          DEFAULT NULL,
    active_badge_id   INT          DEFAULT NULL,
    active_theme_id   INT          DEFAULT NULL,
    last_seen_at      TIMESTAMP    NULL DEFAULT NULL,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deactivated_at    TIMESTAMP    NULL DEFAULT NULL,
    role              ENUM('user','admin') DEFAULT 'user',
    suspended_until   DATETIME DEFAULT NULL,
    ban_reason        VARCHAR(255) DEFAULT NULL,
    banned_at         DATETIME DEFAULT NULL
);
```

Notes:
- Column is `password_hash`, NOT `password`. We never store plaintext passwords. Ever.
- `active_frame_id`, `active_badge_id`, `active_theme_id` reference `shop_items` — foreign keys are added after `shop_items` is created.
- `last_seen_at` powers online/offline indicators in messaging.
- `last_verified_at` tracks when the user last verified their .edu email.
- `deactivated_at` — non-null means the account is soft-deleted. The user can't log in or be found by others.
- `role` — `'admin'` users have access to the Admin Dashboard and are hidden from regular users in search, leaderboard, and profiles.
- `suspended_until` — when set to a future datetime, the user is temporarily suspended. Auto-set by the report escalation system (3 acknowledged/actioned reports in 30 days = 7-day suspension, 5 all-time = 30-day suspension).
- `banned_at` + `ban_reason` — permanent ban fields set manually by admin.
- Notification preferences are `notify_orders`, `notify_messages`, `notify_proposals` — controls what shows up in the notification bell.
- New accounts start with 0 HiveCoins. The seed gives test users a balance.

### 2. services

What providers offer on the marketplace. 21 categories.

```sql
CREATE TABLE services (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    provider_id      INT          NOT NULL,
    title            VARCHAR(200) NOT NULL,
    category         ENUM('Beauty','Career','Coaching','Coding','Consulting','Cooking',
                          'Design','Errands','Events','Fitness','Language','Moving',
                          'Music','Pet Care','Photography','Rides','Tech Support',
                          'Tutoring','Video','Writing','Other') NOT NULL,
    description      TEXT         NOT NULL,
    included         JSON         DEFAULT NULL,
    pricing_type     ENUM('hourly','flat','custom') DEFAULT 'flat',
    price            DECIMAL(10,2) NOT NULL,
    custom_price_unit VARCHAR(50) DEFAULT NULL,
    avg_rating       DECIMAL(3,2) DEFAULT 0.00,
    review_count     INT          DEFAULT 0,
    is_active        TINYINT(1)   DEFAULT 1,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES users(id),
    INDEX idx_category (category),
    INDEX idx_provider (provider_id),
    INDEX idx_active_category (is_active, category)
);
```

Notes:
- `included` is a JSON array like `["1-hour session", "Study materials", "Practice problems"]`
- `custom_price_unit` — when `pricing_type = 'custom'`, this holds the unit label (e.g. "per page", "per song").
- `avg_rating` and `review_count` must be updated every time a review is added.
- 21 categories: Beauty, Career, Coaching, Coding, Consulting, Cooking, Design, Errands, Events, Fitness, Language, Moving, Music, Pet Care, Photography, Rides, Tech Support, Tutoring, Video, Writing, Other.
- The composite index `idx_active_category` makes the "browse active services by category" query fast.

### 3. service_images

Up to 5 images per service.

```sql
CREATE TABLE service_images (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT          NOT NULL,
    image_url  VARCHAR(255) NOT NULL,
    sort_order TINYINT      DEFAULT 0,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);
```

Notes:
- `ON DELETE CASCADE` means deleting a service automatically deletes its images. No orphan rows.
- Images are uploaded to `api/uploads/services/` and stored as `/api/uploads/services/{filename}`.

### 4. requests

What buyers are looking for.

```sql
CREATE TABLE requests (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT          NOT NULL,
    title        VARCHAR(200) NOT NULL,
    category     ENUM('Beauty','Career','Coaching','Coding','Consulting','Cooking',
                      'Design','Errands','Events','Fitness','Language','Moving',
                      'Music','Pet Care','Photography','Rides','Tech Support',
                      'Tutoring','Video','Writing','Other') NOT NULL,
    description  TEXT         NOT NULL,
    budget_range ENUM('under-50','50-100','100-200','200-500','over-500','flexible') DEFAULT 'flexible',
    deadline     DATE         DEFAULT NULL,
    status       ENUM('open','in_progress','completed','cancelled') DEFAULT 'open',
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_category (category)
);
```

### 5. proposals

Provider responses to requests.

```sql
CREATE TABLE proposals (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    request_id         INT           NOT NULL,
    provider_id        INT           NOT NULL,
    price              DECIMAL(10,2) NOT NULL,
    message            TEXT          NOT NULL,
    estimated_delivery VARCHAR(50)   DEFAULT NULL,
    scheduled_date     DATE          DEFAULT NULL,
    scheduled_time     VARCHAR(20)   DEFAULT NULL,
    status             ENUM('pending','accepted','rejected','expired') DEFAULT 'pending',
    created_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    responded_at       TIMESTAMP     NULL DEFAULT NULL,
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (provider_id) REFERENCES users(id),
    UNIQUE KEY unique_proposal (request_id, provider_id)
);
```

Notes:
- `UNIQUE KEY` prevents a provider from submitting multiple proposals to the same request.
- `estimated_delivery` is a freeform text field (e.g. "2-3 days", "Same day").
- `scheduled_date` + `scheduled_time` — concrete scheduling when the provider proposes a specific time.

### 6. orders

Bookings with escrow, dual completion, and dispute tracking.

```sql
CREATE TABLE orders (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    service_id                  INT           DEFAULT NULL,
    provider_id                 INT           NOT NULL,
    client_id                   INT           NOT NULL,
    request_id                  INT           DEFAULT NULL,
    price                       DECIMAL(10,2) NOT NULL,
    service_fee                 DECIMAL(10,2) NOT NULL,
    total                       DECIMAL(10,2) NOT NULL,
    status                      ENUM('pending','in_progress','awaiting_completion',
                                     'completed','cancelled','disputed') DEFAULT 'pending',
    payment_status              ENUM('held_in_escrow','released','refunded') DEFAULT 'held_in_escrow',
    scheduled_date              DATE          DEFAULT NULL,
    scheduled_time              VARCHAR(20)   DEFAULT NULL,
    scheduled_utc               DATETIME      NULL DEFAULT NULL,
    notes                       TEXT,
    created_at                  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    started_at                  TIMESTAMP     NULL DEFAULT NULL,
    completed_at                TIMESTAMP     NULL DEFAULT NULL,
    client_completed_at         DATETIME      NULL DEFAULT NULL,
    provider_completed_at       DATETIME      NULL DEFAULT NULL,
    auto_complete_at            DATETIME      NULL DEFAULT NULL,
    disputed_at                 DATETIME      NULL DEFAULT NULL,
    disputed_by                 INT           NULL DEFAULT NULL,
    dispute_reason              TEXT          NULL,
    dispute_resolution_deadline DATETIME      NULL DEFAULT NULL,
    proposed_split_by           INT           NULL DEFAULT NULL,
    proposed_split_provider_pct INT           NULL DEFAULT NULL,
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (provider_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES users(id),
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (disputed_by) REFERENCES users(id),
    FOREIGN KEY (proposed_split_by) REFERENCES users(id),
    INDEX idx_provider_status (provider_id, status),
    INDEX idx_client_status (client_id, status),
    INDEX idx_auto_complete (status, auto_complete_at)
);
```

Notes:
- `service_id` is **nullable** — orders from request proposals may not have a service.
- `service_fee` = `price * 0.05`. Stored explicitly so historical orders retain their original fee.
- `payment_status` IS the escrow system. Money is held on creation, released on completion, refunded on cancellation.
- **Dual completion flow:** when one party marks complete, their `*_completed_at` is set and `status` becomes `'awaiting_completion'`. `auto_complete_at` is set to 48h from now. When the second party marks complete (or the 48h timer fires), `status` → `'completed'`, `completed_at` is set, and payment releases.
- **Dispute flow:** either party can open a dispute. `disputed_at`, `disputed_by`, `dispute_reason` track who and why. `dispute_resolution_deadline` gives a window for resolution. `proposed_split_by` + `proposed_split_provider_pct` handle settlement proposals.
- `scheduled_utc` — the `scheduled_date` + `scheduled_time` converted to UTC for consistent server-side comparisons.

### 7. reviews (client rates provider)

```sql
CREATE TABLE reviews (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT       NOT NULL UNIQUE,
    service_id    INT       DEFAULT NULL,
    reviewer_id   INT       NOT NULL,
    provider_id   INT       NOT NULL,
    rating        TINYINT   NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    helpful_count INT       DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES users(id),
    INDEX idx_service (service_id),
    INDEX idx_provider (provider_id)
);
```

Notes:
- `UNIQUE` on `order_id` — one review per order, period.
- `service_id` is nullable (orders from requests may not have a service).
- When a review is inserted, PHP code must also update `services.avg_rating` and `services.review_count`.

### 8. client_reviews (provider rates client)

```sql
CREATE TABLE client_reviews (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    order_id    INT     NOT NULL,
    service_id  INT     DEFAULT NULL,
    reviewer_id INT     NOT NULL COMMENT 'The provider leaving the review',
    client_id   INT     NOT NULL COMMENT 'The client being reviewed',
    rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_client_review (order_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (client_id) REFERENCES users(id)
);
```

Notes:
- Separate table from `reviews` because the relationship is reversed — here the provider reviews the client.
- `reviewer_id` is always the provider, `client_id` is always the client.
- One client review per order, enforced by `UNIQUE KEY` on `order_id`.

### 9. review_votes

Tracks who voted a review as helpful. Prevents unlimited voting.

```sql
CREATE TABLE review_votes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    review_id  INT NOT NULL,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_vote (review_id, user_id)
);
```

Notes:
- `UNIQUE KEY` prevents a user from voting on the same review twice.
- When a vote is inserted, PHP code must also increment `reviews.helpful_count`.

### 10. conversations

Message threads between two users with optional context.

```sql
CREATE TABLE conversations (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_one_id     INT          NOT NULL,
    user_two_id     INT          NOT NULL,
    last_message    VARCHAR(255) DEFAULT '',
    last_message_at TIMESTAMP    NULL DEFAULT NULL,
    context_type    ENUM('service','order','request') DEFAULT NULL,
    context_id      INT          DEFAULT NULL,
    context_title   VARCHAR(255) DEFAULT NULL,
    created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_one_id) REFERENCES users(id),
    FOREIGN KEY (user_two_id) REFERENCES users(id),
    UNIQUE KEY unique_pair (user_one_id, user_two_id)
);
```

**CRITICAL:** `user_one_id` must ALWAYS be the lower ID. Enforce this in PHP every time:

```php
$user_one = min($current_user_id, $other_user_id);
$user_two = max($current_user_id, $other_user_id);
```

If you don't do this, you'll create duplicate conversations and the messaging system will break.

Notes:
- `context_type` / `context_id` / `context_title` — optional metadata linking the conversation to a service, order, or request. Displayed as a header in the chat UI (e.g. "Regarding: Python Tutoring").

### 11. messages

Individual chat messages.

```sql
CREATE TABLE messages (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT       NOT NULL,
    sender_id       INT       NOT NULL,
    body            TEXT      NOT NULL,
    read_at         TIMESTAMP NULL DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    INDEX idx_conversation (conversation_id, created_at)
);
```

Notes:
- `read_at` is a timestamp (not a boolean). NULL = unread. Allows "read at 2:35 PM" style receipts.
- When a message is inserted, also update `conversations.last_message` and `conversations.last_message_at` so the conversation list can be sorted without joining into messages.

### 12. transactions

Source of truth for all HiveCoin movement.

```sql
CREATE TABLE transactions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT           NOT NULL,
    type        ENUM('earning','spending','purchase','refund','bonus') NOT NULL,
    amount      DECIMAL(10,2) NOT NULL,
    description VARCHAR(255)  DEFAULT '',
    order_id    INT           DEFAULT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    INDEX idx_user (user_id, created_at)
);
```

Notes:
- `users.hivecoin_balance` is a cached total. Every time you insert a transaction, also update the user's balance.
- If balance and transactions ever drift, reconcile with: `SELECT SUM(CASE WHEN type IN ('earning','refund','bonus') THEN amount ELSE -amount END) FROM transactions WHERE user_id = ?`
- `purchase` type is for HiveShop cosmetic purchases. `spending` is for order payments.

### 13. shop_items

Cosmetic items available for purchase.

```sql
CREATE TABLE shop_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    type        ENUM('frame','badge','theme') NOT NULL,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    price       DECIMAL(10,2) NOT NULL,
    metadata    JSON         NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type)
);
```

Notes:
- `metadata` stores CSS properties specific to the item type. Examples:
  - Frame: `{"borderStyle": "3px solid #E9A020", "borderRadius": "50%"}`
  - Badge: `{"icon": "award", "accentColor": "#E9A020"}`
  - Theme: `{"gradient": "linear-gradient(135deg, #1E1D1A, #2D2B27)", "accentColor": "#F5B540", "textColor": "#FAF6EA"}`

### 14. shop_purchases

What users have bought.

```sql
CREATE TABLE shop_purchases (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT           NOT NULL,
    item_id    INT           NOT NULL,
    price_paid DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (item_id) REFERENCES shop_items(id),
    UNIQUE KEY unique_purchase (user_id, item_id)
);
```

Notes:
- `UNIQUE KEY` prevents buying the same item twice.
- `price_paid` is stored explicitly so historical purchases retain their original price if shop prices change later.

### 15. tokens

For password reset and email verification flows.

```sql
CREATE TABLE tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    type       ENUM('password_reset','email_verification') NOT NULL,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    used       TINYINT(1)   DEFAULT 0,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_token (token),
    INDEX idx_user_type (user_id, type)
);
```

Notes:
- Generate tokens with `bin2hex(random_bytes(32))` in PHP — cryptographically secure.
- Always check `expires_at` and `used` before accepting a token.
- Delete or mark as used after consumption. Don't leave valid tokens sitting around.

### 16. notifications

In-app notification system with type filtering.

```sql
CREATE TABLE notifications (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    type       ENUM('message','order','order_status','payment','proposal','review') NOT NULL,
    title      VARCHAR(100) NOT NULL,
    body       VARCHAR(255) NOT NULL,
    link       VARCHAR(255) DEFAULT NULL,
    actor_id   INT          DEFAULT NULL,
    is_read    TINYINT(1)   DEFAULT 0,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (actor_id) REFERENCES users(id),
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_user_created (user_id, created_at)
);
```

Notes:
- `type` determines which notification preference controls visibility (maps to `users.notify_orders`, `notify_messages`, `notify_proposals`).
- `actor_id` — the user who triggered the notification (e.g. the person who sent a message). Used for avatar display.
- `link` — frontend route to navigate to when clicked (e.g. `/orders/42`, `/messages`).
- Created via the `create_notification()` helper in `api/helpers.php`.

### 17. reports

User-to-user reports with admin moderation and auto-escalation.

```sql
CREATE TABLE reports (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id     INT NOT NULL,
    reported_id     INT NOT NULL,
    reason          ENUM('harassment','academic_dishonesty','scam_fraud',
                         'inappropriate_content','spam','impersonation','other') NOT NULL,
    description     TEXT NOT NULL,
    status          ENUM('pending','acknowledged','dismissed','actioned') DEFAULT 'pending',
    admin_note      TEXT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at     DATETIME DEFAULT NULL,
    resolved_by     INT DEFAULT NULL,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (reported_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);
```

Notes:
- **Status workflow:** `pending` → admin reviews → `acknowledged` (valid, no manual action), `dismissed` (invalid), or `actioned` (manual intervention taken).
- `acknowledged` means the report is valid and counts toward auto-escalation thresholds, but the admin hasn't taken direct action (no ban/suspend).
- **Auto-escalation** triggers when an admin acknowledges or actions a report:
  - 3+ acknowledged/actioned reports against the same user in the last 30 days → 7-day automatic suspension
  - 5+ acknowledged/actioned reports against the same user all-time → 30-day automatic suspension
- Auto-escalation logic runs in `api/admin/reports.php` on PATCH, not at report creation time.
- `resolved_by` tracks which admin handled the report.
- Duplicate pending reports from the same reporter against the same user are blocked at creation time.

### Add Foreign Keys for Equipped Cosmetics

Run this AFTER all tables are created:

```sql
ALTER TABLE users
    ADD FOREIGN KEY (active_frame_id) REFERENCES shop_items(id) ON DELETE SET NULL,
    ADD FOREIGN KEY (active_badge_id) REFERENCES shop_items(id) ON DELETE SET NULL,
    ADD FOREIGN KEY (active_theme_id) REFERENCES shop_items(id) ON DELETE SET NULL;
```

`ON DELETE SET NULL` means if a shop item is deleted, the user's equipped item just becomes empty rather than causing a foreign key error.

---

## Security Rules — FOLLOW THESE OR LOSE POINTS

These are directly from the course rubric. Violating them costs the **entire team** points.

### Rule 1: NEVER Store Plaintext Passwords

The rubric literally gives you **0 (Unsatisfactory)** if "users' passwords stored on the server in plaintext."

```php
// CORRECT — hash with automatic salt (gets you "Exemplary" on the rubric)
$hash = password_hash($password, PASSWORD_DEFAULT);

// CORRECT — verify a login attempt
$valid = password_verify($input_password, $stored_hash);
```

```php
// WRONG — instant zero on the rubric
$sql = "INSERT INTO users (password) VALUES ('$password')";

// WRONG — MD5 is not secure
$hash = md5($password);

// WRONG — SHA without salt is not "hashed and salted"
$hash = hash('sha256', $password);
```

`password_hash()` with `PASSWORD_DEFAULT` automatically generates a unique salt every time. This is all you need. Don't overthink it.

### Rule 2: ALWAYS Use Prepared Statements

Every single query that uses any external data must use a prepared statement. No exceptions. The course activity solutions explicitly say this is the better policy.

```php
// CORRECT — PDO prepared statement
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$result = $stmt->fetch();
```

```php
// WRONG — SQL injection vulnerability. ONE LINE and your database is gone.
$result = $pdo->query("SELECT * FROM users WHERE email = '$email'");

// WRONG — concatenation is the same problem with extra steps
$result = $pdo->query("SELECT * FROM users WHERE email = '" . $email . "'");
```

### Rule 3: NEVER Trust Data from the Frontend

Anyone can open Postman, curl, or write their own JavaScript to send anything to your endpoint. Frontend validation is for user experience, not security. Always validate on the server:

```php
// Always check required fields exist
if (empty($input['email'])) {
    json_response(['error' => 'Email is required'], 400);
}

// Always validate data types and formats
if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    json_response(['error' => 'Invalid email format'], 400);
}

// Always check authorization — is this user allowed to do this?
$user_id = require_auth();
if ($user_id !== $resource_owner_id) {
    json_response(['error' => 'Not authorized'], 403);
}
```

### Rule 4: Use Sessions for Identity

The course teaches that storing user identity in cookies is insecure. We use PHP's `$_SESSION` managed through the `require_auth()` helper:

```php
// require_auth() handles session_start(), checks $_SESSION['user_id'],
// and returns the user ID or responds 401. Use it on every protected endpoint.
$user_id = require_auth();
```

### Rule 5: Never Send Sensitive Data to the Frontend

When querying users, never include `password_hash` in the response:

```php
// CORRECT — select only what the frontend needs
$stmt = $pdo->prepare("SELECT id, username, first_name, last_name, bio, profile_image FROM users WHERE id = ?");

// ALSO CORRECT — remove the hash before sending
$user = $stmt->fetch();
unset($user['password_hash']);
json_response($user);
```

### Rule 6: Prevent XSS

For a JSON API, `json_encode()` handles most encoding. But if you ever output user data in HTML:

```php
echo htmlspecialchars($user_input, ENT_QUOTES, 'UTF-8');
```

The Sprint 3-4 rubric requires the app to actively prevent both XSS AND SQL injection for "Exemplary."

### Rule 7: Keep Credentials Out of the Repo

`api/db_config.php` contains your database username and password. It must NEVER be committed to GitHub.

Add to `.gitignore`:
```
api/db_config.php
```

Commit a template instead (`api/db_config.example.php`) so teammates know what to fill in.

---

## Summary

| # | Table | Purpose |
|---|-------|---------|
| 1 | `users` | Accounts, profiles, preferences, balance, cosmetics, moderation |
| 2 | `services` | What providers offer (21 categories) |
| 3 | `service_images` | Photos per service (up to 5) |
| 4 | `requests` | What buyers are looking for |
| 5 | `proposals` | Provider responses to requests |
| 6 | `orders` | Bookings with escrow, dual completion, disputes |
| 7 | `reviews` | Client rates provider after order completion |
| 8 | `client_reviews` | Provider rates client after order completion |
| 9 | `review_votes` | Tracks who voted a review as helpful |
| 10 | `conversations` | Message threads between 2 users with context |
| 11 | `messages` | Individual chat messages with read receipts |
| 12 | `transactions` | All HiveCoin movement (source of truth) |
| 13 | `shop_items` | Cosmetic items (frames, badges, themes) |
| 14 | `shop_purchases` | What users have bought |
| 15 | `tokens` | Password reset and email verification tokens |
| 16 | `notifications` | In-app notification system |
| 17 | `reports` | User reports with auto-escalation |

17 tables. Every feature in the app is covered. No redundancy.

---

## Checklist Before You Say "I'm Done"

- [ ] All 17 tables created on aptitude
- [ ] All 17 tables created on cattle
- [ ] ALTER TABLE for equipped cosmetic foreign keys run on both
- [ ] Admin user inserted on both (via admin-setup.sql)
- [ ] Seed data inserted on aptitude (with properly generated password hashes)
- [ ] `sql/setup.sql` committed to the repo with all CREATE TABLE statements
- [ ] `sql/seed.sql` committed to the repo with all INSERT statements
- [ ] `api/db_config.php` added to `.gitignore`
- [ ] `api/db_config.example.php` committed to the repo
- [ ] `db_config.php` created manually on aptitude with correct credentials
- [ ] `db_config.php` created manually on cattle with correct credentials
- [ ] Every PHP endpoint uses prepared statements (no exceptions)
- [ ] Every PHP endpoint has CORS headers (via `cors()` helper)
- [ ] No endpoint returns `password_hash` to the frontend
- [ ] Passwords use `password_hash()` with `PASSWORD_DEFAULT`
