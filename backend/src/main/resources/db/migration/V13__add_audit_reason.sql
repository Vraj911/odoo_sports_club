-- V13: add the optional audit reason to already-migrated databases.

ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS reason TEXT;
