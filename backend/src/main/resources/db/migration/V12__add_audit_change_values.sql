-- V12: store before/after snapshots for server-side audit entries.

ALTER TABLE audit_log
    ADD COLUMN IF NOT EXISTS before_value JSONB,
    ADD COLUMN IF NOT EXISTS after_value JSONB,
    ADD COLUMN IF NOT EXISTS reason TEXT;
