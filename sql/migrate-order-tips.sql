-- Migration: add order-level tip tracking for post-completion tipping.
-- Run this on existing databases via phpMyAdmin SQL tab (or mysql CLI).

ALTER TABLE orders
    ADD COLUMN tip_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER total,
    ADD COLUMN tipped_at DATETIME NULL DEFAULT NULL AFTER completed_at;
