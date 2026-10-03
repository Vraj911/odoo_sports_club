# BookMyCourt Backend Gap Report & Architecture Audit
**Audit Date:** 2026-10-03  
**Status:** PHASE A Complete  
**JDK Version:** 17/21 compatible (Target JDK 17 in POM, JDK 21 runtime ready)  
**Spring Boot:** 4.1.1 (Spring Boot 4.x Starter Parent)  
**Database:** PostgreSQL 18 with Flyway 12 (`V1__hackathon_schema.sql`, `V2__seed_booking_demo_data.sql`, `V3__align_club_profile_currency.sql`, `V4__align_invoice_currency.sql`)

---

## 1. Executive Summary

An exhaustive audit of the `backend/` repository reveals that while basic CRUD controllers, entities, repositories, and DTOs exist across 14 modules, the business logic, state machines, concurrency guards, double-entry financial ledger, internal payment provider, idempotency, event pub/sub pipeline, and scheduled recovery systems are missing or only exist in bare MVP/placeholder form.

The current code compiles cleanly (`BUILD SUCCESS`, 210 source files) and 4 existing tests pass. However, existing services perform direct database CRUD without concurrency locking (`Guard.run`), domain events, or double-entry postings.

---

## 2. Code Inventory

| Module | Entities | Repositories | Services (Line Count) | Controllers | DTOs / Mappers | Tests | Real vs Placeholder |
|---|---|---|---|---|---|---|---|
| `admin` | 5 (`ClubProfile`, `ClubSetting`, `ClubHoliday`, `TaxRate`, `AuditLog`) | 5 | `AdminService` (162), `ClubQueryService` (35) | `AdminController` (79), `ClubController` (19) | 12 DTOs, 1 Mapper | 0 | Basic CRUD only; no dynamic opening hours or cache rebuilders |
| `bar` | 4 (`BarOrder`, `BarOrderLine`, `BarTable`, `MenuItem`) | 4 | `BarService` (204) | `BarController` (82) | 10 DTOs, 1 Mapper | 0 | Basic CRUD; no `bar_tab`, no KDS push, no cash shift, no closing gate |
| `booking` | 1 (`Booking`) | 1 (`BookingRepository`, 91 lines) | `BookingService` (149) | `BookingController` (63) | 5 DTOs, 1 Mapper | 2 (`BookingEngineTest`, `InMemoryBookingStore`) | MVP engine in `booking/engine/`; missing blocks, 4-mask calendar, waitlist listener, reschedule |
| `common` | 1 (`BaseEntity`) | 0 | 0 | 0 | `ApiResponse`, `ApiError`, `GlobalExceptionHandler`, `SportMapper`, `SecurityConfig` | 1 (`BookMyCourtApplicationTests`) | Missing `Money`, `ActorContext`, `LockTable/Guard`, `DomainEvent`, `StateMachine` |
| `crm` | 2 (`Lead`, `FollowUp`) | 2 | `CrmService` (143) | `CrmController` (73) | 8 DTOs, 1 Mapper | 0 | CRUD only; missing normalization, quotes, trial booking rate limiter |
| `dashboard` | 0 | 0 | `DashboardService` (102) | `DashboardController` (19) | 1 DTO | 0 | Ad-hoc SQL/repo queries; missing rollups, exports, share links |
| `facility` | 1 (`Court`) | 1 | `CourtService` (32) | `CourtController` (27) | 1 DTO, 1 Mapper | 0 | Minimal CRUD; missing slot grid and public availability |
| `finance` | 2 (`Invoice`, `InvoiceLine`) | 2 | `FinanceService` (180) | `FinanceController` (66) | 1 DTO | 0 | Simple invoice CRUD; missing double-entry ledger, numbering series, credit notes, aging |
| `hr` | 2 (`Employee`, `Attendance`) | 2 | `HrService` (111) | `HrController` (60) | 5 DTOs, 1 Mapper | 0 | Simple check-in; missing shift templates, leave balances, payroll calculation |
| `membership`| 4 (`Member`, `AppUser`, `Plan`, `Membership`) | 4 | `MembershipService` (193) | `MembershipController` (75) | 9 DTOs, 1 Mapper | 0 | Basic CRUD; missing proration, minor guardian validation, tier resolution, timeline |
| `notification`| 2 (`Notification`, `NotificationDelivery`) | 2 | `NotificationService` (90) | `NotificationController` (52) | 2 DTOs, 1 Mapper | 0 | Table saver only; `NotificationProvider` is empty interface; no mail, no templates |
| `payment` | 1 (`Payment`) | 1 | `PaymentService` (98) | `PaymentController` (48) | 3 DTOs, 1 Mapper | 0 | Mock CRUD; `PaymentProvider` is empty; missing simulated provider, refunds, dues, split tender |
| `pricing` | 1 (`PricingRule`) | 1 | `PricingService` (103) | `PricingController` (26) | 2 DTOs | 0 | Simple query; missing candidate scoring table, ambiguity validator, snapshot/repricing |
| `shop` | 5 (`Product`, `ProductVariant`, `ShopOrder`, `ShopOrderLine`, `StockMovement`) | 5 | `ShopService` (236) | `ShopController` (79) | 10 DTOs, 1 Mapper | 0 | CRUD; missing stock reservations under lock, quick sale, purchase orders |
| `social` | 3 (`SocialSession`, `SocialParticipant`, `Waitlist`) | 3 | `SocialService` (161) | `SocialController` (65) | 6 DTOs, 1 Mapper | 0 | CRUD; missing lock keys, capacity promo pipeline, recurring template expander |

**Total:** 34 `@Entity` classes, 33 JPA repositories, 14 service classes, 13 controllers, 4 tests.

---

## 3. Schema & Database Inventory

### 3.1 Migration History
1. `V1__hackathon_schema.sql` (35 tables, 2 views `v_member_summary`, `v_inventory_summary`, triggers `apply_stock_movement`, `set_updated_at`).
2. `V2__seed_booking_demo_data.sql` (Demo seeds for plans and courts).
3. `V3__align_club_profile_currency.sql` (`currency VARCHAR(3)`).
4. `V4__align_invoice_currency.sql` (`currency VARCHAR(3)`).

*Notice:* Any new additive migration must start at `V5__...`.

### 3.2 35 Tables in V1 Schema
1. `app_user` (roles: `ADMIN, MANAGER, FRONT_DESK, BAR_STAFF, SHOP_STAFF, MEMBER`)
2. `member` (`member_code`, `qr_token`, `dob`, `guardian_name`, `guardian_phone`, etc.)
3. `plan` (`validity_days`, `advance_booking_days`, `max_bookings_per_day`, discount percentages)
4. `membership` (`start_date`, `end_date`, `status`, `price_paid`)
5. `court` (`sport`, `indoor_outdoor`, `slot_duration_minutes`, `slot_interval_minutes`)
6. `pricing_rule` (`customer_type`, `day_type`, `time_start`, `time_end`, `price`)
7. `booking` (`start_time`, `end_time`, `expires_at`, `status`, `payment_status`, `price`)
8. `social_session` (`court_id`, `start_time`, `end_time`, `capacity`, `price_per_person`)
9. `social_participant` (`session_id`, `member_id`, `status`)
10. `waitlist` (`court_id`, `desired_date`, `desired_slot`, `status`)
11. `occupancy` (`court_id`, `booking_id`, `session_id`, `occupancy_type`, `occupied_period`, `status`)
12. `product` (`name`, `category`, `description`)
13. `product_variant` (`sku`, `price`, `on_hand`, `reserved`, `reorder_level`)
14. `shop_order` (`member_id`, `status`, `total_amount`)
15. `shop_order_line` (`order_id`, `product_variant_id`, `quantity`, `unit_price`)
16. `stock_movement` (`product_variant_id`, `movement_type`, `quantity`, `reference_type`)
17. `menu_item` (`name`, `category`, `price`, `available`, `tax_rate_percent`)
18. `bar_table` (`table_number`, `status`, `capacity`)
19. `bar_order` (`table_id`, `member_id`, `status`, `total_amount`)
20. `bar_order_line` (`order_id`, `menu_item_id`, `quantity`, `unit_price`, `kitchen_status`)
21. `invoice` (`invoice_number`, `member_id`, `total_amount`, `status`)
22. `invoice_line` (`invoice_id`, `description`, `quantity`, `unit_price`, `tax_amount`)
23. `payment` (`amount`, `method`, `status`, `gateway_transaction_id`)
24. `expense` (`category`, `amount`, `payment_method`, `spent_at`)
25. `lead` (`name`, `phone`, `email`, `source`, `status`)
26. `follow_up` (`lead_id`, `scheduled_at`, `status`, `notes`)
27. `employee` (`name`, `department`, `role`, `status`)
28. `attendance` (`employee_id`, `work_date`, `clock_in`, `clock_out`, `status`)
29. `notification` (`user_id`, `title`, `message`, `type`)
30. `notification_delivery` (`notification_id`, `channel`, `status`)
31. `club_profile` (`name`, `address`, `phone`, `currency`)
32. `club_setting` (`key`, `value`)
33. `club_holiday` (`date`, `description`)
34. `tax_rate` (`name`, `rate_percent`)
35. `audit_log` (`actor_user_id`, `action`, `entity_type`, `entity_id`, `details`)

### 3.3 Triggers & Database Logic
- `apply_stock_movement()`: Trigger function on `stock_movement` table. Handles `RECEIPT`, `RETURN`, `ADJUSTMENT_IN`, `SALE`, `ADJUSTMENT_OUT`, `DAMAGE`, and crucially `RESERVATION` and `RESERVATION_RELEASE`. Directly adjusts `on_hand` and `reserved` on `product_variant`.
- `set_updated_at()`: Trigger function updating `updated_at = CURRENT_TIMESTAMP` attached to 14 tables.

---

## 4. Booking Engine Audit

- `booking/engine/BookingEngine.java` implements MVP 48-bit slot mask mechanics and single-calendar occupancy.
- **Defects / Gaps Identified in Existing Engine:**
  1. Calls `OffsetDateTime.now()` and `ZonedDateTime.now(IST)` directly instead of injected `Clock`.
  2. Calendar maintains only a single `occupied` mask; does not track the required four masks (`booked`, `held`, `social`, `blocked`).
  3. `LockTable` is local to `booking/engine`, not shared in `common/concurrency`.
  4. Concurrency lock releases before JPA transaction commits (missing `Guard` 3-phase execution: DECIDE -> PERSIST in transaction -> APPLY in memory).
  5. Missing waitlist automatic offer pipeline on `SlotReleased`.
  6. Missing court block maintenance checks and force-cancelation refunds.

---

## 5. Interface & Configuration Verification

- `PaymentProvider`: Empty interface in `payment.provider`. No implementations.
- `NotificationProvider`: Empty interface in `notification.provider`. No implementations.
- `application.properties`:
  - Missing virtual threads configuration (`spring.threads.virtual.enabled=true`).
  - Missing mail properties (`spring.mail.*`).
  - Missing `@EnableScheduling` and `@EnableAsync`.
  - Missing WebSocket STOMP broker setup.
  - Missing club behavioral settings (`booking.default-daily-cap`, `payments.simulated-online`, etc.).

---

## 6. Build & Test Verification

- `.\mvnw.cmd compile`: BUILD SUCCESS (210 source files, 0 warnings/errors).
- `.\mvnw.cmd test`: BUILD SUCCESS (4 tests run: `BookingEngineTest` [3 tests], `BookMyCourtApplicationTests` [1 test], 0 failures).

---

## 7. Requirement & Schema Gap Analysis (Tables to Add in V5+)

To fully satisfy the Master Implementation Prompt without modifying existing V1-V4 migrations, the following must be introduced in additive migrations (`V5__...`):

1. **Foundation & Payments:**
   - Extend `app_user.role` to include `KITCHEN`, `ACCOUNTANT`.
   - Add `idempotency_record` table.
   - Add `number_series` table for gapless numbering (`INV/2026-27/...`, `BMC-0001`).
   - Add `payment_intent`, `payment_due`, `refund`.
   - Add double-entry ledger: `ledger_transaction` and `ledger_entry`.
   - Add `business_client`, `daily_rollup`, `reminder_log`, `share_link`, `file_object`, `club_opening_hours`.
   - Alter `payment` table: add `source_type`, `source_id`, `reference`, `simulated`, `received_by`, `tendered`, `change_given`, `refunded_total`.

2. **Booking Completion:**
   - Alter `booking`: add `price_breakdown`, `payment_policy`, `cancel_reason`, `cancelled_at`, `version`.
   - Add `social_template`. Alter `social_session` and `social_participant`.

3. **Shop & Bar:**
   - Add `stock_reservation`, `supplier`, `purchase_order`, `purchase_order_line`, `vendor_bill`, `vendor_bill_payment`.
   - Add `bar_tab`, `cash_shift`, `bar_day_closing`, `reconciliation_report`.

4. **CRM, HR & Notification:**
   - Add `lead_activity`, `quote`, `quote_line`.
   - Add `leave_type`, `leave_balance`, `leave_request`, `shift_template`, `shift_assignment`, `payroll_run`, `payslip`.
   - Add `notification_preference`.

---

## 8. Ordered Execution Roadmap

- **Phase B: Foundation Core** (`common/time`, `common/money`, `common/actor`, `common/concurrency`, `common/event`, `common/state`, `common/idempotency`, `common/audit`, `common/config`, Migration `V5__foundation_and_payments.sql`).
- **Phase C: Admin, Facility & Calendar** (`ClubCalendarService`, `SlotValidator`, court availability endpoints).
- **Phase D: Pricing Engine & Membership** (`PricingTable`, `PricingRuleValidator`, `MemberService`, `MembershipService`, proration, jobs).
- **Phase E: Booking Engine Completion** (`Guard` refactor, 4-mask calendar, alternatives, social sessions, court blocks, waitlist listener).
- **Phase F: Payment, Ledger & Invoicing** (`SimulatedPaymentProvider`, `PaymentService`, dues, refunds, `LedgerRules`, `InvoiceService`, GST reporting).
- **Phase G: Shop & Inventory** (`StockService` under lock, reservations, counter POS, POs, reaper job).
- **Phase H: Bar, Kitchen Display & Shifts** (`BarDayGate`, tabs, KDS push, split billing, Z-report, cash shift).
- **Phase I: CRM & HR** (Lead pipeline, quotes, attendance, leave balance, payroll calculator).
- **Phase J: Notifications, Realtime & Dashboard** (Pub/sub router, JavaMail provider, templates, WebSocket push, rollups, share links, files, PDFs).
- **Phase K: Scheduled Jobs, Recovery & Verification** (`JobRunner`, all 17 scheduled jobs, `StartupRebuilder`, `InvariantChecker`, Dev data seeder, comprehensive test suite).
