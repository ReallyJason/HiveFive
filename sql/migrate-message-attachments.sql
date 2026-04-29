-- Migration: add private message attachments for chat photos/files.
-- Run this on existing databases via phpMyAdmin SQL tab (or mysql CLI).

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
