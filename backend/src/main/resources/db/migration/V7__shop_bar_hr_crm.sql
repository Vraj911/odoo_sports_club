-- V7: Shop, Bar, HR, and CRM enhancements

-- 1. Shop enhancements
ALTER TABLE product_variant ADD COLUMN IF NOT EXISTS is_quick_sale BOOLEAN NOT NULL DEFAULT false;

-- 2. Bar enhancements
ALTER TABLE bar_table ADD COLUMN IF NOT EXISTS zone VARCHAR(50) DEFAULT 'MAIN';

CREATE TABLE IF NOT EXISTS cash_shift (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_user_id UUID REFERENCES app_user(id) ON DELETE RESTRICT,
    scope VARCHAR(20) NOT NULL DEFAULT 'BAR',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMPTZ,
    opening_float NUMERIC(12,2) NOT NULL DEFAULT 0,
    expected_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
    counted_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
    variance NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
);

-- 3. CRM Quotes
CREATE TABLE IF NOT EXISTS quote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES lead(id) ON DELETE CASCADE,
    valid_until DATE NOT NULL,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES quote(id) ON DELETE CASCADE,
    description VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- 4. HR Leave Management
CREATE TABLE IF NOT EXISTS leave_type (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    yearly_days INT NOT NULL DEFAULT 12,
    is_paid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO leave_type (name, yearly_days, is_paid)
VALUES 
    ('Casual Leave', 12, true),
    ('Sick Leave', 10, true),
    ('Unpaid Leave', 30, false)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS leave_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employee(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_type(id) ON DELETE RESTRICT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    days INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. HR Roster and Shifts
CREATE TABLE IF NOT EXISTS shift_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES employee(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    role_assigned VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. HR Payroll
CREATE TABLE IF NOT EXISTS payroll_run (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month CHAR(7) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    total_gross NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_net NUMERIC(12,2) NOT NULL DEFAULT 0,
    finalised_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payslip (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID REFERENCES payroll_run(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employee(id) ON DELETE RESTRICT,
    gross_salary NUMERIC(12,2) NOT NULL,
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
