-- V14: add columns introduced by the admin configuration entities.

ALTER TABLE club_holiday
    ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS open_time TIME,
    ADD COLUMN IF NOT EXISTS close_time TIME;

ALTER TABLE tax_rate
    ADD COLUMN IF NOT EXISTS item_type SMALLINT NOT NULL DEFAULT 4,
    ADD COLUMN IF NOT EXISTS hsn_code VARCHAR(8),
    ADD COLUMN IF NOT EXISTS tax_inclusive BOOLEAN NOT NULL DEFAULT FALSE;
