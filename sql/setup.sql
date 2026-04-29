-- ============================================================
-- HiveFive — Database Setup
-- Run this on both aptitude and cattle via phpMyAdmin SQL tab
-- ============================================================

-- 1. users
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

-- 2. services
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

-- 3. service_images
CREATE TABLE service_images (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT          NOT NULL,
    image_url  VARCHAR(255) NOT NULL,
    sort_order TINYINT      DEFAULT 0,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- 4. requests
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

-- 5. proposals
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

-- 6. orders
CREATE TABLE orders (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    service_id                  INT           DEFAULT NULL,
    provider_id                 INT           NOT NULL,
    client_id                   INT           NOT NULL,
    request_id                  INT           DEFAULT NULL,
    pricing_type_snapshot       ENUM('hourly','flat','custom') NOT NULL DEFAULT 'flat',
    unit_label_snapshot         VARCHAR(50)   DEFAULT NULL,
    unit_rate                   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    requested_units             DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    authorized_units            DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    actual_units                DECIMAL(10,2) DEFAULT NULL,
    price                       DECIMAL(10,2) NOT NULL,
    service_fee                 DECIMAL(10,2) NOT NULL,
    total                       DECIMAL(10,2) NOT NULL,
    settlement_subtotal         DECIMAL(10,2) DEFAULT NULL,
    settlement_service_fee      DECIMAL(10,2) DEFAULT NULL,
    settlement_total            DECIMAL(10,2) DEFAULT NULL,
    refunded_amount             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tip_amount                  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status                      ENUM('pending','in_progress','awaiting_completion','completed','cancelled','disputed') DEFAULT 'pending',
    payment_status              ENUM('held_in_escrow','released','refunded') DEFAULT 'held_in_escrow',
    scheduled_date              DATE          DEFAULT NULL,
    scheduled_time              VARCHAR(20)   DEFAULT NULL,
    scheduled_utc               DATETIME      NULL DEFAULT NULL,
    notes                       TEXT,
    created_at                  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    started_at                  TIMESTAMP     NULL DEFAULT NULL,
    completed_at                TIMESTAMP     NULL DEFAULT NULL,
    tipped_at                   DATETIME      NULL DEFAULT NULL,
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

CREATE TABLE order_adjustments (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    order_id          INT           NOT NULL,
    requested_by      INT           NOT NULL,
    responded_by      INT           DEFAULT NULL,
    units_delta       DECIMAL(10,2) NOT NULL,
    subtotal_delta    DECIMAL(10,2) NOT NULL,
    service_fee_delta DECIMAL(10,2) NOT NULL,
    total_delta       DECIMAL(10,2) NOT NULL,
    note              TEXT          DEFAULT NULL,
    status            ENUM('pending','accepted','declined') DEFAULT 'pending',
    created_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    responded_at      TIMESTAMP     NULL DEFAULT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (responded_by) REFERENCES users(id),
    INDEX idx_order_adjustments_order (order_id, status, created_at)
);

-- 7. reviews (client rates provider)
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

-- 8. client_reviews (provider rates client)
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

-- 9. review_votes
CREATE TABLE review_votes (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    review_id  INT NOT NULL,
    user_id    INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_vote (review_id, user_id)
);

-- 10. conversations
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

-- 11. messages
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

-- 12. message_attachments
CREATE TABLE message_attachments (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    message_id    INT NOT NULL,
    kind          ENUM('image','file') NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type     VARCHAR(120) NOT NULL,
    file_size     INT NOT NULL,
    storage_name  VARCHAR(255) NOT NULL,
    sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_message_attachments_message (message_id, sort_order, id)
);

-- 13. transactions
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

-- 14. shop_items
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

-- 14. shop_purchases
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

-- 15. tokens
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

-- 16. notifications
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

-- 17. reports
CREATE TABLE IF NOT EXISTS reports (
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

-- Foreign keys for equipped cosmetics (run after shop_items exists)
ALTER TABLE users
    ADD FOREIGN KEY (active_frame_id) REFERENCES shop_items(id) ON DELETE SET NULL,
    ADD FOREIGN KEY (active_badge_id) REFERENCES shop_items(id) ON DELETE SET NULL,
    ADD FOREIGN KEY (active_theme_id) REFERENCES shop_items(id) ON DELETE SET NULL;

-- 18. system_settings (feature toggles & platform config)
CREATE TABLE system_settings (
    setting_key   VARCHAR(50)  PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL DEFAULT '1',
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 19. rate_limits (IP-based throttling for auth endpoints)
CREATE TABLE rate_limits (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    ip_address   VARCHAR(45)  NOT NULL,
    endpoint     VARCHAR(100) NOT NULL,
    attempts     INT          DEFAULT 1,
    window_start TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_endpoint (ip_address, endpoint)
);

-- Default feature flags and platform config
INSERT INTO system_settings (setting_key, setting_value) VALUES
    ('feature_requests', '1'),
    ('feature_shop', '1'),
    ('feature_messaging', '1'),
    ('feature_leaderboard', '1'),
    ('mock_data', '1'),
    ('bypass_code', '696969'),
    ('rate_limit_enabled', '1'),
    ('rate_limit_max_attempts', '10'),
    ('rate_limit_window_minutes', '15');
