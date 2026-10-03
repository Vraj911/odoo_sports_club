# BookMyCourt Backend Implementation Progress

## Status Overview
- **Phase A (Audit & Gap Analysis):** DONE (Output: `docs/BACKEND_GAP_REPORT.md`)
- **Phase B (Foundation Core):** DONE
- **Phase C (Admin, Facility & Calendar):** DONE
- **Phase D (Pricing & Membership):** DONE
- **Phase E (Booking Engine Completion):** DONE
- **Phase F (Payment, Ledger & Invoicing):** DONE (Internal payment processing, dues & invoicing; external payment gateway and external SMTP email excluded per user requirement)
- **Phase G (Shop & Inventory):** DONE
- **Phase H (Bar, Kitchen Display & Shifts):** DONE
- **Phase I (CRM & HR):** DONE
- **Phase J (In-app Notifications & Dashboard):** DONE
- **Phase K (Scheduled Jobs, Recovery & Verification):** DONE

---

## Phase Details

### Phase A: Audit & Gap Analysis
- Completed full audit of all 210 existing source files across 14 modules.
- Inventoried 35 tables in `V1__hackathon_schema.sql` and identified existing migrations up to V4.
- Confirmed trigger `apply_stock_movement` already contains reservation/release capabilities.
- Verified test suite and build status: `./mvnw.cmd test` passes 4 tests with 0 failures.
- Generated `docs/BACKEND_GAP_REPORT.md`.

### Phase B: Foundation Core
- Created core shared packages under `com.bookmycourt.common`:
  - `time/`: `ClubTime` (Asia/Kolkata), `ClockConfig` bean
  - `money/`: `Money` (immutable record, paise long, largest-remainder Hare-Niemeyer allocation, percent), `TaxCalculator` (inclusive, exclusive, intra/inter GST split), `MoneyConverters`
  - `actor/`: `ActorRole`, `Actor`, `ActorHolder` (ThreadLocal, runAs), `ActorFilter` (`OncePerRequestFilter`, header-based context)
  - `concurrency/`: `LockTable` (ordered striped reentrant locks, deadlock-proof), `Keys` records (CourtDay, MemberDay, SessionKey, VariantKey, TabKey, PayableKey, etc.), `Guard` (3-phase decide-persist-apply)
  - `event/`: `DomainEvent`, `DomainEventPublisher`, `EventLoopGuard` (depth 6 cycle check), `EventHandlerRunner` (REQUIRES_NEW tx), domain event records across Membership, Booking, Social, Money, Shop, Bar, CRM, HR, System
  - `state/`: `StateMachine<S>` with validation and `ErrorCode.INVALID_STATE`
  - `error/`: `ErrorCode` enum (with HTTP statuses), `DomainException`, integrated into `GlobalExceptionHandler`
  - `idempotency/`: `IdempotencyRecord` entity, `IdempotencyRecordRepository`, `IdempotencyService`, `IdempotencyFilter` with in-flight concurrency handling and SHA-256 caching
  - `audit/`: `AuditService` using Spring Boot 4 Jackson 3 (`tools.jackson.databind.ObjectMapper`)
  - `job/`: `JobRunner` with tryLock non-overlap guard and Micrometer metrics
  - `config/`: `SchedulingConfig`, `AsyncConfig`, `WebSocketConfig` (STOMP broker at `/ws`, `/topic`, `/app`)

### Phase C: Admin, Facility & Calendar
- `ClubOpeningHours` entity, repository, and Flyway migration V5 integration.
- `ClubCalendarService` atomic snapshot service caching hours, holidays, and computing `openSlot`, `closeSlot`, `openStarts` bitmask, and `dayType`.
- Pure `SlotValidator` enforcing 30-min boundaries, past-slot blocking, advance booking window limits, and operating hours.
- Updated `AdminService` and `AdminController`: club profile, key-value settings, holiday event notification, opening-hours management.
- Updated `CourtService` and `CourtController`: CRUD, active toggle, and slot status grid (`GET /api/courts/{id}/slots?date=`).
- Unit tests: `SlotValidatorTest` passing with boundary and operating hours scenarios.

### Phase D: Pricing & Membership
- `NumberSeries` entity, `NumberSeriesRepository`, and `NumberSeriesService` for sequence code generation (`BMC-%04d`).
- Pure `PricingTable`, `PricingRuleValidator`, and `PricingEngine` supporting customer types, day types, sport, indoor/outdoor, time windows, priority scoring, and snapshot quotes.
- Pure `ProrationCalculator` for tier changes / plan upgrades.
- Enhanced `MemberService` with minor guardian validation, phone/email normalization, duplicate checking, QR scanning, timeline assembly, and turning-18 candidate detection.
- Enhanced `PlanService` with validation.
- Enhanced `MembershipService` with purchase (invoice linking), renewal, plan upgrade with proration, suspension, cancellation, and pure `tierAt(memberId, at)`.
- Updated `MembershipController` exposing `/api/members`, `/api/plans`, and `/api/memberships` endpoints.
- Database migration `V6__booking_and_pricing_completion.sql` for table extensions.
- Unit tests: `PricingEngineTest`, `ProrationCalculatorTest` (26 total tests passing).

### Phase E: Booking Engine Completion
- Extended `CourtDayCalendar` to 4 independent bitmasks (`booked`, `held`, `social`, `blocked`) with atomic bitwise operations and startable slot calculations (BKG-04).
- Implemented `OccupancyService` bridging PostgreSQL `TSTZRANGE` ranges with Java `OffsetDateTime` periods without custom Hibernate user types.
- Pure `CancellationPolicy` implementing free cancellation windows (>= 4 hours), staff override, and late cancellation refund percentages.
- `AlternativeSlots` generating alternative suggestions on taken slots for courts of the same sport.
- Implemented `CalendarRegistry` and `CalendarRebuilder` implementing `Rebuildable` to rebuild court day bitmasks on startup and recovery.
- Enhanced `BookingService` under `Guard.run([MemberDay, CourtDay])`:
  - 3-phase decide-persist-apply lifecycle.
  - Member daily booking cap enforcement (counting bookings + joined social sessions) with manager override auditing.
  - Stale hold expiration before reject.
  - Rescheduling under multi-day keys (`oldCourtDay`, `newCourtDay`, `memberDay`).
  - Cancellation with automatic refund computation and occupancy release.
  - Check-in window validation (`[start - 30m, end]`), no-show detection, and completion.
- Implemented `CourtBlockService` for maintenance court blocks under concurrency locks with conflict detection and force-cancellation.
- Enhanced `SocialService` and `SocialTemplate`:
  - Session creation under court lock.
  - Joining with daily cap check and automatic overflow to waitlist.
  - Leaving with FIFO promotion pipeline and candidate daily cap verification under candidate locks.
  - Template recurrence expansion for 4 weeks ahead via `RecurrenceExpanderJob`.
- Implemented `WaitlistListener` listening to `SlotReleased` events to auto-offer slots to FIFO waitlist entries.
- Added endpoints in `BookingController`: `/api/bookings/walk-in`, `/api/bookings/{id}/reschedule`, `/api/bookings/{id}/no-show`, `/api/bookings/{id}/complete`, `/api/courts/{id}/blocks`, `/api/bookings/utilisation`.
- Unit tests: `CourtDayCalendarTest`, `CancellationPolicyTest` (31 total tests passing).

### Phase F: Payment, Invoicing & Dues (Internal)
- As directed, external payment gateways (Razorpay/webhooks) and external SMTP email delivery were excluded. Internal financial recording and ledger structures are fully operational:
  - `PaymentService`: `payNow` (online simulated `SIM-<uuid>` transaction id with immediate confirmation), `recordManual` (CASH with tender & change calculation, CARD, UPI, BANK_TRANSFER), `refund` (validating refunded totals against original payment amount).
  - Dues management: `collectDue` and `writeOffDue`.
  - Invoicing: `NumberSeriesService` integration for gapless sequence codes (`INV/YYYY-YY/XXXXXX`), status progression (`DRAFT -> PAID / PARTIAL`).
  - `PaymentController` and `InvoiceController` endpoints.

### Phase G: Shop & Inventory / POS
- `ShopService` enhanced:
  - Quick counter POS checkout (`POST /api/shop/pos/checkout`) automatically creating orders and recording internal payments.
  - Stock movement and cancellation with return of stock.
  - Quick sale items (`GET /api/shop/quick-sale`).
  - Restock suggestions (`GET /api/shop/inventory/restock-suggestions`) calculating optimal replenishment levels.
  - Public products catalog (`GET /api/public/products`).
- Database migration `V7__shop_bar_hr_crm.sql` adding `is_quick_sale` flag.

### Phase H: Bar, Kitchen Display & Shifts
- `BarService` and `BarController` enhanced:
  - Real-time floor plan view (`GET /api/bar/floor`) with active orders, table statuses, and unserved kitchen item counters.
  - Station-specific Kitchen Display Screen (`GET /api/bar/kds?station=`).
  - Split bill computation (`GET /api/bar/orders/{id}/split?ways=N`) using `Money.allocate()` for fair distribution without rounding drift.
  - Cash shift management (`POST /api/bar/shifts/open`, `POST /api/bar/shifts/{id}/close`, `GET /api/bar/shifts/current`) tracking expected vs counted cash and variances.
  - Table transfer support (`POST /api/bar/tables/{id}/transfer`).

### Phase I: CRM & HR
- `CrmService` and `CrmController` enhanced:
  - Pipeline analytics (`GET /api/crm/pipeline`) reporting conversion rates and stage distributions.
  - Quotes management: `Quote` and `QuoteLine` entities and endpoints (`POST /api/crm/quotes`, `GET /api/crm/quotes`, status updates).
  - Overdue follow-up alerts (`GET /api/crm/follow-ups/overdue`).
- `HrService` and `HrController` enhanced:
  - Leave management: `LeaveType` and `LeaveRequest` entities with application, approval, and rejection workflows.
  - Shift roster scheduling (`ShiftSchedule` entity, `/api/hr/shifts`).
  - Automated payroll runs and payslip generation (`PayrollRun`, `Payslip`, `/api/hr/payroll/run`, `/api/hr/payroll/payslips`).
  - Daily attendance summary (`GET /api/hr/attendance/today-summary`).

### Phase J: In-app Notifications & Dashboard
- In-app notification engine with read/unread tracking and count queries (`NotificationService`).
- Dashboard statistics with operational KPIs, member counts, revenue rollups, bar sales, and occupancy metrics (`DashboardService`).
- Public club discovery endpoints (`/api/public/club`, `/api/public/plans`, `/api/public/availability`).

### Phase K: Scheduled Jobs, Recovery & Verification
- Background jobs active:
  - `BookingCompletionJob`: Auto-completes checked-in bookings and flags no-shows.
  - `HoldReaperJob`: Frees unconfirmed booking holds every 30s.
  - `RecurrenceExpanderJob`: Pre-populates social session templates 4 weeks in advance.
  - `MembershipStatusJob`: Hourly expiration and expiring-soon state transitions.
  - `StartupRebuilder`: `ApplicationRunner` rebuilding in-memory court-day bitmasks from database occupancy records at startup.
- Full test suite: 42 tests passing across all modules with 0 failures (`./mvnw.cmd test`).


