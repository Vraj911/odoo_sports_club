-- V5: Foundation, Actor roles, Idempotency, Number series, Payments, Ledger, and Invoicing additions

-- 1. App user roles (add KITCHEN, ACCOUNTANT) and seed system user
ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_chk;
ALTER TABLE app_user ADD CONSTRAINT app_user_role_chk 
    CHECK (role IN ('ADMIN','MANAGER','FRONT_DESK','BAR_STAFF','SHOP_STAFF','KITCHEN','ACCOUNTANT','MEMBER','SYSTEM'));

INSERT INTO app_user (id, email, phone, password_hash, first_name, last_name, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'system@bookmycourt.local', '+910000000000', '$2a$10$dummyHashNotUsableForLogin123456789012345678901234567890', 'System', 'Actor', 'ADMIN', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Idempotency Record
CREATE TABLE IF NOT EXISTS idempotency_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idem_key VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(255) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    status_code INT NOT NULL,
    response_body TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT idempotency_record_key_uq UNIQUE (idem_key, method, path)
);
CREATE INDEX IF NOT EXISTS idx_idempotency_created ON idempotency_record(created_at);

-- 3. Number Series (composite PK: series, financial_year)
CREATE TABLE IF NOT EXISTS number_series (
    series VARCHAR(40) NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    last_number BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (series, financial_year)
);

-- 4. Payment table alterations
ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_method_chk;
ALTER TABLE payment ADD CONSTRAINT payment_method_chk 
    CHECK (method IN ('CASH','CARD','UPI','ONLINE','GATEWAY','BANK_TRANSFER'));

ALTER TABLE payment DROP CONSTRAINT IF EXISTS payment_status_chk;
ALTER TABLE payment ADD CONSTRAINT payment_status_chk 
    CHECK (status IN ('PENDING','AUTHORIZED','PAID','FAILED','VOID','REFUNDED','PARTIALLY_REFUNDED'));

ALTER TABLE payment ADD COLUMN IF NOT EXISTS simulated BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS cash_shift_id UUID;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS intent_id UUID;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS tendered NUMERIC(12,2);
ALTER TABLE payment ADD COLUMN IF NOT EXISTS change_given NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE payment ADD COLUMN IF NOT EXISTS refunded_total NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 5. Payment Intent
CREATE TABLE IF NOT EXISTS payment_intent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_type VARCHAR(40) NOT NULL,
    ref_id UUID NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_intent_status_chk CHECK (status IN ('OPEN','COMPLETE','CANCELLED'))
);

-- 6. Payment Due
CREATE TABLE IF NOT EXISTS payment_due (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_type VARCHAR(40) NOT NULL,
    ref_id UUID NOT NULL,
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    due_since TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    collected_payment_id UUID REFERENCES payment(id) ON DELETE SET NULL,
    written_off_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    reason TEXT,
    CONSTRAINT payment_due_status_chk CHECK (status IN ('OPEN','COLLECTED','WRITTEN_OFF'))
);
CREATE INDEX IF NOT EXISTS idx_payment_due_member ON payment_due(member_id, status);

-- 7. Refund
CREATE TABLE IF NOT EXISTS refund (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payment(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    reference VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ,
    CONSTRAINT refund_status_chk CHECK (status IN ('REQUESTED','APPROVED','PROCESSED'))
);

-- 8. Double-entry Ledger
CREATE TABLE IF NOT EXISTS ledger_transaction (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(40) NOT NULL,
    ref_type VARCHAR(40) NOT NULL,
    ref_id UUID NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    reversal_of UUID REFERENCES ledger_transaction(id) ON DELETE SET NULL,
    simulated BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    CONSTRAINT ledger_tx_ref_uq UNIQUE (ref_type, ref_id, kind)
);

CREATE TABLE IF NOT EXISTS ledger_entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES ledger_transaction(id) ON DELETE CASCADE,
    account VARCHAR(40) NOT NULL,
    side VARCHAR(6) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    source VARCHAR(20),
    method VARCHAR(20),
    CONSTRAINT ledger_entry_side_chk CHECK (side IN ('DEBIT','CREDIT')),
    CONSTRAINT ledger_entry_amount_chk CHECK (amount > 0)
);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_tx ON ledger_entry(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_account ON ledger_entry(account);

-- 9. Business Client
CREATE TABLE IF NOT EXISTS business_client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    gstin VARCHAR(20),
    state_code VARCHAR(10),
    billing_address TEXT,
    contact_name VARCHAR(100),
    contact_email VARCHAR(320),
    contact_phone VARCHAR(32),
    rate_plan JSONB,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Invoice additions
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS financial_year VARCHAR(9);
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS business_client_id UUID REFERENCES business_client(id) ON DELETE SET NULL;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS cgst NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS sgst NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS igst NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS credit_note_of UUID REFERENCES invoice(id) ON DELETE SET NULL;
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS kind VARCHAR(20) NOT NULL DEFAULT 'INVOICE';

-- 11. Daily Rollup
CREATE TABLE IF NOT EXISTS daily_rollup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_date DATE NOT NULL,
    source VARCHAR(20) NOT NULL,
    method VARCHAR(20) NOT NULL,
    simulated BOOLEAN NOT NULL DEFAULT false,
    gross NUMERIC(12,2) NOT NULL DEFAULT 0,
    net NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0,
    tx_count BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT daily_rollup_uq UNIQUE (business_date, source, method, simulated)
);

-- 12. Reminder Log
CREATE TABLE IF NOT EXISTS reminder_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(40) NOT NULL,
    ref_id UUID NOT NULL,
    offset_label VARCHAR(40) NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reminder_log_uq UNIQUE (kind, ref_id, offset_label)
);

-- 13. Share Link
CREATE TABLE IF NOT EXISTS share_link (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id UUID NOT NULL UNIQUE,
    spec JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. File Object
CREATE TABLE IF NOT EXISTS file_object (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    owner_type VARCHAR(50) NOT NULL,
    owner_id UUID,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Club Opening Hours
CREATE TABLE IF NOT EXISTS club_opening_hours (
    weekday SMALLINT PRIMARY KEY CHECK (weekday BETWEEN 1 AND 7),
    open_time TIME NOT NULL DEFAULT '06:00:00',
    close_time TIME NOT NULL DEFAULT '22:00:00',
    is_closed BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO club_opening_hours (weekday, open_time, close_time, is_closed)
VALUES 
    (1, '06:00:00', '22:00:00', false),
    (2, '06:00:00', '22:00:00', false),
    (3, '06:00:00', '22:00:00', false),
    (4, '06:00:00', '22:00:00', false),
    (5, '06:00:00', '22:00:00', false),
    (6, '06:00:00', '22:00:00', false),
    (7, '06:00:00', '22:00:00', false)
ON CONFLICT (weekday) DO NOTHING;
