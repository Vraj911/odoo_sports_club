
CREATE EXTENSION IF NOT EXISTS pgcrypto;

SET TIME ZONE 'UTC';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. AUTH / MEMBERSHIP
-- ============================================================================

CREATE TABLE app_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320),
    phone VARCHAR(32),
    password_hash TEXT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT app_user_contact_chk CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT app_user_role_chk CHECK (role IN ('ADMIN','MANAGER','FRONT_DESK','BAR_STAFF','SHOP_STAFF','MEMBER'))
);
CREATE UNIQUE INDEX app_user_email_uq ON app_user (LOWER(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX app_user_phone_uq ON app_user (phone) WHERE phone IS NOT NULL;

CREATE TABLE member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES app_user(id) ON DELETE SET NULL,
    member_code VARCHAR(32) NOT NULL UNIQUE,
    qr_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(32),
    email VARCHAR(320),
    address TEXT,
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(32),
    guardian_email VARCHAR(320),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT member_dob_chk CHECK (
        date_of_birth IS NULL OR
        date_of_birth BETWEEN DATE '1900-01-01' AND CURRENT_DATE
    ),
    CONSTRAINT member_guardian_chk CHECK (
        date_of_birth IS NULL OR
        date_of_birth >= CURRENT_DATE - INTERVAL '18 years' OR
        (guardian_name IS NOT NULL AND guardian_phone IS NOT NULL)
    )
);

CREATE TABLE plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    validity_days INTEGER NOT NULL,
    advance_booking_days INTEGER NOT NULL DEFAULT 7,
    max_bookings_per_day INTEGER NOT NULL DEFAULT 2,
    shop_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    bar_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT plan_name_chk CHECK (name IN ('GOLD','SILVER','JUNIOR')),
    CONSTRAINT plan_validity_chk CHECK (validity_days > 0),
    CONSTRAINT plan_booking_days_chk CHECK (advance_booking_days >= 0),
    CONSTRAINT plan_daily_booking_chk CHECK (max_bookings_per_day > 0),
    CONSTRAINT plan_discount_chk CHECK (
        shop_discount_percent BETWEEN 0 AND 100 AND
        bar_discount_percent BETWEEN 0 AND 100
    )
);

CREATE TABLE membership (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES member(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES plan(id) ON DELETE RESTRICT,
    previous_membership_id UUID REFERENCES membership(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT',
    price_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_id UUID,
    suspension_reason TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT membership_dates_chk CHECK (end_date >= start_date),
    CONSTRAINT membership_price_chk CHECK (price_paid >= 0),
    CONSTRAINT membership_status_chk CHECK (
        status IN ('PENDING_PAYMENT','ACTIVE','EXPIRING_SOON','EXPIRED','SUSPENDED','CANCELLED')
    ),
    CONSTRAINT membership_suspension_chk CHECK (
        status <> 'SUSPENDED' OR NULLIF(BTRIM(suspension_reason),'') IS NOT NULL
    ),
    CONSTRAINT membership_cancel_chk CHECK (
        status <> 'CANCELLED' OR NULLIF(BTRIM(cancellation_reason),'') IS NOT NULL
    )
);
CREATE INDEX membership_member_dates_idx ON membership(member_id, start_date DESC);

-- ============================================================================
-- 2. COURTS / BOOKINGS
-- ============================================================================

CREATE TABLE court (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    sport VARCHAR(30) NOT NULL,
    indoor_outdoor VARCHAR(10) NOT NULL,
    location VARCHAR(200),
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT court_type_chk CHECK (indoor_outdoor IN ('INDOOR','OUTDOOR')),
    CONSTRAINT court_duration_chk CHECK (slot_duration_minutes > 0),
    CONSTRAINT court_interval_chk CHECK (
        slot_interval_minutes > 0 AND slot_interval_minutes <= slot_duration_minutes
    )
);

CREATE TABLE pricing_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plan(id) ON DELETE RESTRICT,
    customer_type VARCHAR(20) NOT NULL,
    day_type VARCHAR(15) NOT NULL,
    indoor_outdoor VARCHAR(10),
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pricing_customer_chk CHECK (
        customer_type IN ('GOLD','SILVER','JUNIOR','GUEST')
    ),
    CONSTRAINT pricing_day_chk CHECK (
        day_type IN ('WEEKDAY','WEEKEND','HOLIDAY')
    ),
    CONSTRAINT pricing_io_chk CHECK (
        indoor_outdoor IS NULL OR indoor_outdoor IN ('INDOOR','OUTDOOR')
    ),
    CONSTRAINT pricing_plan_chk CHECK (
        (customer_type = 'GUEST' AND plan_id IS NULL) OR
        (customer_type <> 'GUEST' AND plan_id IS NOT NULL)
    ),
    CONSTRAINT pricing_time_chk CHECK (time_end > time_start),
    CONSTRAINT pricing_price_chk CHECK (price >= 0),
    CONSTRAINT pricing_dates_chk CHECK (valid_to IS NULL OR valid_to >= valid_from)
);

CREATE TABLE booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES member(id) ON DELETE RESTRICT,
    court_id UUID NOT NULL REFERENCES court(id) ON DELETE RESTRICT,
    pricing_rule_id UUID REFERENCES pricing_rule(id) ON DELETE SET NULL,
    guest_name VARCHAR(200),
    guest_phone VARCHAR(32),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    price_charged NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(15) NOT NULL DEFAULT 'UNPAID',
    notes TEXT,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT booking_customer_chk CHECK (
        member_id IS NOT NULL OR NULLIF(BTRIM(guest_name),'') IS NOT NULL
    ),
    CONSTRAINT booking_time_chk CHECK (end_time > start_time),
    CONSTRAINT booking_duration_chk CHECK (end_time - start_time = INTERVAL '60 minutes'),
    CONSTRAINT booking_status_chk CHECK (
        status IN ('PENDING','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','NO_SHOW','EXPIRED')
    ),
    CONSTRAINT booking_price_chk CHECK (price_charged >= 0),
    CONSTRAINT booking_payment_chk CHECK (
        payment_status IN ('UNPAID','PENDING','PAID','REFUNDED')
    )
);
CREATE INDEX booking_member_date_idx ON booking(member_id, start_time DESC);
CREATE INDEX booking_court_time_idx ON booking(court_id, start_time);
CREATE INDEX booking_pending_expiry_idx ON booking(expires_at)
    WHERE status = 'PENDING' AND expires_at IS NOT NULL;

CREATE TABLE social_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES court(id) ON DELETE RESTRICT,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 2,
    status VARCHAR(15) NOT NULL DEFAULT 'OPEN',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT social_time_chk CHECK (end_at > start_at),
    CONSTRAINT social_capacity_chk CHECK (capacity > 0),
    CONSTRAINT social_status_chk CHECK (status IN ('OPEN','FULL','CANCELLED','COMPLETED'))
);

CREATE TABLE social_participant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES social_session(id) ON DELETE RESTRICT,
    member_id UUID REFERENCES member(id) ON DELETE RESTRICT,
    guest_name VARCHAR(200),
    guest_phone VARCHAR(32),
    status VARCHAR(15) NOT NULL DEFAULT 'REGISTERED',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT social_customer_chk CHECK (
        member_id IS NOT NULL OR NULLIF(BTRIM(guest_name),'') IS NOT NULL
    ),
    CONSTRAINT social_participant_status_chk CHECK (
        status IN ('REGISTERED','ATTENDED','CANCELLED','NO_SHOW')
    ),
    CONSTRAINT social_participant_unique UNIQUE(session_id, member_id)
);

CREATE TABLE waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES social_session(id) ON DELETE RESTRICT,
    court_id UUID REFERENCES court(id) ON DELETE RESTRICT,
    member_id UUID REFERENCES member(id) ON DELETE RESTRICT,
    guest_name VARCHAR(200),
    requested_start_at TIMESTAMPTZ,
    requested_end_at TIMESTAMPTZ,
    position INTEGER NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT waitlist_target_chk CHECK (
        session_id IS NOT NULL OR
        (court_id IS NOT NULL AND requested_start_at IS NOT NULL AND requested_end_at IS NOT NULL)
    ),
    CONSTRAINT waitlist_customer_chk CHECK (
        member_id IS NOT NULL OR NULLIF(BTRIM(guest_name),'') IS NOT NULL
    ),
    CONSTRAINT waitlist_time_chk CHECK (
        requested_end_at IS NULL OR requested_end_at > requested_start_at
    ),
    CONSTRAINT waitlist_position_chk CHECK (position > 0),
    CONSTRAINT waitlist_status_chk CHECK (
        status IN ('WAITING','OFFERED','FULFILLED','CANCELLED','EXPIRED')
    )
);

CREATE TABLE occupancy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES court(id) ON DELETE RESTRICT,
    booking_id UUID UNIQUE REFERENCES booking(id) ON DELETE RESTRICT,
    session_id UUID UNIQUE REFERENCES social_session(id) ON DELETE RESTRICT,
    occupancy_type VARCHAR(20) NOT NULL,
    occupied_period TSTZRANGE NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT occupancy_type_chk CHECK (
        occupancy_type IN ('BOOKING','SOCIAL_SESSION','MAINTENANCE')
    ),
    CONSTRAINT occupancy_status_chk CHECK (status IN ('ACTIVE','RELEASED')),
    CONSTRAINT occupancy_period_chk CHECK (
        NOT isempty(occupied_period) AND lower(occupied_period) < upper(occupied_period)
    ),
    CONSTRAINT occupancy_source_chk CHECK (
        (occupancy_type = 'BOOKING' AND booking_id IS NOT NULL AND session_id IS NULL) OR
        (occupancy_type = 'SOCIAL_SESSION' AND session_id IS NOT NULL AND booking_id IS NULL) OR
        (occupancy_type = 'MAINTENANCE' AND booking_id IS NULL AND session_id IS NULL)
    )
);

CREATE INDEX occupancy_court_status_idx ON occupancy(court_id, status);

-- ============================================================================
-- 3. SHOP / INVENTORY
-- ============================================================================

CREATE TABLE product (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_tax_chk CHECK (tax_rate BETWEEN 0 AND 100),
    CONSTRAINT product_name_chk CHECK (NULLIF(BTRIM(name),'') IS NOT NULL)
);

CREATE TABLE product_variant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
    sku VARCHAR(100) NOT NULL UNIQUE,
    variant_name VARCHAR(200) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::JSONB,
    price NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    on_hand INTEGER NOT NULL DEFAULT 0,
    reserved INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT variant_price_chk CHECK (price >= 0),
    CONSTRAINT variant_tax_chk CHECK (tax_rate BETWEEN 0 AND 100),
    CONSTRAINT variant_stock_chk CHECK (on_hand >= 0 AND reserved >= 0 AND reserved <= on_hand),
    CONSTRAINT variant_reorder_chk CHECK (reorder_level >= 0)
);
CREATE INDEX product_variant_product_idx ON product_variant(product_id);

CREATE TABLE shop_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    member_id UUID REFERENCES member(id) ON DELETE RESTRICT,
    guest_name VARCHAR(200),
    guest_phone VARCHAR(32),
    fulfillment_method VARCHAR(15) NOT NULL,
    delivery_address TEXT,
    status VARCHAR(25) NOT NULL DEFAULT 'PLACED',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT shop_customer_chk CHECK (
        member_id IS NOT NULL OR NULLIF(BTRIM(guest_name),'') IS NOT NULL
    ),
    CONSTRAINT shop_fulfillment_chk CHECK (fulfillment_method IN ('PICKUP','DELIVERY')),
    CONSTRAINT shop_delivery_chk CHECK (
        fulfillment_method <> 'DELIVERY' OR NULLIF(BTRIM(delivery_address),'') IS NOT NULL
    ),
    CONSTRAINT shop_status_chk CHECK (
        status IN ('PLACED','PAID','READY_FOR_PICKUP','OUT_FOR_DELIVERY','COLLECTED','DELIVERED','RETURNED','FAILED','CANCELLED')
    ),
    CONSTRAINT shop_amount_chk CHECK (
        subtotal >= 0 AND discount_total >= 0 AND tax_total >= 0 AND
        total = subtotal - discount_total + tax_total
    )
);

CREATE TABLE shop_order_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_order_id UUID NOT NULL REFERENCES shop_order(id) ON DELETE RESTRICT,
    product_variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
    product_name_snapshot VARCHAR(200) NOT NULL,
    variant_name_snapshot VARCHAR(200) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(12,2) NOT NULL,
    CONSTRAINT shop_line_qty_chk CHECK (quantity > 0),
    CONSTRAINT shop_line_amount_chk CHECK (
        unit_price >= 0 AND tax_rate BETWEEN 0 AND 100 AND
        discount_amount >= 0 AND line_total >= 0
    )
);

CREATE TABLE stock_movement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
    shop_order_line_id UUID REFERENCES shop_order_line(id) ON DELETE RESTRICT,
    movement_type VARCHAR(25) NOT NULL,
    quantity INTEGER NOT NULL,
    source_type VARCHAR(25) NOT NULL,
    source_id UUID,
    performed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT stock_type_chk CHECK (
        movement_type IN ('RECEIPT','SALE','RETURN','ADJUSTMENT_IN','ADJUSTMENT_OUT',
                          'DAMAGE','RESERVATION','RESERVATION_RELEASE')
    ),
    CONSTRAINT stock_qty_chk CHECK (quantity > 0),
    CONSTRAINT stock_source_chk CHECK (
        source_type IN ('SHOP_ORDER','RETURN','ADJUSTMENT','DAMAGE','OTHER')
    )
);
CREATE INDEX stock_movement_variant_date_idx ON stock_movement(product_variant_id, created_at DESC);

CREATE OR REPLACE FUNCTION apply_stock_movement()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    v_on_hand INTEGER;
    v_reserved INTEGER;
BEGIN
    SELECT on_hand, reserved
      INTO v_on_hand, v_reserved
      FROM product_variant
     WHERE id = NEW.product_variant_id
     FOR UPDATE;

    IF NEW.movement_type IN ('RECEIPT','RETURN','ADJUSTMENT_IN') THEN
        v_on_hand := v_on_hand + NEW.quantity;
    ELSIF NEW.movement_type IN ('SALE','ADJUSTMENT_OUT','DAMAGE') THEN
        IF v_on_hand - NEW.quantity < 0 THEN
            RAISE EXCEPTION 'Insufficient stock for variant %', NEW.product_variant_id;
        END IF;
        IF v_reserved > v_on_hand - NEW.quantity THEN
            RAISE EXCEPTION 'Stock movement would make reserved quantity invalid for variant %', NEW.product_variant_id;
        END IF;
        v_on_hand := v_on_hand - NEW.quantity;
    ELSIF NEW.movement_type = 'RESERVATION' THEN
        IF v_reserved + NEW.quantity > v_on_hand THEN
            RAISE EXCEPTION 'Insufficient available stock for reservation on variant %', NEW.product_variant_id;
        END IF;
        v_reserved := v_reserved + NEW.quantity;
    ELSIF NEW.movement_type = 'RESERVATION_RELEASE' THEN
        IF v_reserved - NEW.quantity < 0 THEN
            RAISE EXCEPTION 'Reservation release exceeds reserved quantity for variant %', NEW.product_variant_id;
        END IF;
        v_reserved := v_reserved - NEW.quantity;
    END IF;

    UPDATE product_variant
       SET on_hand = v_on_hand,
           reserved = v_reserved,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = NEW.product_variant_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER stock_movement_apply_trg
AFTER INSERT ON stock_movement
FOR EACH ROW EXECUTE FUNCTION apply_stock_movement();

-- ============================================================================
-- 4. BAR / POS
-- ============================================================================

CREATE TABLE menu_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT menu_price_chk CHECK (price >= 0),
    CONSTRAINT menu_tax_chk CHECK (tax_rate BETWEEN 0 AND 100)
);

CREATE TABLE bar_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(30) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bar_table_capacity_chk CHECK (capacity > 0),
    CONSTRAINT bar_table_status_chk CHECK (
        status IN ('AVAILABLE','OCCUPIED','RESERVED','OUT_OF_SERVICE')
    )
);

CREATE TABLE bar_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    table_id UUID REFERENCES bar_table(id) ON DELETE RESTRICT,
    member_id UUID REFERENCES member(id) ON DELETE RESTRICT,
    guest_name VARCHAR(200),
    opened_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    member_discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT bar_customer_chk CHECK (
        member_id IS NOT NULL OR NULLIF(BTRIM(guest_name),'') IS NOT NULL OR table_id IS NOT NULL
    ),
    CONSTRAINT bar_status_chk CHECK (
        status IN ('OPEN','SENT','PARTIALLY_PAID','PAID','VOID','CANCELLED')
    ),
    CONSTRAINT bar_amount_chk CHECK (
        member_discount_amount >= 0 AND subtotal >= 0 AND tax_total >= 0 AND
        total = subtotal - member_discount_amount + tax_total
    )
);

CREATE TABLE bar_order_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_order_id UUID NOT NULL REFERENCES bar_order(id) ON DELETE RESTRICT,
    menu_item_id UUID NOT NULL REFERENCES menu_item(id) ON DELETE RESTRICT,
    item_name_snapshot VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(12,2) NOT NULL,
    kitchen_status VARCHAR(15) NOT NULL DEFAULT 'NEW',
    CONSTRAINT bar_line_qty_chk CHECK (quantity > 0),
    CONSTRAINT bar_line_amount_chk CHECK (
        unit_price >= 0 AND tax_rate BETWEEN 0 AND 100 AND line_total >= 0
    ),
    CONSTRAINT bar_kitchen_status_chk CHECK (
        kitchen_status IN ('NEW','PREPARING','READY','SERVED','VOID')
    )
);

-- ============================================================================
-- 5. PAYMENTS / INVOICING / EXPENSES
-- ============================================================================

CREATE TABLE invoice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    member_id UUID REFERENCES member(id) ON DELETE RESTRICT,
    status VARCHAR(15) NOT NULL DEFAULT 'DRAFT',
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    notes TEXT,
    created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_status_chk CHECK (
        status IN ('DRAFT','SENT','PARTIAL','PAID','VOID','OVERDUE')
    ),
    CONSTRAINT invoice_dates_chk CHECK (due_date IS NULL OR due_date >= issue_date),
    CONSTRAINT invoice_amounts_chk CHECK (
        subtotal >= 0 AND tax_total >= 0 AND total = subtotal + tax_total AND
        amount_paid >= 0 AND amount_paid <= total
    )
);

CREATE TABLE invoice_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoice(id) ON DELETE RESTRICT,
    description VARCHAR(500) NOT NULL,
    source_type VARCHAR(20),
    source_id UUID,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    line_total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_line_qty_chk CHECK (quantity > 0),
    CONSTRAINT invoice_line_amount_chk CHECK (
        unit_price >= 0 AND tax_rate BETWEEN 0 AND 100 AND
        tax_amount >= 0 AND line_total = quantity * unit_price + tax_amount
    ),
    CONSTRAINT invoice_line_source_chk CHECK (
        source_type IS NULL OR source_type IN ('MEMBERSHIP','BOOKING','SHOP','BAR','OTHER')
    )
);

CREATE TABLE payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES invoice(id) ON DELETE SET NULL,
    source_type VARCHAR(20) NOT NULL,
    source_id UUID,
    amount NUMERIC(12,2) NOT NULL,
    method VARCHAR(15) NOT NULL,
    gateway VARCHAR(100),
    gateway_transaction_id VARCHAR(200),
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    paid_at TIMESTAMPTZ,
    received_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    reference VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_source_chk CHECK (
        source_type IN ('MEMBERSHIP','BOOKING','SHOP','BAR','INVOICE','REFUND','OTHER')
    ),
    CONSTRAINT payment_amount_chk CHECK (amount > 0),
    CONSTRAINT payment_method_chk CHECK (
        method IN ('CASH','CARD','UPI','ONLINE','GATEWAY')
    ),
    CONSTRAINT payment_status_chk CHECK (
        status IN ('PENDING','AUTHORIZED','PAID','FAILED','VOID','REFUNDED')
    ),
    CONSTRAINT payment_paid_chk CHECK (
        status NOT IN ('PAID','REFUNDED') OR paid_at IS NOT NULL
    ),
    CONSTRAINT payment_gateway_chk CHECK (
        method NOT IN ('ONLINE','GATEWAY') OR gateway_transaction_id IS NOT NULL
    )
);
CREATE INDEX payment_source_idx ON payment(source_type, source_id, created_at DESC);
CREATE INDEX payment_member_idx ON payment(member_id);

CREATE TABLE expense (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number VARCHAR(50) NOT NULL UNIQUE,
    expense_type VARCHAR(50) NOT NULL,
    description TEXT,
    amount NUMERIC(12,2) NOT NULL,
    payment_method VARCHAR(15) NOT NULL,
    incurred_at TIMESTAMPTZ NOT NULL,
    recorded_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT expense_amount_chk CHECK (amount > 0),
    CONSTRAINT expense_payment_method_chk CHECK (
        payment_method IN ('CASH','CARD','UPI','ONLINE','BANK')
    )
);

-- ============================================================================
-- 6. CRM
-- ============================================================================

CREATE TABLE lead (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_number VARCHAR(50) NOT NULL UNIQUE,
    member_id UUID REFERENCES member(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES app_user(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(320),
    phone VARCHAR(32),
    source VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    notes TEXT,
    converted_at TIMESTAMPTZ,
    lost_reason TEXT,
    last_contact_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT lead_source_chk CHECK (
        source IN ('WEBSITE','TRIAL_BOOKING','WALK_IN','PHONE','REFERRAL','OTHER')
    ),
    CONSTRAINT lead_status_chk CHECK (
        status IN ('NEW','CONTACTED','QUOTE_SENT','TRIAL_BOOKED','WON','LOST')
    ),
    CONSTRAINT lead_name_chk CHECK (NULLIF(BTRIM(first_name),'') IS NOT NULL),
    CONSTRAINT lead_conversion_chk CHECK (
        (status = 'WON') = (member_id IS NOT NULL AND converted_at IS NOT NULL)
    ),
    CONSTRAINT lead_lost_reason_chk CHECK (
        status <> 'LOST' OR NULLIF(BTRIM(lost_reason),'') IS NOT NULL
    )
);

CREATE TABLE follow_up (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES lead(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES app_user(id) ON DELETE SET NULL,
    due_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(12) NOT NULL DEFAULT 'OPEN',
    subject VARCHAR(200) NOT NULL,
    notes TEXT,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT follow_up_status_chk CHECK (
        status IN ('OPEN','COMPLETED','CANCELLED','OVERDUE')
    ),
    CONSTRAINT follow_up_completion_chk CHECK (
        (status = 'COMPLETED') = (completed_at IS NOT NULL AND completed_by IS NOT NULL)
    )
);

-- ============================================================================
-- 7. BASIC HR
-- ============================================================================

CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE RESTRICT,
    employee_number VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100),
    job_title VARCHAR(100) NOT NULL,
    joining_date DATE NOT NULL,
    employment_status VARCHAR(15) NOT NULL DEFAULT 'ACTIVE',
    salary_structure JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_status_chk CHECK (
        employment_status IN ('ACTIVE','INACTIVE','TERMINATED','ON_NOTICE')
    )
);

CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL,
    check_in_at TIMESTAMPTZ,
    check_out_at TIMESTAMPTZ,
    status VARCHAR(12) NOT NULL,
    source VARCHAR(12) NOT NULL DEFAULT 'MANUAL',
    notes TEXT,
    approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT attendance_unique UNIQUE(employee_id, attendance_date),
    CONSTRAINT attendance_status_chk CHECK (
        status IN ('PRESENT','ABSENT','LATE','HALF_DAY','ON_LEAVE','HOLIDAY')
    ),
    CONSTRAINT attendance_source_chk CHECK (
        source IN ('MANUAL','DEVICE','IMPORT')
    ),
    CONSTRAINT attendance_times_chk CHECK (
        check_out_at IS NULL OR check_in_at IS NULL OR check_out_at >= check_in_at
    )
);

-- ============================================================================
-- 8. NOTIFICATIONS
-- ============================================================================

CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    notification_type VARCHAR(40) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notification(id) ON DELETE CASCADE,
    channel VARCHAR(15) NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    attempted_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    CONSTRAINT notification_channel_chk CHECK (
        channel IN ('IN_APP','EMAIL','SMS','WHATSAPP')
    ),
    CONSTRAINT notification_delivery_status_chk CHECK (
        status IN ('PENDING','SENT','DELIVERED','FAILED')
    )
);

-- ============================================================================
-- 9. CLUB CONFIGURATION
-- ============================================================================

CREATE TABLE club_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_name VARCHAR(200) NOT NULL,
    legal_name VARCHAR(250),
    phone VARCHAR(32),
    email VARCHAR(320),
    address TEXT,
    website VARCHAR(500),
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE club_setting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description TEXT,
    updated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE club_holiday (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE tax_rate (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    rate NUMERIC(5,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT tax_rate_chk CHECK (rate BETWEEN 0 AND 100),
    CONSTRAINT tax_rate_dates_chk CHECK (
        effective_to IS NULL OR effective_to >= effective_from
    )
);

-- ============================================================================
-- 10. UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER app_user_updated_at BEFORE UPDATE ON app_user
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER member_updated_at BEFORE UPDATE ON member
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER plan_updated_at BEFORE UPDATE ON plan
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER membership_updated_at BEFORE UPDATE ON membership
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER court_updated_at BEFORE UPDATE ON court
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER pricing_rule_updated_at BEFORE UPDATE ON pricing_rule
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER booking_updated_at BEFORE UPDATE ON booking
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER social_session_updated_at BEFORE UPDATE ON social_session
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER waitlist_updated_at BEFORE UPDATE ON waitlist
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER occupancy_updated_at BEFORE UPDATE ON occupancy
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER product_updated_at BEFORE UPDATE ON product
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER product_variant_updated_at BEFORE UPDATE ON product_variant
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER shop_order_updated_at BEFORE UPDATE ON shop_order
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER bar_order_updated_at BEFORE UPDATE ON bar_order
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER invoice_updated_at BEFORE UPDATE ON invoice
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER payment_updated_at BEFORE UPDATE ON payment
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER lead_updated_at BEFORE UPDATE ON lead
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER follow_up_updated_at BEFORE UPDATE ON follow_up
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER employee_updated_at BEFORE UPDATE ON employee
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER attendance_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER club_profile_updated_at BEFORE UPDATE ON club_profile
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- 11. REPORTING VIEWS
-- ============================================================================

CREATE VIEW v_member_summary AS
SELECT
    m.id AS member_id,
    m.member_code,
    m.first_name,
    m.last_name,
    m.is_active,
    COUNT(DISTINCT ms.id) FILTER (
        WHERE ms.status IN ('ACTIVE','EXPIRING_SOON')
    ) AS active_memberships,
    MAX(ms.end_date) AS latest_membership_end_date,
    COUNT(DISTINCT b.id) AS booking_count
FROM member m
LEFT JOIN membership ms ON ms.member_id = m.id
LEFT JOIN booking b ON b.member_id = m.id
GROUP BY m.id, m.member_code, m.first_name, m.last_name, m.is_active;

CREATE VIEW v_inventory_summary AS
SELECT
    pv.id AS product_variant_id,
    pv.sku,
    p.name AS product_name,
    pv.on_hand,
    pv.reserved,
    pv.on_hand - pv.reserved AS available_quantity,
    pv.reorder_level,
    (pv.on_hand - pv.reserved <= pv.reorder_level) AS is_low_stock
FROM product_variant pv
JOIN product p ON p.id = pv.product_id;

CREATE VIEW v_bar_daily_summary AS
SELECT
    created_at::DATE AS order_date,
    COUNT(*) FILTER (WHERE status NOT IN ('VOID','CANCELLED')) AS order_count,
    COALESCE(
        SUM(total) FILTER (WHERE status NOT IN ('VOID','CANCELLED')), 0
    )::NUMERIC(12,2) AS bar_total,
    COUNT(*) FILTER (
        WHERE status IN ('OPEN','SENT','PARTIALLY_PAID')
    ) AS open_order_count
FROM bar_order
GROUP BY created_at::DATE;

CREATE VIEW v_crm_summary AS
SELECT
    status,
    source,
    COUNT(*) AS lead_count,
    COUNT(*) FILTER (WHERE member_id IS NOT NULL) AS converted_count
FROM lead
GROUP BY status, source;

-- ============================================================================
-- 12. INDEXES / AUDIT
-- ============================================================================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    details JSONB NOT NULL DEFAULT '{}'::JSONB
);
CREATE INDEX audit_log_entity_idx ON audit_log(entity_type, entity_id, occurred_at DESC);
CREATE INDEX audit_log_actor_idx ON audit_log(actor_user_id, occurred_at DESC);

CREATE INDEX lead_status_idx ON lead(status, created_at DESC);
CREATE INDEX follow_up_due_idx ON follow_up(due_at, status);
CREATE INDEX attendance_date_idx ON attendance(attendance_date, status);
CREATE INDEX notification_user_idx ON notification(user_id, is_read, created_at DESC);
CREATE INDEX invoice_status_due_idx ON invoice(status, due_date);
CREATE INDEX shop_order_status_idx ON shop_order(status, created_at DESC);
CREATE INDEX bar_order_status_idx ON bar_order(status, created_at DESC);

COMMENT ON TABLE occupancy IS
'Optional occupancy ledger for bookings, social sessions, and maintenance windows. Overlap prevention is an application concern.';

COMMENT ON TABLE product_variant IS
'Product variant plus current inventory state; stock changes must be made through stock_movement.';

COMMENT ON TABLE stock_movement IS
'Inventory ledger. Insert a movement rather than directly editing stock quantities.';

COMMENT ON TABLE payment IS
'Generic payment history for membership, booking, shop, bar, invoice, and refund sources.';

COMMENT ON TABLE membership IS
'Historical membership records are retained; previous_membership_id links renewals/history.';

-- End of V1 hackathon schema.
