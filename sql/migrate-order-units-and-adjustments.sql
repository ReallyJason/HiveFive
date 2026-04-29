ALTER TABLE orders
    ADD COLUMN pricing_type_snapshot ENUM('hourly','flat','custom') NOT NULL DEFAULT 'flat' AFTER request_id,
    ADD COLUMN unit_label_snapshot VARCHAR(50) DEFAULT NULL AFTER pricing_type_snapshot,
    ADD COLUMN unit_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER unit_label_snapshot,
    ADD COLUMN requested_units DECIMAL(10,2) NOT NULL DEFAULT 1.00 AFTER unit_rate,
    ADD COLUMN authorized_units DECIMAL(10,2) NOT NULL DEFAULT 1.00 AFTER requested_units,
    ADD COLUMN actual_units DECIMAL(10,2) DEFAULT NULL AFTER authorized_units,
    ADD COLUMN settlement_subtotal DECIMAL(10,2) DEFAULT NULL AFTER total,
    ADD COLUMN settlement_service_fee DECIMAL(10,2) DEFAULT NULL AFTER settlement_subtotal,
    ADD COLUMN settlement_total DECIMAL(10,2) DEFAULT NULL AFTER settlement_service_fee,
    ADD COLUMN refunded_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER settlement_total;

UPDATE orders o
LEFT JOIN services s ON s.id = o.service_id
SET
    o.pricing_type_snapshot = CASE
        WHEN s.pricing_type IS NOT NULL THEN s.pricing_type
        ELSE 'flat'
    END,
    o.unit_label_snapshot = CASE
        WHEN s.pricing_type = 'hourly' THEN 'hr'
        WHEN s.pricing_type = 'custom' AND s.custom_price_unit IS NOT NULL AND TRIM(s.custom_price_unit) <> '' THEN s.custom_price_unit
        ELSE NULL
    END,
    o.unit_rate = o.price,
    o.requested_units = 1.00,
    o.authorized_units = 1.00,
    o.actual_units = CASE WHEN o.status = 'completed' THEN 1.00 ELSE NULL END,
    o.settlement_subtotal = CASE WHEN o.status = 'completed' THEN o.price ELSE NULL END,
    o.settlement_service_fee = CASE WHEN o.status = 'completed' THEN o.service_fee ELSE NULL END,
    o.settlement_total = CASE WHEN o.status = 'completed' THEN o.total ELSE NULL END,
    o.refunded_amount = CASE WHEN o.status = 'cancelled' THEN o.total ELSE 0.00 END;

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
