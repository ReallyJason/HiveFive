-- Migration: Reset and recreate Hive-only internal docs tracking table
-- This table is for the private Hive sprint workspace only.
-- Do not mirror this into the rebuild setup schema.
-- This script is intentionally destructive for this one internal table:
-- rerunning it wipes all existing docs assignment data and recreates the table fresh.

DROP TABLE IF EXISTS internal_docs_tracking;

CREATE TABLE internal_docs_tracking (
    doc_slug            VARCHAR(80)  NOT NULL PRIMARY KEY,
    tracking_json       LONGTEXT     NOT NULL,
    updated_by_username VARCHAR(80)  NULL,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO internal_docs_tracking (doc_slug, tracking_json, updated_by_username)
VALUES ('mirror-rebuild-guide', '{}', NULL);
