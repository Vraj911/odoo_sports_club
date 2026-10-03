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

## Verification

```powershell
cd backend
.\mvnw.cmd test
```

At the time of the latest audit, the suite contains 42 passing tests covering selected booking-engine, money/tax, pricing, payment, HR, CRM, bar, facility, membership, state and event behaviours.

## Known functional status

This backend has broad module coverage but is not production-complete. The maintained functional audit is the source of truth for verified gaps, including membership renewal/proration, pricing-engine inconsistency, stock initialization/reservation, payment/refund source reconciliation, booking/social caps, bar settlement, payroll calculations, CRM lifecycle and GST/accounting completion.

See [SRS backend audit](docs/SRS_BACKEND_AUDIT_2026-10-03.md).
