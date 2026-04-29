-- Migration: Add system_settings table for feature toggles
-- Run this on your existing database via phpMyAdmin SQL tab

CREATE TABLE IF NOT EXISTS system_settings (
    setting_key   VARCHAR(50)  PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL DEFAULT '1',
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO system_settings (setting_key, setting_value) VALUES
    ('feature_requests', '1'),
    ('feature_shop', '1'),
    ('feature_messaging', '1'),
    ('feature_leaderboard', '1');
