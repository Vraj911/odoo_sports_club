# BookMyCourt backend

Spring Boot backend for the Champions Club Management System (CCMS). It provides REST APIs for club operations, court bookings, membership, billing, shop/POS, bar/KDS, CRM, HR, social play, notifications, and dashboard reporting.

## Current stack

| Area | Implementation |
|---|---|
| Runtime | Java 17, Spring Boot 4.1.1, Maven wrapper |
| Persistence | PostgreSQL, Spring Data JPA/Hibernate, Flyway migrations V1–V7 |
| HTTP | Spring MVC, Jakarta validation, common `ApiResponse` / error handling |
| Operations | Actuator health/info/metrics, graceful shutdown, scheduled jobs, WebSocket STOMP configuration |
| Shared services | Money/tax helpers, clock, locking guard, state machine, domain events, idempotency, audit and number series |

## Run locally

Prerequisites: Java 17+ and PostgreSQL.

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

The application listens on `http://localhost:8081`. Configure PostgreSQL and environment-specific values in `src/main/resources/application.properties` before running outside local development. Flyway validates and applies migrations automatically.

## Implemented modules

| Module | Current backend capability |
|---|---|
| Admin | Club profile, settings, holiday calendar, opening hours, tax rates and audit-log records. |
| Facility | Court CRUD, active/inactive toggle and date-specific slot grids. |
| Pricing | Rule-based quotes by tier, day type, court attributes and time window; a legacy public quote service also remains. |
| Membership | Member registration/search/QR scan/timeline, plans, membership purchase, renewal, tier change, suspension and cancellation. |
| Booking | Availability grid, holds, confirmation, payment-due creation, cancellation, reschedule, check-in, no-show, completion, maintenance blocks and utilisation. Court-day calendars use booked/held/social/blocked masks. |
| Social play | Social sessions, participant join/leave, session/court waitlists and recurring template expansion. |
| Payments | Simulated online payment, manual payment, generic payment records, refunds, payment dues, due collection and write-off. |
| Finance | Invoices with line arithmetic, partial/full payment recording, expenses and invoice listing. |
| Shop | Products, variants, stock movements, catalogue, stock checks, orders, POS checkout, cancellation, quick-sale variants and restock suggestions. |
| Bar | Menu, tables, orders, kitchen states/KDS queue, floor plan, split bill calculation, cash shifts and table transfers. |
| CRM | Leads, lead conversion, follow-ups, overdue follow-up list, pipeline statistics and quotes. |
| HR | Employees, attendance, leave requests/types, shift schedules, payroll runs and payslips. |
| Notifications | In-app notification records, delivery records and read/unread operations. |
| Dashboard | Operational summary statistics. |

## API groups

The controllers expose these base paths:

| Base path | Main functions |
|---|---|
| `/api/admin`, `/api/club` | Club configuration and public club information |
| `/api/courts`, `/api/availability`, `/api/bookings` | Courts, availability, booking lifecycle and blocks |
| `/api/pricing` | Price quote |
| `/api/members`, `/api/plans`, `/api/memberships` | Member, plan and membership workflows |
| `/api/social` | Social sessions, participants and waitlists |
| `/api/payments`, `/api/dues` | Payments, refunds and outstanding dues |
| `/api/invoices`, `/api/finance` | Invoices and expenses (both invoice route groups currently exist) |
| `/api/shop`, `/api/public/products` | Shop catalogue, inventory, orders and POS |
| `/api/bar` | Bar menu, table/order/KDS/cash-shift operations |
| `/api/crm` | Leads, follow-ups, pipeline and quotes |
| `/api/hr` | Employees, attendance, leave, shifts and payroll |
| `/api/notifications`, `/api/dashboard` | Notification inbox and dashboard statistics |

For request and response shapes, use DTOs in each module's `dto/` package and the matching controller classes.

## Code layout

```text
src/main/java/com/bookmycourt/
  admin/          club settings, holidays, tax and audit records
  bar/            menu, table, order, KDS and cash shift flows
  booking/        booking engine, occupancy, holds and court blocks
  common/         errors, events, money, time, locks, state and idempotency
  crm/            leads, follow-ups and quotes
  dashboard/      club KPI aggregation
  facility/       court management and slot validation
  finance/        invoices and expenses
  hr/             employees, attendance, leave, shifts and payroll
  membership/     users, members, plans and memberships
  notification/   notification and delivery records
  payment/        payments, refunds and payment dues
  pricing/        pricing rules and quote engines
  shop/           products, inventory, shop orders and POS
  social/         social sessions, participants, waitlists and recurrence
```

## Database and migrations

`src/main/resources/db/migration/` contains the complete schema history:

| Migration | Contents |
|---|---|
| V1 | Base CCMS schema, constraints, occupancy support and inventory trigger/views. |
| V2 | Demo booking data. |
| V3–V4 | Club-profile and invoice currency alignment. |
| V5 | Foundation additions: idempotency, number series, payments/dues/refunds, ledger tables, business clients, invoice extensions, opening hours and reporting support. |
| V6 | Booking/pricing/membership extensions, occupancy metadata, social templates and waitlist fields. |
| V7 | Quick-sale flags, cash shifts, CRM quotes, HR leave, shifts and payroll tables. |
| V8 | Additive query indexes, generated local booking day/slot fields, database-level active-occupancy exclusion, payment gateway uniqueness and payslip uniqueness. |

Key scheduled processes are the booking hold reaper, booking completion/no-show job, membership status job, social recurrence expander and startup calendar rebuild.

## Concurrency & Double-Booking Prevention Architecture

### The Core Problem: The "Last Court Collision"
In high-demand sports clubs, multiple players often attempt to reserve the final remaining prime-time court (e.g., Court 1 at 7:00 PM) at the exact same millisecond. 

In standard web applications, this triggers a **Time-of-Check to Time-of-Use (TOCTOU)** race condition:
1. Thread A checks if slot 7:00 PM is free (`SELECT count(*) WHERE ...`). It returns `0` (free).
2. Thread B checks if slot 7:00 PM is free. It also returns `0` (free).
3. Thread A writes a booking record for 7:00 PM.
4. Thread B writes a booking record for 7:00 PM.
5. **Result: Both players receive a confirmation for the same court at the same time (Double-Booking disaster).**

#### Why Naive Solutions Fail:
* **Application `if (!isBooked)` checks:** Fail completely because both threads read the empty state concurrently before either commits.
* **Row-Level Locks (`SELECT ... FOR UPDATE`):** Fail because **the row does not exist yet** (the Phantom Read problem). You cannot lock a database row that hasn't been created.
* **Database Table Locks (`LOCK TABLE booking`):** Kills application throughput, introduces catastrophic deadlocks, and serializes the entire club system.

---

### The 4-Tier Defense Architecture in CCMS

Champions Club implements a defense-in-depth pipeline that guarantees **zero double-bookings** while maintaining sub-millisecond read throughput:

```text
Concurrent Requests (Request A & Request B arrive at t = 0.000s)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: In-Memory 2048-Stripe Reentrant Lock (Guard.java)      │
│ Keys: Keys.CourtDay(courtId, day), Keys.MemberDay(memberId, day)│
│ -> Serializes concurrent threads on the same JVM                │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: 96-Bit In-Memory Slot Mask Check (BookingEngine.java)  │
│ Fast bitwise AND: (calendarMask & slotMask) != 0                │
│ -> Rejects taken slots in O(1) CPU cycles before hitting the DB │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: PostgreSQL Distributed Advisory Lock (OccupancyService)│
│ SQL: SELECT pg_advisory_xact_lock(hashtextextended(key, 0))    │
│ -> Serializes writes across MULTIPLE backend nodes/replicas     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: PostgreSQL GiST Hardware Exclusion Constraint (V11)    │
│ EXCLUDE USING gist (court_id WITH =, occupied_period WITH &&)   │
│ -> Final physical guarantee at the storage engine level         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       Request A: 201 CREATED          Request B: 409 CONFLICT
       ("Booking confirmed")           ("Slot was just taken")
```

#### Detailed Breakdown of the 4 Layers:

1. **Layer 1: In-Memory Reentrant Lock Striping ([`Guard.java`](file:///src/main/java/com/bookmycourt/common/concurrency/Guard.java))**
   * Uses a 2048-stripe `LockTable` containing striped `ReentrantLock` instances.
   * Locks are acquired in deterministic sorted hash order based on `courtId` and `date`. Deterministic ordering eliminates circular wait conditions (deadlock prevention).
   * Separates execution into two clean phases:
     - `Phase 1 (Decide)`: In-memory evaluation and quota checks.
     - `Phase 2 (Persist)`: Atomic database transaction with auto-commit/rollback.
     - `Phase 3 (Apply)`: Post-commit state and WebSocket domain event dispatch.

2. **Layer 2: Fast In-Memory Bitmask Occupancy ([`BookingEngine.java`](file:///src/main/java/com/bookmycourt/booking/engine/BookingEngine.java), [`SlotMask.java`](file:///src/main/java/com/bookmycourt/booking/engine/SlotMask.java))**
   * The day is partitioned into 96 15-minute slots represented by a 64-bit/128-bit bitmask (`long mask`).
   * A 60-minute booking occupies 4 consecutive bits.
   * Availability check is a single CPU bitwise AND operation:
     ```java
     if ((calendar.occupiedMask() & SlotMask.session(startSlot)) != 0) {
         throw new DomainException(ErrorCode.SLOT_TAKEN, "Slot is occupied");
     }
     ```
   * Enables the system to handle thousands of read/availability requests per second without stressing PostgreSQL.

3. **Layer 3: Cross-Node PostgreSQL Advisory Locks ([`OccupancyService.java`](file:///src/main/java/com/bookmycourt/booking/service/OccupancyService.java#L43-L48))**
   * When deployed on Railway, Render, or Kubernetes with multiple replicas, in-memory Java locks only protect a single JVM.
   * Inside the persistence transaction, Spring Boot executes:
     ```sql
     SELECT pg_advisory_xact_lock(hashtextextended(:courtDayKey, 0));
     ```
   * This transaction-scoped advisory lock is maintained by PostgreSQL across **all connected backend instances**. Replicas attempting to book the same court on the same day are queued at the database level.

4. **Layer 4: PostgreSQL GiST Hardware Exclusion Constraint ([`V11__database_integrity_and_query_optimizations.sql`](file:///src/main/resources/db/migration/V11__database_integrity_and_query_optimizations.sql#L64-L67))**
   * The ultimate fail-safe at the PostgreSQL storage engine level:
     ```sql
     ALTER TABLE occupancy
         ADD CONSTRAINT occupancy_no_overlapping_active_periods
         EXCLUDE USING gist (court_id WITH =, occupied_period WITH &&)
         WHERE (status = 'ACTIVE');
     ```
   * Uses PostgreSQL's `btree_gist` extension. The `&&` operator enforces that no two rows with `status = 'ACTIVE'` for the same `court_id` can have overlapping `tstzrange` timestamps.
   * If any rogue process or direct SQL query attempts to create an overlapping booking, PostgreSQL physically rejects the write with a constraint violation.
   * [`BookingService.java`](file:///src/main/java/com/bookmycourt/booking/service/BookingService.java#L367-L370) catches `DataIntegrityViolationException` and translates it into a standard HTTP 409 `SLOT_TAKEN` domain response.

---

### How to Test Double-Booking Concurrency

#### Method 1: Automated Millisecond Race Script (Recommended)
Run the automated test script included in the repository:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/test_double_booking.ps1
```
* **Execution:** Spawns two concurrent asynchronous background jobs firing requests to `POST /api/v1/bookings` targeting the exact same court, date, and 15:00 slot at the same millisecond.
* **Expected Result:**
  - Request 1: `HTTP 201 Created` (Booking created and confirmed)
  - Request 2: `HTTP 409 Conflict` (`"Slot was just taken by another booking"`)

#### Method 2: Side-by-Side Split Browser Test
1. Open Google Chrome (Normal window) -> Log in as Member 1.
2. Open Google Chrome (Incognito window) -> Log in as Member 2.
3. On both windows, navigate to Court 1 for tomorrow and select the exact same time slot.
4. Position the windows side-by-side and click "Confirm Booking" at the exact same moment.
5. Window 1 confirms in green; Window 2 immediately shows a toast notification: *"409 Conflict: Slot was just taken by another booking"*.

---

## Core Algorithms & Logic Solutions in CCMS

### 1. Bitwise Slot Engine & Fast Search (`SlotMask`)
* **Problem:** Searching for consecutive available slots across 10+ courts over a 30-day window requires scanning hundreds of thousands of timestamp ranges in SQL, resulting in sluggish calendar views.
* **Solution:** 
  - Each day is mapped to 96 bits (1 bit = 15 minutes). A 1-hour session is represented as bit pattern `0b1111` (decimal 15).
  - Bit shifting (`mask << slotIndex`) generates exact temporal masks in O(1) time.
  - Finding available slots is a bitwise NOT + bitwise AND across composite masks (Booked | Held | Social | Maintenance).

### 2. Hierarchical Rule-Based Dynamic Pricing (`PricingEngine`)
* **Problem:** Pricing changes based on time-of-day (peak vs. off-peak), weekday vs. weekend, court surface/lighting, and membership tier. Hardcoding `if-else` blocks creates spaghetti code.
* **Solution:**
  - Implements a rule-weight engine where pricing rules specify predicate criteria (`Tier`, `DayType`, `TimeWindow`, `CourtType`).
  - Rules are sorted by specificity score. The engine matches the highest-precedence rule and falls back to club base rates.
  - Member perks (e.g. Gold tier 100% discount, Silver tier 20% discount) are calculated and itemized into a full audit breakdown:
    ```json
    {
      "basePrice": 800.00,
      "memberDiscount": -800.00,
      "finalPrice": 0.00,
      "breakdown": "Gold Tier 100% Court Benefit applied"
    }
    ```

### 3. Prorated Cancellation & Tiered Refund Matrix (`BookingService`)
* **Problem:** Members who cancel courts last-minute cause lost revenue, while those cancelling well in advance should receive fair refunds.
* **Solution:**
  - Time-decay lead-time calculation based on the difference between `now()` and `booking.startTime`:
    - **$\Delta t \ge 48$ hours:** 100% refund.
    - **$24 \le \Delta t < 48$ hours:** 50% refund.
    - **$\Delta t < 24$ hours:** 0% refund (slot forfeited).
  - All monetary math is handled using immutable `Money` records backed by `BigDecimal` to prevent floating-point rounding errors.
  - The transaction generates an audit-linked `Refund` entity and adjusts payment balances atomically.

### 4. Anti-Hoarding Daily Quota Engine
* **Problem:** Enthusiastic members might book all prime courts for the entire evening, starving other club members.
* **Solution:**
  - `enforceCap(memberId, day, dailyCap, overrideCap)` checks existing confirmed bookings + active social session registrations for that calendar date.
  - If `activeBookings + joinedSocials >= dailyCap`, further bookings are blocked with `ErrorCode.CAP_EXCEEDED`.
  - The member's quota is protected under `Keys.MemberDay(memberId, day)` lock to prevent parallel quota circumvention. Staff walk-ins can optionally override with an audit log reason.

### 5. Self-Healing Booking Hold Reaper (`HoldReaperJob`)
* **Problem:** Users open the checkout modal (creating a hold) and close their browser or abandon payment, leaving slots locked indefinitely.
* **Solution:**
  - Temporary reservations are assigned status `PENDING` with an expiration timestamp (`OffsetDateTime expiresAt = now + 5 minutes`).
  - A scheduled background reaper runs every 15–30 seconds querying expired holds.
  - Expired holds are transitioned to `EXPIRED`, their occupancy rows are released, and domain events (`BookingExpired`) clear the bitmask in memory.

### 6. Atomic Inventory Depletion & POS Ledger (`ShopService`)
* **Problem:** Overselling limited stock (e.g., rackets, apparel) when multiple POS terminals checkout simultaneously.
* **Solution:**
  - Atomic database conditional updates:
    ```sql
    UPDATE product_variant 
    SET stock_quantity = stock_quantity - :qty 
    WHERE id = :id AND stock_quantity >= :qty
    ```
  - If rows affected == 0, the transaction throws `INSUFFICIENT_STOCK`.
  - Every checkout automatically inserts a record into `stock_movement` with reference type `SHOP_ORDER`, ensuring 100% auditability for stock reconciliation.

---

## Railway & Cloud Deployment Setup

The repository includes ready-to-deploy configuration for [Railway](https://railway.app):

1. **[`Dockerfile`](file:///Dockerfile):** Multi-stage build using `eclipse-temurin:21-jdk` (build stage) and lightweight `eclipse-temurin:21-jre` (runtime stage) with container memory tuning (`-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0`).
2. **[`railway.json`](file:///railway.json):** Configures Dockerfile build path and health check probe on `/actuator/health`.
3. **Environment Variables:**
   | Variable | Value / Format | Purpose |
   |---|---|---|
   | `PORT` | Auto-injected by Railway | Server port (Spring binds via `${PORT:8081}`) |
   | `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` | PostgreSQL connection URL |
   | `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` | PostgreSQL database user |
   | `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` | PostgreSQL database password |
   | `APP_CORS_ALLOWED_ORIGINS` | `https://your-frontend.railway.app` or `*` | Allowed CORS origins |
   | `SPRING_FLYWAY_ENABLED` | `true` | Runs Flyway migrations automatically on startup |

---

## Verification & Tests

```powershell
cd backend
.\mvnw.cmd test
```

Key test suites covering concurrency, pricing, and business logic:
* [`BookingEngineTest.java`](file:///src/test/java/com/bookmycourt/booking/engine/BookingEngineTest.java): Tests 20 concurrent threads attempting to book the same slot simultaneously (`concurrentBooksOnSameSlotOnlyOneWins`), verifying exactly 1 wins and 19 fail with `SlotTakenException`.
* [`BookingServiceTest.java`](file:///src/test/java/com/bookmycourt/booking/service/BookingServiceTest.java): Verifies cancellation policies, prorated refunds, and payment reversals.
* [`PricingEngineTest.java`](file:///src/test/java/com/bookmycourt/pricing/service/PricingEngineTest.java): Verifies tiered membership rate calculations and peak-hour pricing rules.
