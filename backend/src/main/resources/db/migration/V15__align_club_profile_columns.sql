-- V15: add profile fields used by the admin configuration entity.

ALTER TABLE club_profile
    ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
    ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(10) NOT NULL DEFAULT 'INV',
    ADD COLUMN IF NOT EXISTS receipt_prefix VARCHAR(10) NOT NULL DEFAULT 'RCT',
    ADD COLUMN IF NOT EXISTS bill_prefix VARCHAR(10) NOT NULL DEFAULT 'BAR';
