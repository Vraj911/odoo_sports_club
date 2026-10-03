# CCMS backend SRS compliance audit

**Audit date:** 2026-10-03  
**Verdict:** **No — the backend is not 100% compliant or production-ready.**

## Scope and evidence

- Reviewed the 328 Java production sources under `backend/src/main/java`, the seven Flyway migrations, configuration, controllers, service flows, and 16 test classes.
- Ran `backend/mvnw.cmd test`: **42 tests passed; 0 failed**.
- `srs.pdf` is a 34-page, predominantly raster/image PDF (5,673 JPEG image objects and no usable embedded text map). This prevents reliable automatic, requirement-by-requirement quotation. The coverage assessment therefore uses the SRS's module scope as reflected by the supplied project documentation, and marks requirements that require visual/manual SRS confirmation as **not proven**. It must not be represented as a signed-off requirements traceability review until a text-selectable SRS or a reviewed requirement list is provided.

Passing tests prove that the tested units behave as expected; they do **not** prove authorization, data isolation, database migration, real payment, or end-to-end compliance.

## Release-blocking loopholes

| Severity | Finding | Evidence | Impact / required correction |
|---|---|---|---|
| Critical | Every endpoint is publicly permitted. | `common/config/SecurityConfig.java:28` calls `anyRequest().permitAll()`; no controller has `@PreAuthorize`. | Any unauthenticated caller can view or alter members, payroll, invoices, payments, stock, club settings, and audit records. Implement JWT/session authentication and route/method role checks before release. |
| Critical | Identity and role are client-forgeable HTTP headers. | `common/actor/ActorFilter.java:26-47` trusts `X-Actor-Id`, `X-Actor-Role`, and `X-Actor-Name`. | A caller can claim ADMIN, approve leave, override bookings, write off dues, or create audit records. Derive actor and authorities only from verified authentication. |
| Critical | The idempotency filter consumes the request stream before Spring MVC binds it. | `common/idempotency/IdempotencyFilter.java:64-65` calls `wrappedRequest.getInputStream().readAllBytes()` then forwards the same wrapper at line 105. | POSTs using `Idempotency-Key` can reach controllers with an empty body, or behave inconsistently. Cache the body without consuming the downstream stream (or use a repeatable request wrapper). |
| High | Plain database credential is committed. | `src/main/resources/application.properties:6` contains `spring.datasource.password=root`. | Credential leakage and unsafe deployments. Remove it from source, rotate it, and inject a required secret at deployment. |
| High | Financial data can be changed by direct status changes, and payment recording is not a ledger posting. | `finance/service/FinanceService.java:123-129` accepts arbitrary invoice status; `:132-161` creates a `Payment` directly. Ledger tables exist only in `db/migration/V5__foundation_and_payments.sql:92-118`. | Invoice can be set PAID without money; there is no double-entry posting, reversal, period lock, or immutable audit trail. Remove arbitrary status mutation and post balanced, idempotent financial transactions. |
| High | Audit history is forgeable and incomplete. | `admin/controller/AdminController.java:111-115` exposes POST audit log; `admin/service/AdminService.java:219-235` accepts actor and details from request. | An attacker can fabricate audit evidence; normal mutations do not consistently call the shared audit service. Make audit writes internal-only and derive actor, request ID, before/after data server-side. |

## Required-module assessment

### Administration — partial, unsafe

Implemented: club profile, settings, holidays, opening hours, tax rates and audit-log tables/endpoints.

Gaps:

- No authorization boundary; all administration functions are public.
- `AdminService.updateOpeningHours` accepts JPA entities directly (`admin/service/AdminService.java:180-187`). This permits mass-assignment of persistence fields and does not validate all seven weekdays, unique weekdays, valid open/close times, or existing booking conflicts.
- `getProfile` silently creates an in-memory default but does not persist it (`:82-101`), so a missing profile is masked rather than repaired.
- Settings and audit actor IDs are client supplied. Tax rate effective-date overlaps and rate bounds are not enforced here.
- There is no proven change approval, configuration versioning, export/retention policy, or immutable audit trail.

### HR — partial; payroll is a demonstrator, not payroll

Implemented: employee records, attendance entries, leave requests/types, shifts, payroll run and payslip endpoints.

Gaps:

- Payroll ignores employee salary structure, attendance, approved leave, overtime, tax, deductions, statutory contributions, payment state and pay period. It applies a hard-coded `25000` gross and `1000` deduction to every active employee (`hr/service/HrService.java:257-260`).
- Re-running a month can create duplicate payslips: existing run is reused and fresh slips are appended (`:247-291`); the schema has no `(payroll_run_id, employee_id)` uniqueness constraint.
- Leave approval accepts arbitrary status and optional arbitrary approver (`:199-209`); no allowed-transition check, balance accrual/deduction, overlap check, holiday/weekend calculation, or shift conflict handling.
- Attendance allows invalid chronology (checkout before check-in), overwrite, future dates and an arbitrary approver; it does not derive employee identity from the caller (`:106-132`).
- Employee number uses `count()+1` (`:57`), which races under concurrent creates and can duplicate after deletions. Use a database sequence/unique constraint.
- `LocalDate.now()` at `:146` bypasses the configured club clock/timezone.
- No HR authorization or employee self-service data isolation exists.

### CRM — partial

Implemented: leads, follow-ups, pipeline aggregates, quotes and lead conversion.

Gaps:

- No phone/email normalization or duplicate-lead handling; `createLead` persists request values as-is (`crm/service/CrmService.java:52-71`).
- Lead number uses `System.currentTimeMillis()` (`:54`), which is collision-prone under concurrent requests and not a controlled sequence.
- Statuses are free strings (`:73-93`, `:259-266`), with no CRM state machine. A lead may be moved to arbitrary/invalid stages; quote status can be set after expiry.
- Lead conversion merely links an already-existing member (`:93-102`); it does not create/validate a member, prevent repeat conversion, record a conversion activity, or enforce a qualifying stage.
- Completing a follow-up does not recompute `lead.nextFollowUpAt` (`:143-157`), leaving stale reminders.
- There is no trial-booking endpoint/workflow or rate limit despite the pipeline counting `TRIAL_BOOKED`; no communication campaign/send, consent, assignment policy, activity log, or server-side reminder job is proven.
- All prospect PII and pipeline data are publicly readable and mutable.

### Invoicing, payments, and finance — partial; not accounting compliant

Implemented: draft invoice creation, line arithmetic, invoice payment records, expenses, manual/simulated payment and refund-related endpoints.

Gaps:

- Currency is hard-coded to INR (`finance/service/FinanceService.java:73`) rather than club/profile currency; dates use server-local `LocalDate.now()` (`:71-72`).
- Invoice line tax is only a single percentage. Although CGST/SGST/IGST columns are migrated, the service never populates them; no place-of-supply, GSTIN, HSN/SAC, taxable/inclusive tax policy, tax snapshot, or rounding allocation is applied.
- Draft/issued/void/paid/partial transitions are not guarded. `updateStatus` permits caller-chosen status (`:123-129`), and invoice dates/amounts lack period locking.
- No credit-note issuance, invoice cancellation/reversal, aging, dunning, reconciliation, accounting period lock, or legally immutable issued-invoice behavior is implemented.
- No application code writes `ledger_transaction`/`ledger_entry`; the comment “Record in payment ledger” at `:150` is misleading because only a `payment` row is written.
- Payment/refund/write-off authority is not role checked. Review the `PaymentService` against settlement semantics before using it for cash/card reconciliation.

## Other SRS-scope modules

| Module | Implemented evidence | Material gaps / conclusion |
|---|---|---|
| Auth/RBAC | Password hashing is present for optional member user creation. | No login authentication chain/JWT, no authorization, no ownership checks, header impersonation. **Not compliant.** |
| Booking/facilities | Booking engine, holds, availability, cancellation policy, blocks, social sessions and scheduled reaper classes exist. | Require database-backed concurrency/load tests and authorization checks. The SRS features cannot be signed off while anyone can invoke staff overrides and booking APIs. |
| Membership | Plans, memberships, member records and proration utilities exist. | Need end-to-end entitlement, renewal/payment, minor/guardian, digital-card token security and ownership tests before sign-off. |
| Shop/inventory | Products, variants, orders, stock movements, POS, restock suggestions and public catalogue exist. | Need concurrent reservation/checkout tests, staff permissions, supplier/purchase-order workflow and financial posting verification. |
| Bar/KDS | Bar orders, KDS/floor views, split calculation and cash shifts are represented. | No proven protected KDS/POS operation, end-of-day approval/reconciliation workflow, tab settlement posting, or authorization isolation. |
| Notifications/dashboard | In-app notifications, web socket configuration and dashboard metrics exist. | No verification of delivery guarantees, preferences/consent, retry/dead-letter behavior, access scoping, report export or data privacy. |

## Test and verification gaps

- The 42 tests include no HTTP security integration tests, no controller authorization tests, no PostgreSQL/Flyway integration run, no migration upgrade test, and no browser/API end-to-end scenarios.
- There are no tests for admin or invoice service behavior in `src/test/java`; HR and CRM each have only two service tests.
- No concurrent tests cover employee numbering, payroll re-run, invoice payment races, refund races, or permission bypass.
- Build output reports a deprecated API use in `common/error/ErrorCode.java`; resolve it before production maintenance becomes harder.

## Priority remediation order

1. Remove public access; implement verified authentication, role/permission policies and resource ownership checks. Delete header-derived identity.
2. Repair idempotency body handling; add API integration tests for each money/booking mutation.
3. Treat finance and HR payroll as non-production until state machines, audit, ledger posting, tax rules, period locks, refund/credit-note reversals and payroll calculations are implemented.
4. Add database constraints and transactional/concurrency tests for sequences, payroll uniqueness, leave/shift overlaps and accounting balances.
5. Build a numbered SRS traceability matrix (requirement ID -> endpoint/service/test -> evidence -> status) from a selectable-text SRS or user-approved manual transcription of its 34 pages.

## Final conclusion

The codebase contains a broad backend skeleton and several real business-flow implementations. It is **not 100% up to the SRS** and must not be deployed with financial, HR, CRM, or admin access enabled. The two critical identity/access defects alone allow complete system compromise; payroll and accounting are also functionally incomplete for real operational use.

---

## Functional-only addendum (security/auth excluded)

This addendum follows the requested scope: it ignores authorization and authentication defects and evaluates feature behaviour only.

### Functional verdict

**Still not 100% SRS-compliant.** The core booking flow is substantially implemented, but membership, pricing, payments, shop/POS, bar, social play, HR, CRM and invoicing contain concrete behaviours that give wrong results, lose a required workflow, or allow invalid business state.

| Priority | Functional defect | Evidence | Consequence |
|---|---|---|---|
| P0 | Membership renewal endpoint passes a *membership ID* to a method that searches for a *member ID*. | `membership/controller/MembershipController.java:101-103` calls `renew(id, null)`; `membership/service/MembershipService.java:118-120` calls `members.findById(memberId)`. | Normal renewal fails with “Member not found” unless a membership UUID accidentally equals a member UUID. |
| P0 | Membership plan change uses fabricated prices rather than plan prices. | `membership/service/MembershipService.java:175-176` hard-codes daily rates of 10 and 15. | Upgrade/downgrade proration is always wrong and cannot meet tier/proration requirements. |
| P0 | The public quote endpoint and booking creation use different pricing engines and matching rules. | `pricing/controller/PricingController.java:24-27` uses `PricingService`; `booking/service/BookingService.java:143` uses `PricingEngine`. `PricingService` also has hard-coded fallback rates at `:88-102`. | The customer can be quoted one amount and charged another. There must be one canonical pricing service and one persisted quote snapshot. |
| P0 | Shop initial stock is applied twice. | `shop/service/ShopService.java:113` sets `onHand` to `initialStock`, then `:120-128` creates a `RECEIPT` movement; migration `V1__hackathon_schema.sql` documents the stock-movement trigger as the stock updater. | A requested initial quantity of 10 becomes 20 when the database trigger is active. Use either the initial balance *or* the receipt movement, never both. |
| P0 | Shop checkout commits a sale immediately; it has no server-side 10-minute reservation lifecycle. | `shop/service/ShopService.java:137-219` checks availability and inserts `SALE` movements during order creation; no reservation expiry job/entity is used. | Abandoned cart/checkout flow does not match the required live reservation, and inventory is reduced before payment/collection. |
| P0 | Refunds do not reverse the paid source. | `payment/service/PaymentService.java:228-264` updates only payment/refund rows. | A refunded invoice remains paid, a refunded booking remains confirmed/paid, and a refunded membership remains active. Financial and operational state diverge. |
| P1 | Manual payment accepts arbitrary amount for a booking and can overpay an invoice. | `payment/service/PaymentService.java:152-221`; unlike `FinanceService.recordPayment`, there is no source amount/outstanding validation. | A partial or zero booking payment confirms the booking; an invoice can be overpaid. |
| P1 | Membership purchase/renewal/payment state is internally inconsistent. | Purchase records `pricePaid=0` (`membership/service/MembershipService.java:101-104`); renewal creates an active, paid, zero-price membership (`:142-149`); simulated membership payment falls back to 1500 and resets dates (`payment/service/PaymentService.java:116-131`). | Membership can be activated for free, charged an arbitrary default, or have its requested start date overwritten. |
| P1 | Booking cancellation calculates a refund but does not create/execute a refund. | `booking/service/BookingService.java:316-361` only publishes the calculated refund amount in an event. | Cancellation appears to have refund policy support but no money is returned or credited. |
| P1 | Booking and social sessions do not share the member's daily-cap calculation. | Booking counts bookings only (`booking/service/BookingService.java:181-186`); social join counts social sessions only (`social/service/SocialService.java:177-181`). | A member can exceed a stated total daily booking allowance by booking both a court and social play. |
| P1 | Rescheduling does not reconcile price/payment/due state and marks a pending booking as booked in memory. | `booking/service/BookingService.java:405-426` updates price/occupancy only; `:430` always calls `occupyBooked`. | Changed price is neither collected nor refunded; a pending hold has the wrong calendar channel. |
| P1 | Social waitlist departure can overfill a session. | `social/service/SocialService.java:224-244` promotes after cancelling any participant, including a waitlisted one. | Cancelling a waitlisted participant may promote another despite no registered seat having opened. |
| P1 | Social participant/member validation is incomplete. | `social/service/SocialService.java:170-208` locks/checks the supplied member ID but persists it only if found; `:429-432` passes null for a guest cancellation. | Unknown member IDs can become guest entries; guest cancellation cannot reliably locate the participant. |
| P1 | Bar “PAID” status does not settle or record payment; cash shifts cannot reliably reconcile bar takings. | `bar/service/BarService.java:199-210` only changes order/table status; cash-shift close totals payments linked to `cashShiftId` at `:310-315`. | A paid bar order can have no payment, and expected cash excludes those orders. |
| P1 | Bar table transfer does not reject a destination with another active order. | `bar/service/BarService.java:338-355`. | Two open orders can occupy one table and the floor plan picks an arbitrary first order. |
| P1 | HR payroll is fixed-value, repeatable and not calculated from employment data. | `hr/service/HrService.java:257-273` sets every employee to 25,000 gross / 1,000 deduction; `:247-291` can append payslips to an existing month. | Payroll totals and payslips are not usable; repeat runs can duplicate payroll. |
| P1 | Leave and attendance are unvalidated free-state records. | `hr/service/HrService.java:106-132`, `:168-209`. | Invalid check-out times, overlapping leave, invalid status, leave balance overrun and repeated approvals are possible. |
| P1 | CRM lacks workflow enforcement and completed follow-ups leave stale next-follow-up dates. | `crm/service/CrmService.java:73-93`, `:143-157`, `:259-266`. | Pipeline/reporting and reminders become inaccurate; arbitrary stage/status values are persisted. |
| P1 | Invoice lifecycle, tax treatment and accounting artefacts are incomplete. | `finance/service/FinanceService.java:73-161`; CGST/SGST/IGST schema exists in `V5` but is never populated. | No compliant GST split, credit note, reversal, ageing or period-close behaviour can be demonstrated. |

### Functional gaps by module

- **Admin:** opening hours are updated by accepting persistence entities directly, without a complete-week, time-range, duplicate-day or booking-conflict validation (`admin/service/AdminService.java:180-187`). Tax effective-date collisions are not prevented. Club profile defaults are returned but not persisted when absent (`:82-101`).
- **Facilities/booking:** `BookingService.create` forces every booking to exactly 60 minutes (`booking/service/BookingService.java:106-107`) rather than using court duration/interval settings. It also does not reject a non-existent `memberId` before persisting a guest-like booking (`:239-242`). Cancellation/refund and reschedule payment reconciliation are missing as above.
- **Membership:** activation/renewal/change-plan require a single source of price, date and payment truth. The change-plan path also creates an active membership without explicitly setting payment state (`membership/service/MembershipService.java:183-191`).
- **Pricing:** remove the legacy `PricingService` fallback calculation and make both `/api/pricing/quote` and booking consume `PricingEngine`. Pricing rule changes must trigger/reliably await table rebuild before new quotes.
- **Shop:** there is no purchase-order/supplier/vendor-bill workflow in the service layer. Status changes accept free strings (`shop/service/ShopService.java:223-229`), and cancellation always returns stock even if it was never a fulfilled/paid sale (`:301-324`).
- **Bar:** menu availability is not checked while adding an order (`bar/service/BarService.java:145-190`); kitchen and order statuses are unconstrained strings. No bar inventory consumption is linked to menu sales.
- **Social:** deleting a session frees court occupancy but does not cancel/notify participants, settle any payment, or resolve waitlist entries (`social/service/SocialService.java:246-273`). Template expansion swallows all exceptions (`:298-300`), which hides failed recurring sessions.
- **CRM:** lead numbers use the current millisecond (`crm/service/CrmService.java:54`), so high-concurrency creation can collide. Conversion only links an existing member and does not verify it has not already been converted (`:93-102`).
- **HR:** employee numbers use `count()+1` (`hr/service/HrService.java:57`), allowing duplicates after deletion or concurrent creation. Dates use the server-local clock at `:147` and payroll finalization uses `OffsetDateTime.now()` at `:285` rather than the club clock.
- **Notifications/dashboard:** non-IN_APP notifications are marked delivered immediately without a provider attempt (`notification/service/NotificationService.java:61-70`). Dashboard figures therefore should not be treated as reconciled financial reports.

### Functional remediation order

1. Fix membership renewal ID mapping, unify pricing, eliminate hard-coded membership/payment amounts, and add regression tests.
2. Make payment/refund/cancellation/reschedule source-of-truth transactions: validate outstanding amounts, prevent duplicate settlement, and reverse source state correctly.
3. Correct stock initialization and implement reservation/expiry before checkout; protect all order/bar/CRM/HR state transitions with explicit enums/state machines.
4. Repair social cap/waitlist logic and participant lifecycle; link bar settlement to payments/cash shifts.
5. Replace demonstrator HR payroll with salary-structure, attendance and approved-leave calculation; make payroll runs idempotent with a unique `(run, employee)` constraint.
6. Add integration tests for each defect above, including PostgreSQL stock-trigger tests and end-to-end quote-to-payment-to-refund flows.
