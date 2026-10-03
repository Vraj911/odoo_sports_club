# BookMyCourt — Backend (CCMS)

**Champions Club Management System** — Spring Boot 4.1 + PostgreSQL 18

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Database Configuration](#database-configuration)
4. [Schema Overview (35 Tables)](#schema-overview-35-tables)
5. [Detailed Table Reference](#detailed-table-reference)
6. [Entity Relationship Map](#entity-relationship-map)
7. [Database Constraints & Triggers](#database-constraints--triggers)
8. [Reporting Views](#reporting-views)
9. [Module Development Priority](#module-development-priority)
10. [Running Locally](#running-locally)

---

## Tech Stack

| Layer       | Technology                                  |
| ----------- | ------------------------------------------- |
| Framework   | Spring Boot 4.1.1                           |
| Language    | Java 17+ (running on JDK 21)                |
| Database    | PostgreSQL 18                               |
| ORM         | Spring Data JPA / Hibernate 7               |
| Migrations  | Flyway 12                                   |
| Security    | Spring Security (JWT planned)               |
| Validation  | Jakarta Bean Validation                     |
| WebSocket   | Spring WebSocket (for live notifications)   |
| Build       | Maven (wrapper included)                    |
| Utilities   | Lombok                                      |
| Monitoring  | Spring Actuator                             |

---

## Folder Structure

```
backend/
├── pom.xml                          # Maven config, all dependencies
├── mvnw / mvnw.cmd                  # Maven wrapper (no install needed)
├── src/
│   ├── main/
│   │   ├── java/com/bookmycourt/
│   │   │   ├── BookMyCourtApplication.java   # @SpringBootApplication entry
│   │   │   ├── admin/                        # Club settings, holidays, config
│   │   │   │   └── controller/               # (placeholder)
│   │   │   ├── bar/                          # Bar POS: orders, menu, tables
│   │   │   ├── booking/                      # Court bookings, social sessions
│   │   │   ├── common/                       # Shared utilities
│   │   │   │   └── exception/
│   │   │   │       ├── ApiError.java         # Error response DTO
│   │   │   │       └── GlobalExceptionHandler.java
│   │   │   │   └── response/
│   │   │   │       └── ApiResponse.java      # Unified JSON wrapper
│   │   │   ├── crm/                          # Leads, follow-ups
│   │   │   ├── dashboard/                    # Aggregated dashboards
│   │   │   ├── facility/                     # Courts, occupancy management
│   │   │   ├── finance/                      # Invoices, expenses
│   │   │   ├── hr/                           # Employee, attendance
│   │   │   ├── membership/                   # Members, plans, memberships
│   │   │   ├── notification/                 # Notifications & delivery
│   │   │   │   └── provider/
│   │   │   │       └── NotificationProvider.java  # Channel abstraction
│   │   │   ├── payment/                      # Payments (multi-source)
│   │   │   │   └── provider/
│   │   │   │       └── PaymentProvider.java  # Gateway abstraction
│   │   │   ├── pricing/                      # Pricing rules engine
│   │   │   └── shop/                         # Shop orders, products, inventory
│   │   └── resources/
│   │       ├── application.properties        # DB, port, flyway config
│   │       ├── db/migration/
│   │       │   └── V1__hackathon_schema.sql  # Full schema (35 tables)
│   │       ├── static/                       # Static assets
│   │       └── templates/                    # Server-side templates
│   └── test/
│       └── java/                             # Test sources
└── target/                                   # Build output (git-ignored)
```

### Recommended Package Layout (per module)

Each module (e.g., `membership/`) should follow this pattern:

```
membership/
├── controller/          # REST endpoints
│   └── MemberController.java
├── dto/                 # Request/Response DTOs
│   ├── CreateMemberRequest.java
│   └── MemberResponse.java
├── entity/              # JPA @Entity classes
│   ├── Member.java
│   └── Membership.java
├── repository/          # Spring Data JPA repositories
│   └── MemberRepository.java
└── service/             # Business logic
    └── MemberService.java
```

---

## Database Configuration

```properties
# application.properties
server.port=8081
spring.datasource.url=jdbc:postgresql://localhost:5432/bookmycourt
spring.datasource.username=postgres
spring.datasource.password=BookMyCourt@123
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

> **Important:** Hibernate is set to `validate` — it checks entities against DB but never creates/alters tables. Flyway handles all DDL via `V1__hackathon_schema.sql`.

---

## Schema Overview (35 Tables)

The schema is organized into **10 domains**. Here's the complete table inventory:

| # | Domain                  | Table                    | Purpose                                    |
|---|-------------------------|--------------------------|--------------------------------------------|
| 1 | Auth & Membership       | `app_user`               | Login accounts (admin, staff, members)      |
| 2 |                         | `member`                 | Club member profiles (linked to user)       |
| 3 |                         | `plan`                   | Membership plans (GOLD, SILVER, JUNIOR)     |
| 4 |                         | `membership`             | Member ↔ Plan subscriptions with history    |
| 5 | Courts & Bookings       | `court`                  | Physical courts (sport, indoor/outdoor)     |
| 6 |                         | `pricing_rule`           | Dynamic pricing per plan/day/time           |
| 7 |                         | `booking`                | Court reservations (member or guest)        |
| 8 |                         | `social_session`         | Group play sessions on a court              |
| 9 |                         | `social_participant`     | Members/guests in a social session          |
|10 |                         | `waitlist`               | Queue for full sessions or busy courts      |
|11 |                         | `occupancy`              | Court time-range lock (GiST overlap guard)  |
|12 | Shop & Inventory        | `product`                | Shop products with category as column       |
|13 |                         | `product_variant`        | SKU/price/stock per variant                 |
|14 |                         | `shop_order`             | Purchase orders from members/guests         |
|15 |                         | `shop_order_line`        | Individual items in a shop order            |
|16 |                         | `stock_movement`         | Inventory ledger (immutable audit trail)    |
|17 | Bar & POS               | `menu_item`              | Food/drink menu with category as column     |
|18 |                         | `bar_table`              | Physical tables in the bar area             |
|19 |                         | `bar_order`              | Bar orders (table/member/guest)             |
|20 |                         | `bar_order_line`         | Items in a bar order + kitchen status       |
|21 | Payments & Invoicing    | `invoice`                | Invoices for members                        |
|22 |                         | `invoice_line`           | Line items on an invoice                    |
|23 |                         | `payment`                | Generic payment record (all sources)        |
|24 |                         | `expense`                | Club expense tracking                       |
|25 | CRM                     | `lead`                   | Prospective member leads                    |
|26 |                         | `follow_up`              | Scheduled follow-up tasks on leads          |
|27 | HR                      | `employee`               | Staff records linked to app_user            |
|28 |                         | `attendance`             | Daily check-in/out records                  |
|29 | Notifications           | `notification`           | In-app/email/SMS notifications              |
|30 |                         | `notification_delivery`  | Delivery attempts per channel               |
|31 | Club Configuration      | `club_profile`           | Singleton club identity & settings          |
|32 |                         | `club_setting`           | Key-value configuration store               |
|33 |                         | `club_holiday`           | Holiday calendar (affects pricing)          |
|34 |                         | `tax_rate`               | Tax rates with date ranges                  |
|35 | Audit                   | `audit_log`              | System-wide audit trail                     |

---

## Detailed Table Reference

### Domain 1: Auth & Membership

#### `app_user`
The central login entity. Roles are stored as a column (not a separate table).

| Column          | Type         | Notes                                              |
|-----------------|--------------|----------------------------------------------------|
| id              | UUID (PK)    | Auto-generated                                     |
| email           | VARCHAR(320) | Unique (case-insensitive), nullable if phone exists |
| phone           | VARCHAR(32)  | Unique, nullable if email exists                   |
| password_hash   | TEXT         | BCrypt hash                                        |
| first_name      | VARCHAR(100) | Required                                           |
| last_name       | VARCHAR(100) | Required                                           |
| role            | VARCHAR(30)  | `ADMIN`, `MANAGER`, `FRONT_DESK`, `BAR_STAFF`, `SHOP_STAFF`, `MEMBER` |
| is_active       | BOOLEAN      | Soft delete flag                                   |
| last_login_at   | TIMESTAMPTZ  | Updated on login                                   |

**Constraint:** At least one of `email` or `phone` must be provided.

#### `member`
A club member profile. May or may not have an `app_user` login.

| Column          | Type         | Notes                                              |
|-----------------|--------------|----------------------------------------------------|
| id              | UUID (PK)    | Auto-generated                                     |
| user_id         | UUID (FK→app_user) | Optional 1:1 link to login                   |
| member_code     | VARCHAR(32)  | Unique, human-readable code (e.g., `BMC-0001`)     |
| qr_token        | UUID         | Unique QR code for check-in kiosk                  |
| date_of_birth   | DATE         | Guardian required if under 18                      |
| guardian_*      | VARCHAR      | Name, phone, email of guardian for minors           |

**Constraint:** If DOB shows minor (< 18), `guardian_name` + `guardian_phone` are required.

#### `plan`
Three membership tiers with configurable entitlements.

| Column                | Type          | Notes                                |
|-----------------------|---------------|--------------------------------------|
| name                  | VARCHAR(20)   | `GOLD`, `SILVER`, or `JUNIOR`        |
| validity_days         | INTEGER       | Duration of membership               |
| advance_booking_days  | INTEGER       | How far ahead members can book       |
| max_bookings_per_day  | INTEGER       | Daily booking cap                    |
| shop_discount_percent | NUMERIC(5,2)  | % discount on shop purchases         |
| bar_discount_percent  | NUMERIC(5,2)  | % discount on bar orders             |

#### `membership`
Links a member to a plan for a date range. Supports full lifecycle.

| Column                  | Type          | Notes                                         |
|-------------------------|---------------|-----------------------------------------------|
| member_id               | UUID (FK→member) | Who holds this membership                  |
| plan_id                 | UUID (FK→plan)   | Which plan                                 |
| previous_membership_id  | UUID (FK→self)   | Links renewals to history                  |
| start_date / end_date   | DATE          | Active period                                 |
| status                  | VARCHAR(20)   | `PENDING_PAYMENT` → `ACTIVE` → `EXPIRING_SOON` → `EXPIRED` / `SUSPENDED` / `CANCELLED` |
| price_paid              | NUMERIC(12,2) | Amount charged                                |
| payment_id              | UUID          | FK to payment (added after payment table)     |
| suspension_reason       | TEXT          | Required when status = SUSPENDED              |
| cancellation_reason     | TEXT          | Required when status = CANCELLED              |

**Lifecycle:** `PENDING_PAYMENT` → `ACTIVE` → `EXPIRING_SOON` → `EXPIRED` (cron/scheduler). Can be `SUSPENDED` or `CANCELLED` at any point.

---

### Domain 2: Courts & Bookings

#### `court`
Physical courts available for booking.

| Column               | Type          | Notes                               |
|----------------------|---------------|--------------------------------------|
| name                 | VARCHAR(100)  | Unique, e.g., "Badminton Court 1"    |
| sport                | VARCHAR(30)   | e.g., `BADMINTON`, `TENNIS`, `SQUASH`|
| indoor_outdoor       | VARCHAR(10)   | `INDOOR` or `OUTDOOR`               |
| location             | VARCHAR(200)  | Physical location description         |
| slot_duration_minutes| INTEGER       | Default 60                           |
| slot_interval_minutes| INTEGER       | Overlap window, default 30           |

#### `pricing_rule`
Dynamic pricing matrix: price depends on plan type × day type × time slot × indoor/outdoor.

| Column         | Type         | Notes                                         |
|----------------|--------------|-----------------------------------------------|
| plan_id        | UUID (FK)    | NULL for GUEST pricing                        |
| customer_type  | VARCHAR(20)  | `GOLD`, `SILVER`, `JUNIOR`, `GUEST`           |
| day_type       | VARCHAR(15)  | `WEEKDAY`, `WEEKEND`, `HOLIDAY`               |
| indoor_outdoor | VARCHAR(10)  | NULL = applies to both                        |
| time_start     | TIME         | Slot time window start                        |
| time_end       | TIME         | Slot time window end                          |
| price          | NUMERIC(12,2)| Price for this combination                    |
| valid_from/to  | DATE         | Effective date range                          |

**Rule:** `GUEST` customers must have `plan_id = NULL`; members must have a `plan_id`.

#### `booking`
A court reservation. Always 60-minute slots.

| Column          | Type          | Notes                                        |
|-----------------|---------------|----------------------------------------------|
| member_id       | UUID (FK)     | NULL if guest booking                        |
| court_id        | UUID (FK)     | Required                                     |
| pricing_rule_id | UUID (FK)     | Rule used to calculate price                 |
| guest_name      | VARCHAR(200)  | Required if no member_id                     |
| start_time      | TIMESTAMPTZ   | Booking start (full timestamp)               |
| end_time        | TIMESTAMPTZ   | Must be start_time + 60 min                  |
| status          | VARCHAR(20)   | `PENDING` → `CONFIRMED` → `CHECKED_IN` → `COMPLETED` / `CANCELLED` / `NO_SHOW` |
| payment_status  | VARCHAR(15)   | `UNPAID` → `PENDING` → `PAID` / `REFUNDED`  |
| expires_at      | TIMESTAMPTZ   | Auto-cancel if not confirmed by this time    |

#### `occupancy`
**The anti-double-booking engine.** Uses PostgreSQL GiST exclusion constraint to prevent overlapping active occupancy on the same court.

| Column          | Type          | Notes                                        |
|-----------------|---------------|----------------------------------------------|
| court_id        | UUID (FK)     | Which court                                  |
| booking_id      | UUID (FK)     | Set for type=BOOKING                         |
| session_id      | UUID (FK)     | Set for type=SOCIAL_SESSION                  |
| occupancy_type  | VARCHAR(20)   | `BOOKING`, `SOCIAL_SESSION`, `MAINTENANCE`   |
| occupied_period | TSTZRANGE     | PostgreSQL range type for time span          |
| status          | VARCHAR(10)   | `ACTIVE` or `RELEASED`                       |

**Critical:** The `EXCLUDE USING GIST` constraint makes it **physically impossible** for two active occupancies to overlap on the same court. Application must create occupancy in the same transaction as the booking.

#### `social_session` & `social_participant`
Group play sessions (e.g., "Open badminton 6-7pm"). Session has a capacity; participants register.

#### `waitlist`
Queue for when a court slot or social session is full. Supports both session-waitlist and court-slot-waitlist.

---

### Domain 3: Shop & Inventory

#### `product` → `product_variant` → `stock_movement`

```
product (category, name, brand)
  └── product_variant (sku, price, on_hand, reserved, reorder_level)
        └── stock_movement (immutable ledger: RECEIPT, SALE, RETURN, etc.)
```

**Key design:** `product_variant` stores inventory quantities directly (`on_hand`, `reserved`). A database trigger on `stock_movement` INSERT automatically updates these counters transactionally. You **never** update stock directly — always insert a `stock_movement`.

#### `shop_order` → `shop_order_line`
Order with snapshot pricing (line items capture price at order time).

| Formula | `total = subtotal - discount_total + tax_total` |
|---------|------------------------------------------------|

---

### Domain 4: Bar & POS

#### `menu_item`
Category stored as a column (no separate table). Simpler than product.

#### `bar_table` → `bar_order` → `bar_order_line`

```
bar_table (table_number, capacity, status)
  └── bar_order (order linked to table/member/guest)
        └── bar_order_line (items with kitchen_status workflow)
```

**Kitchen workflow:** `NEW` → `PREPARING` → `READY` → `SERVED` (or `VOID`).

| Formula | `total = subtotal - member_discount_amount + tax_total` |
|---------|---------------------------------------------------------|

---

### Domain 5: Payments & Invoicing

#### `payment`
A **single, polymorphic** payment table serving all revenue sources.

| source_type values | `MEMBERSHIP`, `BOOKING`, `SHOP`, `BAR`, `INVOICE`, `REFUND`, `OTHER` |
|--------------------|-----------------------------------------------------------------------|
| method values      | `CASH`, `CARD`, `UPI`, `ONLINE`, `GATEWAY`                           |
| status lifecycle   | `PENDING` → `AUTHORIZED` → `PAID` / `FAILED` / `VOID` / `REFUNDED`  |

**Constraint:** Online/gateway payments must have a `gateway_transaction_id`.

#### `invoice` → `invoice_line`
Formal invoices for members. Lines can reference any source (membership, booking, shop, bar).

#### `expense`
Simple expense tracking with type classification and payment method.

---

### Domain 6: CRM

#### `lead` → `follow_up`

```
lead (prospect with source, status, assigned sales person)
  └── follow_up (scheduled tasks: call back, send email, etc.)
```

**Lead lifecycle:** `NEW` → `CONTACTED` → `QUOTE_SENT` → `TRIAL_BOOKED` → `WON` / `LOST`

When a lead is WON, `member_id` and `converted_at` are set (linking to the new member record).

---

### Domain 7: HR

#### `employee` → `attendance`

```
employee (linked 1:1 to app_user, has department, job_title, salary JSONB)
  └── attendance (one record per day: check-in/out, status)
```

Attendance status: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `ON_LEAVE`, `HOLIDAY`.

---

### Domain 8: Notifications

#### `notification` → `notification_delivery`

```
notification (to a user, with type + title + message)
  └── notification_delivery (per-channel attempt: IN_APP, EMAIL, SMS, WHATSAPP)
```

---

### Domain 9: Club Configuration

| Table           | Purpose                                              |
|-----------------|------------------------------------------------------|
| `club_profile`  | Singleton row: club name, address, currency, timezone |
| `club_setting`  | Key-value config (e.g., `booking.auto_cancel_minutes`) |
| `club_holiday`  | Holiday dates (affects pricing: HOLIDAY day_type)     |
| `tax_rate`      | Tax rates with validity date ranges                   |

---

### Domain 10: Audit

#### `audit_log`
System-wide audit trail. Every significant action records:
- **Who** (`actor_user_id`)
- **What** (`action`, `entity_type`, `entity_id`)
- **When** (`occurred_at`)
- **From where** (`ip_address`, `user_agent`)
- **Details** (`details` JSONB — before/after state)

---

## Entity Relationship Map

```
┌─────────────┐     1:1      ┌──────────┐     N:1     ┌──────┐
│  app_user   │──────────────│  member   │─────────────│ plan │
│  (login)    │              │ (profile) │             └──┬───┘
└──┬──────────┘              └──┬──┬─────┘                │
   │                            │  │                      │
   │ 1:1                    N:1 │  │ N:1              N:1 │
   ▼                            │  │                      ▼
┌──────────┐                    │  │              ┌────────────┐
│ employee │                    │  │              │ membership │
└──┬───────┘                    │  │              └────────────┘
   │ 1:N                       │  │
   ▼                            │  │              ┌──────────────┐
┌────────────┐                  │  └──────────────│   booking     │
│ attendance │                  │       N:1       │ (court res.)  │
└────────────┘                  │                 └──┬───────────┘
                                │                    │ 1:1
                           N:1  │                    ▼
                    ┌───────────┘            ┌─────────────┐
                    │                        │  occupancy   │
                    ▼                        │ (GiST lock)  │
             ┌────────────┐                  └──────────────┘
             │  payment   │                         ▲ 1:1
             │ (all srcs) │                  ┌──────┴───────┐
             └────────────┘                  │social_session│
                    ▲                        └──┬───────────┘
                    │ N:1                       │ 1:N
             ┌──────┴─────┐              ┌─────┴──────────────┐
             │  invoice   │              │ social_participant  │
             └──┬─────────┘              └────────────────────┘
                │ 1:N
             ┌──┴──────────┐
             │ invoice_line │
             └─────────────┘

┌─────────┐  1:N  ┌──────────────┐  1:N  ┌────────────────┐
│ product │───────│product_variant│───────│ stock_movement │
└─────────┘       │ (has stock)  │       │  (ledger)      │
                  └──────────────┘       └────────────────┘

┌───────────┐  1:N  ┌────────────────┐
│ bar_order │───────│ bar_order_line  │
└─────┬─────┘       └───────┬────────┘
      │ N:1                 │ N:1
┌─────┴─────┐        ┌─────┴──────┐
│ bar_table │        │ menu_item  │
└───────────┘        └────────────┘

┌───────────┐  1:N  ┌────────────────┐
│shop_order │───────│ shop_order_line │
└───────────┘       └────────────────┘

┌──────┐  1:N  ┌───────────┐
│ lead │───────│ follow_up │
└──────┘       └───────────┘

┌──────────────┐  1:N  ┌─────────────────────┐
│ notification │───────│ notification_delivery│
└──────────────┘       └─────────────────────┘

┌──────────┐   court_id   ┌─────────┐
│ waitlist │──────────────│  court  │
└──────────┘              └─────────┘
```

### Key Relationships Summary

| Parent            | Child               | Cardinality | FK Column       |
|-------------------|----------------------|-------------|-----------------|
| app_user          | member               | 1:1         | user_id         |
| app_user          | employee             | 1:1         | user_id         |
| member            | membership           | 1:N         | member_id       |
| plan              | membership           | 1:N         | plan_id         |
| member            | booking              | 1:N         | member_id       |
| court             | booking              | 1:N         | court_id        |
| court             | occupancy            | 1:N         | court_id        |
| booking           | occupancy            | 1:1         | booking_id      |
| social_session    | occupancy            | 1:1         | session_id      |
| social_session    | social_participant   | 1:N         | session_id      |
| court             | social_session       | 1:N         | court_id        |
| product           | product_variant      | 1:N         | product_id      |
| product_variant   | stock_movement       | 1:N         | product_variant_id |
| product_variant   | shop_order_line      | 1:N         | product_variant_id |
| shop_order        | shop_order_line      | 1:N         | shop_order_id   |
| menu_item         | bar_order_line       | 1:N         | menu_item_id    |
| bar_order         | bar_order_line       | 1:N         | bar_order_id    |
| bar_table         | bar_order            | 1:N         | table_id        |
| member            | bar_order            | 1:N         | member_id       |
| member            | shop_order           | 1:N         | member_id       |
| member            | payment              | 1:N         | member_id       |
| invoice           | invoice_line         | 1:N         | invoice_id      |
| invoice           | payment              | 1:N         | invoice_id      |
| member            | invoice              | 1:N         | member_id       |
| lead              | follow_up            | 1:N         | lead_id         |
| employee          | attendance           | 1:N         | employee_id     |
| notification      | notification_delivery| 1:N         | notification_id |
| app_user          | notification         | 1:N         | user_id         |
| app_user          | audit_log            | 1:N         | actor_user_id   |

---

## Database Constraints & Triggers

### GiST Exclusion (Anti-Double-Booking)
```sql
ALTER TABLE occupancy
    ADD CONSTRAINT occupancy_no_overlap_excl
    EXCLUDE USING GIST (court_id WITH =, occupied_period WITH &&)
    WHERE (status = 'ACTIVE');
```
This is the **strongest possible guarantee** against double-booking — enforced at the database level.

### Stock Movement Trigger
```sql
CREATE TRIGGER stock_movement_apply_trg
AFTER INSERT ON stock_movement
FOR EACH ROW EXECUTE FUNCTION apply_stock_movement();
```
Automatically updates `product_variant.on_hand` and `product_variant.reserved` when a stock movement is inserted. Raises an exception if stock would go negative.

### Updated_at Triggers
Every table with an `updated_at` column has a `BEFORE UPDATE` trigger that auto-sets it to `CURRENT_TIMESTAMP`.

---

## Reporting Views

| View                    | Description                                    |
|-------------------------|------------------------------------------------|
| `v_member_summary`      | Member + active membership count + booking count |
| `v_inventory_summary`   | Product variant stock levels + low-stock flag   |
| `v_bar_daily_summary`   | Daily bar revenue, order count, open orders     |
| `v_crm_summary`         | Lead count by status × source, conversion rate  |

---

## Module Development Priority

### 🟢 Start Here — Phase 1 (Core Foundation)

> These modules are **prerequisites** for everything else. Build them first.

#### 1. `common/` — Shared Infrastructure
- Already has `ApiResponse`, `ApiError`, `GlobalExceptionHandler`
- Add: `BaseEntity.java` (mapped superclass with id, created_at, updated_at)
- Add: Security config (JWT auth filter, password encoder)
- Add: CORS configuration
- **Why first:** Every other module depends on these

#### 2. `membership/` — Members, Plans, Memberships
- **Entities:** `AppUser`, `Member`, `Plan`, `Membership`
- **Key APIs:**
  - `POST /api/auth/register` — Create user + member
  - `POST /api/auth/login` — JWT login
  - `GET /api/members` — List/search members
  - `POST /api/memberships` — Subscribe to a plan
  - `PATCH /api/memberships/{id}/status` — Activate, suspend, cancel
- **Why second:** Members are the central entity; booking, shop, bar all reference them

#### 3. `facility/` + `booking/` — Courts & Bookings
- **Entities:** `Court`, `PricingRule`, `Booking`, `Occupancy`
- **Key APIs:**
  - `GET /api/courts` — List courts with availability
  - `GET /api/courts/{id}/slots?date=` — Available time slots
  - `POST /api/bookings` — Create booking + occupancy (transactional!)
  - `PATCH /api/bookings/{id}/check-in` — QR scan check-in
  - `PATCH /api/bookings/{id}/cancel` — Cancel + release occupancy
- **Why third:** This is the core product — "BookMyCourt"

### 🟡 Phase 2 — Revenue Modules

#### 4. `payment/` — Payment Processing
- **Entity:** `Payment`
- Generic payment service that handles CASH, CARD, UPI, ONLINE
- Called by membership, booking, shop, and bar modules
- **Why here:** Once bookings work, you need to collect money

#### 5. `shop/` — Pro Shop
- **Entities:** `Product`, `ProductVariant`, `ShopOrder`, `ShopOrderLine`, `StockMovement`
- Product catalog CRUD, order placement, inventory tracking
- **Why here:** Independent revenue stream, simpler than bar

#### 6. `bar/` — Bar & Kitchen POS
- **Entities:** `MenuItem`, `BarTable`, `BarOrder`, `BarOrderLine`
- Table management, order flow with kitchen status
- WebSocket for live kitchen display

### 🔵 Phase 3 — Operations & Growth

#### 7. `finance/` — Invoicing & Expenses
- **Entities:** `Invoice`, `InvoiceLine`, `Expense`
- Auto-generate invoices from bookings/orders

#### 8. `crm/` — Lead Management
- **Entities:** `Lead`, `FollowUp`
- Lead pipeline, follow-up reminders

#### 9. `hr/` — Staff Management
- **Entities:** `Employee`, `Attendance`
- Staff profiles, daily attendance

#### 10. `notification/` — Alerts & Reminders
- **Entities:** `Notification`, `NotificationDelivery`
- Booking reminders, membership expiry alerts

#### 11. `admin/` + `dashboard/` — Config & Analytics
- Club profile, settings, holidays, tax rates
- Dashboard aggregating all reporting views

---

## Running Locally

### Prerequisites
- Java 17+ (JDK 21 recommended)
- PostgreSQL 18+
- Maven (or use included `mvnw`)

### First-Time Setup
```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE bookmycourt;"

# 2. Run the app (Flyway auto-creates all 35 tables)
cd backend
./mvnw spring-boot:run

# App runs on http://localhost:8081
```

### After Schema Changes
```bash
# Drop + recreate (development only!)
psql -U postgres -c "DROP DATABASE bookmycourt; CREATE DATABASE bookmycourt;"
./mvnw clean spring-boot:run
```

---

> **Bottom line:** Start with `common/` (security + base entity), then `membership/` (auth + members), then `booking/` (the core product). Everything else builds on top of these three.
