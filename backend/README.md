# Champions Club Management System (CCMS) — Backend Architecture & Hackathon Pitch Guide

Spring Boot 4.1.1 & Java 17 enterprise-grade sports club management engine designed for high-concurrency court reservations, omnichannel POS, kitchen display workflows, member lifecycle, double-entry financial ledgering, and reactive domain events.

---

## 1. Executive Pitch (The 30-Second Judge Opener)

"Most club management platforms suffer from three catastrophic engineering flaws:
1. Double-booking race conditions during high-demand court booking rushes.
2. Inconsistent inventory and financial floating-point rounding errors across POS, bar, and member tabs.
3. Monolithic, tightly-coupled workflows that break under scale.

CCMS solves this with an enterprise-grade Domain-Driven Architecture:
- A 4-Tier Anti-Double-Booking pipeline combining JVM lock striping, 96-bit CPU bitmasks, PostgreSQL advisory locks, and GiST hardware exclusion constraints to achieve mathematically impossible double bookings.
- An immutable `Money` value object operating in integer paise, eliminating floating-point drift across all invoices, payments, and refunds.
- A decoupled, asynchronous Event-Driven Notification Engine where domain events automatically trigger real-time multi-channel alerts and operational state updates with zero mock data."

---

## 2. Technology Stack & Runtime Profile

- Language & Runtime: Java 17 LTS, Virtual Threads enabled (`spring.threads.virtual.enabled=true`).
- Framework: Spring Boot 4.1.1, Spring Data JPA / Hibernate, Spring Web MVC, Jakarta Validation.
- Database: PostgreSQL 16+ with `btree_gist` extension for temporal range exclusion.
- Schema Migration: Flyway V1 through V24 (fully automated, reversible database versioning).
- Concurrency & Transactions: 2048-stripe JVM `ReentrantLock` striping, PostgreSQL transaction-scoped advisory locks, Spring Declarative Transactions (`REQUIRES_NEW` on event handlers).
- Architecture Pattern: Domain-Driven Design (DDD) with Domain Events, Clean Separation of Concerns (Controller -> Service -> Repository -> Entity), Value Objects, and State Machines.

---

## 3. Comprehensive Domain Architecture & Component Role Directory

### 3.1 Common Infrastructure (`com.bookmycourt.common`)
The backbone supporting every domain module with safety, consistency, and traceability.

- `actor/Actor.java`, `ActorHolder.java`, `ActorFilter.java`:
  Extracts request identity (`X-Actor-Id`, `X-Actor-Role`, `X-Actor-Name`) into a ThreadLocal context. Provides transparent auditing across every user and staff action without requiring invasive method parameters.
- `concurrency/Guard.java`, `LockKeys.java`:
  Manages a 2048-bucket striped `ReentrantLock` table. Orders locks deterministically by entity hash to mathematically guarantee deadlock-free execution in high-concurrency environments.
- `money/Money.java`:
  Immutable value object holding currency in exact integer paise (`long paise`). Enforces half-up rounding to 2 decimal places and provides zero-overhead arithmetic (`plus`, `minus`, `times`, `toRupees`) that prevents precision loss.
- `event/DomainEvent.java`, `DomainEventPublisher.java`:
  Central domain event interface and publisher. Dispatches business events (`BookingCreated`, `InvoiceIssued`, `ShopOrderPlaced`) via Spring's `ApplicationEventPublisher` with Micrometer metric counters.
- `error/ErrorCode.java`, `GlobalExceptionHandler.java`:
  Standardized HTTP error taxonomy translating domain exceptions (`SlotTakenException`, `CapExceededException`, `NotFoundException`) into uniform JSON envelopes with timestamp and tracking context.
- `sequence/NumberSeriesService.java`:
  Generates continuous, gap-free business reference numbers (e.g., `BK-2026-XXXX`, `INV-26-27-XXXX`, `ORD-XXXX`) via synchronized database counter rows.
- `audit/AuditService.java`:
  Captures immutable change histories (`audit_log` table) recording actor, entity type, entity ID, previous state, new state, and timestamp.

### 3.2 Court Booking & Occupancy Engine (`com.bookmycourt.booking`)
The core high-throughput scheduling engine.

- `engine/BookingEngine.java`:
  Evaluates court availability in pure memory before touching persistent storage. Operates on `CourtDayCalendar` bitmasks.
- `engine/SlotMask.java`:
  Divides a 24-hour day into 96 15-minute intervals. Converts time ranges into bitwise integers (`long mask`). A 60-minute session equals bit pattern `0b1111` (15). Availability verification is a single CPU bitwise AND operation (`calendar.mask & request.mask == 0`).
- `service/BookingService.java`:
  Coordinates the complete booking lifecycle: temporary hold creation, hold confirmation, cancellation with time-decay refund calculation (100% >= 48h, 50% >= 24h, 0% < 24h), turnstile QR check-in, no-show marking, and reschedule.
- `service/OccupancyService.java`:
  Maintains the persistent `occupancy` table. Acquires PostgreSQL transaction advisory locks (`SELECT pg_advisory_xact_lock(...)`) across multi-node clusters.
- `job/HoldReaperJob.java`:
  Scheduled background reaper running every 15 seconds. Identifies abandoned holds exceeding 5 minutes, transitions them to `EXPIRED`, releases occupancy slots, and clears the bitmask.
- `job/BookingCompletionJob.java`:
  Scheduled background reaper that marks completed past bookings and flags un-checked-in slots as `NO_SHOW`.
- `controller/BookingController.java`, `AvailabilityController.java`:
  REST endpoints exposing availability grids, slot hold reservation, booking confirmation, cancellation, and turnstile check-in.

### 3.3 Dynamic Pricing Engine (`com.bookmycourt.pricing`)
Intelligent, rule-weighted rate calculation.

- `service/PricingEngine.java`:
  Evaluates multi-variable pricing matrices: base court rates, peak vs. off-peak hours, weekend vs. weekday surcharges, floodlight fees, and membership discounts.
- `entity/PricingRule.java`:
  Configurable rule entities with priority scores. Matches specific criteria (e.g., Gold Tier = 100% court discount, Silver Tier = 20% discount).
- `dto/PriceQuote.java`:
  Returns complete itemized financial transparency: base price, member discount breakdown, tax rates, and final payable amount.

### 3.4 Member & User Identity (`com.bookmycourt.membership`)
Manages member privileges, digital identification, and tier progression.

- `entity/AppUser.java` vs `entity/Member.java`:
  Clean architectural separation between authentication credentials/login identity (`AppUser`) and sports club profile/entitlements (`Member`).
- `service/MemberService.java`:
  Handles member registration, profile updates, unique QR code generation for turnstile access, and comprehensive activity timeline aggregation.
- `service/MembershipService.java`:
  Administers tier subscriptions (Gold, Silver, Junior, Guest), automated renewal, pro-rated tier upgrades, policy suspension, and anti-hoarding daily booking quota enforcement.
- `controller/MemberController.java`, `MembershipController.java`:
  APIs for member search, QR verification, plan switching, and profile management.

### 3.5 Real-Time Notification Engine (`com.bookmycourt.notification`)
Zero-mock, event-driven notification hub.

- `service/NotificationEventListener.java`:
  Asynchronous domain listener reacting to system-wide events:
  - `BookingEvents.BookingCreated` & `BookingConfirmed` -> Court reservation confirmed with court name and slot.
  - `BookingEvents.BookingCancelled` & `BookingRescheduled` -> Cancellation and time change notices.
  - `ShopEvents.ShopOrderPlaced` & `ShopOrderStatusChanged` -> Pro Shop order updates.
  - `MembershipEvents.MemberRegistered`, `MembershipPurchased`, `MembershipRenewed`, `MembershipTierChanged` -> Welcome and tier notices.
  - `MoneyEvents.InvoiceIssued` & `PaymentRecorded` -> GST billing and payment confirmation.
  - `SocialEvents.SocialParticipantJoined` & `SocialParticipantPromoted` -> Social session and waitlist promotions.
- `service/NotificationService.java`:
  Dispatches notifications in dedicated transactions (`Propagation.REQUIRES_NEW`). Resolves user identities from UUID, member codes, or emails. Provides unread counters and batch mark-read operations. Completely purged of legacy mock seeds.
- `controller/NotificationController.java`:
  REST endpoints for notifications inbox (`GET /api/notifications`), unread counts (`GET /api/notifications/unread-count`), mark-read (`PATCH /api/notifications/{id}/read`), mark-all-read (`POST /api/notifications/mark-all-read`), and deletion (`DELETE /api/notifications/{id}`).

### 3.6 Financial Ledger, Billing & Dues (`com.bookmycourt.finance` & `payment`)
Double-entry principles ensuring fiscal correctness.

- `service/FinanceService.java`, `InvoiceService.java`:
  Builds GST-compliant tax invoices with automatic CGST (9%) and SGST (9%) itemization, pro-rated credit notes, and vendor expense tracking.
- `service/PaymentService.java`:
  Processes simulated online gateway settlements, card/UPI physical desk payments, split tenders, and refund reversals.
- `service/DueService.java`:
  Tracks outstanding member club dues. Enforces hard caps (`payments.max-open-dues-per-member=2`), preventing court bookings if unpaid dues exceed thresholds. Supports managerial write-offs with audit logs.
- `entity/LedgerTransaction.java`, `entity/LedgerEntry.java`:
  Double-entry ledger model guaranteeing that every revenue credit matches corresponding bank/cash debits.

### 3.7 Pro Shop & Inventory POS (`com.bookmycourt.shop`)
High-volume retail sales and stock management.

- `service/ShopService.java`, `InventoryService.java`:
  Manages multi-variant products (sizes, grip sizes, colours). Enforces atomic stock deduction (`UPDATE product_variant SET stock_quantity = stock_quantity - :qty WHERE stock_quantity >= :qty`) to prevent overselling.
- `entity/StockMovement.java`:
  Full audit trail for stock adjustments: sales, restocks, returns, and damages.
- `controller/ShopController.java`:
  POS checkout API, barcode search, order tracking, and restock suggestion reporting.

### 3.8 Food & Beverage POS, Bar Tabs & KDS (`com.bookmycourt.bar`)
Real-time restaurant and sports bar operations.

- `service/BarService.java`, `BarTabService.java`:
  Manages physical club tables, floor zones, member open tabs, order line dispatch, and table transfers.
- `service/BarKitchenService.java`:
  Kitchen Display System (KDS) pipeline transitioning items: `ORDERED` -> `PREPARING` -> `READY` -> `SERVED`.
- `service/BarPaymentService.java`:
  Calculates itemized bill splits across group players and posts settled tabs directly to member ledger accounts.

### 3.9 Social Play & Automated Tournaments (`com.bookmycourt.social`)
Community engagement and mixed-doubles matchmaking.

- `service/SocialService.java`:
  Coordinates open-play social sessions, capacity capping, participant registration, automated waitlisting, and FIFO queue promotion when participants drop out.
- `job/SocialTemplateExpanderJob.java`:
  Generates recurring weekly social play slots automatically across the club calendar.

### 3.10 CRM & Lead Conversion (`com.bookmycourt.crm`)
Sales pipeline for corporate memberships and tournament sponsorships.

- `service/CrmService.java`:
  Tracks leads through pipeline stages: `NEW` -> `CONTACTED` -> `TRIAL_BOOKED` -> `PROPOSAL_SENT` -> `CONVERTED`.
- Generates custom pricing quotes and automates conversion from a prospective lead into an active club member with an activated membership plan.

### 3.11 Human Resources & Shift Rostering (`com.bookmycourt.hr`)
Club staff administration.

- `service/HrService.java`:
  Employee directory, biometric attendance clock-in/out, leave application approval workflows, recurring shift assignment, and end-of-month payroll computation generating downloadable payslips.

---

## 4. The 4-Tier Anti-Double-Booking Deep Dive

When judges ask: *"How do you guarantee that two users clicking 'Book' at the exact same millisecond never get the same court?"* — walk them through this exact 4-tier pipeline:

```text
Request A (t=0ms) ──────────┐
                            ├─► [Tier 1: 2048-Stripe ReentrantLock] ──► Serializes threads on JVM
Request B (t=0ms) ──────────┘                 │
                                              ▼
                                [Tier 2: 96-Bit In-Memory Bitmask]   ──► O(1) CPU bitwise rejection
                                              │
                                              ▼
                                [Tier 3: PostgreSQL Advisory Lock]   ──► Cluster-wide cross-node serialization
                                              │
                                              ▼
                                [Tier 4: PostgreSQL GiST Constraint] ──► Physical hardware exclusion fail-safe
```

1. **Tier 1 — JVM Striped ReentrantLock (`Guard.java`):**
   Locks are striped across 2048 buckets keyed by `courtId + date`. Requests on the same JVM are serialized in microsecond order without blocking requests for different courts or days.
2. **Tier 2 — 96-Bit In-Memory Slot Mask (`BookingEngine.java`):**
   The 24-hour day is divided into 96 15-minute bits. A 1-hour booking is a bitmask of `1111`. If `(calendarMask & slotMask) != 0`, the slot is already taken. It rejects in zero database roundtrips.
3. **Tier 3 — Cross-Node PostgreSQL Advisory Lock (`OccupancyService.java`):**
   In multi-instance deployments (e.g., Kubernetes, Railway), JVM locks cannot synchronize across nodes. Spring executes `SELECT pg_advisory_xact_lock(hashtextextended(:courtDayKey, 0))`. This serializes database write transactions across all cluster nodes.
4. **Tier 4 — PostgreSQL Hardware GiST Range Exclusion (`V11 migration`):**
   The ultimate fail-safe at the storage engine level:
   `EXCLUDE USING gist (court_id WITH =, occupied_period WITH &&) WHERE (status = 'ACTIVE')`.
   PostgreSQL physically rejects overlapping `tstzrange` timestamps at the disk engine level. Overlaps are impossible even with raw SQL inserts.

---

## 5. Hackathon Pitch Q&A Cheat Sheet

Use these exact answers when challenged by technical judges:

- **Judge Question:** *"Why not just use `SELECT ... FOR UPDATE` to lock the court?"*
  - **Your Answer:** *"Because during a booking, the row does not exist yet. That is the classic Phantom Read problem. `SELECT ... FOR UPDATE` cannot lock a nonexistent row. Table-level locking kills throughput. Our solution uses deterministic advisory locks and GiST exclusion ranges, allowing concurrent bookings across different courts while preventing phantom conflicts."*

- **Judge Question:** *"How do you handle money and avoid rounding discrepancies?"*
  - **Your Answer:** *"We banned `double` and `float` across the entire codebase. We engineered an immutable `Money` value object storing currency in integer paise as a `long`. All tax calculations (CGST 9%, SGST 9%) use strict `BigDecimal` rounding modes (`RoundingMode.HALF_UP`), ensuring zero penny drift across thousands of invoices and refunds."*

- **Judge Question:** *"How does your notification system stay decoupled from business transactions?"*
  - **Your Answer:** *"We use an Event-Driven Architecture with Spring Application Events and `DomainEventPublisher`. When a court is confirmed, an invoice issued, or an order placed, domain events are published. `NotificationEventListener` captures them and uses `Propagation.REQUIRES_NEW` to record real notifications in PostgreSQL, completely independent of the originating service."*

- **Judge Question:** *"What happens if a user starts booking, locks a slot, and closes the browser?"*
  - **Your Answer:** *"Our `HoldReaperJob` runs on a 15-second virtual thread schedule. Holds have a 5-minute TTL. The reaper automatically expires stale holds, frees the occupancy table, clears the bitmask, and emits a cancellation event so other waiting members can instantly book the court."*

---

## 6. How to Run & Verify

### Running Backend Locally
```powershell
cd backend
mvn spring-boot:run
```
Backend runs on `http://localhost:8081`. Flyway automatically runs migrations V1 through V24.

### Running Test Suites
```powershell
cd backend
mvn test
```
- `BookingEngineTest`: Concurrency stress test firing 20 simultaneous threads at the exact same court and slot; asserts exactly 1 succeeds and 19 fail with HTTP 409 `SLOT_TAKEN`.
- `PricingEngineTest`: Verifies rule-weighted priority scoring, tier entitlements, and peak-hour rate multipliers.
- `BarServiceTest` & `ShopServiceTest`: Verifies atomic stock deduction and POS ledger balancing.
