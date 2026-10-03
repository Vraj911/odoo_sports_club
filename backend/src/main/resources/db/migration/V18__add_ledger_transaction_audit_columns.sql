-- Add missing BaseEntity audit columns to ledger_transaction table.
-- LedgerTransaction extends BaseEntity which requires created_at and updated_at.
-- These were missed in V9 (which added audit columns to other tables).

ALTER TABLE ledger_transaction
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
