# CCMS Frontend · Champions Club Management System

> High-performance React 19 + TypeScript + Vite frontend client for the Champions Club sports club platform, fully integrated with Spring Boot (Port `8081`) and PostgreSQL (Port `5432`).

---

## 🏛️ Architecture & Database Connectivity

The frontend client communicates with the Spring Boot backend (`http://localhost:8081`) through a unified Axios client (`src/lib/axios.ts`).
- **Actor Context**: Every request automatically includes `X-Actor-Id` and `X-Actor-Role` headers.
- **Data Persistence**: All operations (bookings, memberships, shop purchases, bar tabs, CRM leads, and financial entries) are processed by Spring Boot services and stored directly in PostgreSQL database tables.
- **Dual-Tier Resiliency**: When online, the UI queries and mutates live database state. When testing without backend seed data, integrated reactive stores provide clean fallbacks so every calculation and flow operates smoothly.

```
┌─────────────────────────────────┐
│     Frontend UI (React/Vite)    │
│  Member Portal & Staff Consoles │
└────────────────┬────────────────┘
                 │ HTTP REST /api/* (Port 8082 -> 8081)
                 ▼
┌─────────────────────────────────┐
│   Spring Boot Backend (8081)    │
│ Controllers, Services & Engine  │
└────────────────┬────────────────┘
                 │ JDBC / JPA
                 ▼
┌─────────────────────────────────┐
│     PostgreSQL Database (5432)  │
│  Tables, Constraints & Ledgers  │
└─────────────────────────────────┘
```

---

## 🔒 Access Control & Role Model

The application strictly implements **2 Primary Roles** (Admin & Owner features have been completely removed):

- **`MEMBER`**:
  - Access to public marketing pages (`/*`).
  - Access to the authenticated Member Portal (`/app/*`).
- **`STAFF`**:
  - Access to the centralized Staff Hub (`/staff`) and personal staff workspace (`/my/*`).
  - Access to functional consoles governed by permission groups:
    - **`FRONT_DESK`** (`/desk/*`): Reception, check-ins, walk-in reservations, member directory.
    - **`POS_BAR`** (`/bar/*`, `/kds`): Table layouts, bar tabs, kitchen display tickets, shift closings.
    - **`SHOP_INVENTORY`** (`/shop-console/*`): Point of sale, purchase orders, restock, restringing jobs.
    - **`CRM`** (`/crm/*`): Customer acquisition pipeline, lead timelines, quotes, campaigns.
    - **`FINANCE`** (`/finance/*`): Tax invoices, payment logs, expenses, vendor bills, GST, period locks.
    - **`HR`** (`/hr/*`): Employees directory, shift rosters, attendance logs, leave management, payroll.

---

## 📋 Comprehensive Feature Inventory & DB Mapping

### 1. Public & Guest Discovery
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Club Landing Page** | `/` | Hero section, animated stats, facilities highlight, instant booking launch | `GET /api/club/profile` &rarr; `club_profile` |
| **Facilities Showcase** | `/facilities` | Photo gallery and court specifications across 6 sports | `GET /api/courts` &rarr; `court` |
| **Membership Plans** | `/plans` | Pricing tiers (Silver, Gold, Platinum, Junior) with perk comparisons | `GET /api/memberships/plans` &rarr; `membership_plan` |
| **Availability Calendar** | `/availability` | Live multi-sport 7-day court schedule matrix | `GET /api/courts/availability` &rarr; `booking`, `court_block` |
| **Trial Booking** | `/trial` | First-time trial booking wizard with coaching selection | `POST /api/crm/leads` &rarr; `lead`, `follow_up` |
| **Contact Us** | `/contact` | Inquiry form, operating hours, and location information | `POST /api/crm/leads` &rarr; `lead` |

### 2. Authentication & Onboarding
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Sign In** | `/login` | Dual role login (Member / Staff) with staff terminal launcher | `POST /api/members/login` &rarr; `app_user`, `member` |
| **Create Account** | `/register` | Member signup with phone/email validation and tier assignment | `POST /api/members/register` &rarr; `app_user`, `member`, `membership` |
| **Password Recovery** | `/forgot-password` | SMS/Email OTP password recovery request flow | `POST /api/members/forgot-password` &rarr; `notification` |
| **Password Reset** | `/reset-password` | Token verification and new password creation | `POST /api/members/reset-password` &rarr; `app_user` |

### 3. Member Experience Portal (`/app/*`)
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Member Dashboard** | `/app` | Greeting, dynamic tier badge, active bookings, open bar tab | `GET /api/dashboard/member` &rarr; `member`, `booking` |
| **Court Booking & Hold** | `/app/book` | 30-min slot selection, peak/off-peak pricing, 5-min slot hold timer | `POST /api/bookings/hold`, `/confirm` &rarr; `booking` |
| **Social Play Sessions** | `/app/social` | Matchmaking sessions with manual slot allocation and waitlist | `GET /api/social/sessions`, `POST /rsvp` &rarr; `social_session` |
| **My Bookings History** | `/app/bookings` | Active & past reservations with filter and status indicators | `GET /api/bookings/my` &rarr; `booking` |
| **Booking Detail & Cancel** | `/app/bookings/:id` | Court gate PIN, cancellation policy refund preview | `DELETE /api/bookings/{id}` &rarr; `booking`, `refund` |
| **Digital Member Card** | `/app/card` | QR check-in card, membership number, validity date | `GET /api/members/{id}/card` &rarr; `member`, `membership` |
| **Member Bar Tab** | `/app/tab` | Active drinks and snacks balance with instant bill request | `GET /api/bar/tabs/member/{id}` &rarr; `bar_tab`, `bar_order` |
| **Invoices & Receipts** | `/app/invoices` | Member invoices, payment history, and printable receipts | `GET /api/invoices/my` &rarr; `invoice`, `payment` |
| **Member Profile** | `/app/profile` | Personal contact details, emergency contact, skill ratings | `PUT /api/members/{id}` &rarr; `app_user`, `member` |

### 4. Front Desk Operations (`/desk/*`)
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Desk Overview** | `/desk` | Real-time occupancy counters, check-in activity, court timeline | `GET /api/dashboard/desk` &rarr; `booking`, `attendance` |
| **Walk-In Booking** | `/desk/walk-in` | Direct reservation grid with cash/card/UPI checkout | `POST /api/bookings` &rarr; `booking`, `payment` |
| **Check-In Scanner** | `/desk/checkin` | QR code camera scanner and manual member ID check-in | `POST /api/attendance/check-in` &rarr; `attendance` |
| **Register Member** | `/desk/register` | In-person member registration with instant plan enrollment | `POST /api/members/register` &rarr; `member`, `membership` |
| **Desk Availability** | `/desk/availability` | 7-day court schedule grid with slot status indicators | `GET /api/courts/availability` &rarr; `booking`, `court` |
| **Desk Payments** | `/desk/payments` | Record payments for walk-ins, memberships, and court dues | `POST /api/payments` &rarr; `payment`, `invoice` |

### 5. Pro Shop & Retail Operations (`/shop`, `/cart`, `/checkout`, `/shop-console/*`)
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Public Pro Shop Catalog** | `/shop` | 47 database-backed products across 8 categories with live brand filters, price sliders, in-stock toggles | `GET /api/public/products` &rarr; `product`, `product_variant` |
| **Product Detail & Variants** | `/shop/:slug` | Multi-axis variant chooser (grip size, weight, color), real-time available stock calculator | `GET /api/shop/products/{id}` &rarr; `product_variant` |
| **Cart & Hold Timer** | `/cart` | 10-minute hold reservation timers, member tier discount calculations (Gold 15%, Silver 8%, Junior 10%) | In-memory hold synchronized with `stock_movement` |
| **Checkout & Pickup Pass** | `/checkout` | Online checkout supporting Pickup or Delivery, automated tier discounts, creates live `shop_order` and decrements stock in PostgreSQL | `POST /api/shop/orders` &rarr; `shop_order`, `shop_order_line`, `stock_movement` |
| **Point of Sale Terminal** | `/shop-console` | Full retail terminal with 3-tab multi-cart sessions, barcode/SKU search, member lookup, split payments | `POST /api/shop/pos/checkout` &rarr; `shop_order`, `payment`, `stock_movement` |
| **Quick-Sale Consumables** | `/shop-console/quick` | 31 instant one-tap quick pins for grips, balls, strings, and towels | `GET /api/shop/quick-sale`, `POST /api/shop/pos/checkout` &rarr; `product_variant` |
| **Live Inventory Matrix** | `/shop-console/inventory` | Real-time on-hand, reserved, and available stock matrix across 68 variants, manual adjustment ledger | `GET /api/shop/products`, `POST /api/shop/inventory/movement` &rarr; `product_variant`, `stock_movement` |
| **Orders Dispatch Queue** | `/shop-console/orders` | Kanban & list order lifecycle manager (`PLACED` &rarr; `PACKED` &rarr; `READY_FOR_PICKUP` &rarr; `COLLECTED`) | `GET /api/shop/orders`, `PATCH /api/shop/orders/{id}/status` &rarr; `shop_order` |
| **Purchase Orders & Restock** | `/shop-console/purchase-orders`, `/shop-console/restock` | Low-stock alerts, automated restock suggestions, supplier purchase orders | `GET /api/shop/inventory/restock-suggestions` &rarr; `product_variant` |
| **Customer Returns** | `/shop-console/returns` | Order returns with item inspection (`RESTOCK` vs `WRITE_OFF`) and credit note generation | `POST /api/shop/inventory/movement` &rarr; `stock_movement` |
| **Restringing Workshop** | `/shop-console/restring` | Racket restringing tracker: tension, string type, due time, one-tap POS billing | `service_job` |
| **Sales Reports** | `/shop-console/reports` | Daily revenue, best-selling SKUs, category breakdown, and stock velocity analytics | `GET /api/shop/orders` &rarr; `shop_order` |

### 6. Courtside Bar, POS & Lounge (`/bar/*`, `/kds`)
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Bar Floor View** | `/bar` | Interactive table floor plan showing table availability and totals | `GET /api/bar/tables` &rarr; `bar_table`, `bar_order` |
| **Table Ordering** | `/bar/table/:id` | Categorized food & beverage menu with modifiers and kitchen notes | `POST /api/bar/orders` &rarr; `bar_order`, `bar_order_line` |
| **Open Tabs** | `/bar/tabs` | Lounge bar tabs linked to active members and table groups | `POST /api/bar/tabs` &rarr; `bar_tab` |
| **Bill Settlement** | `/bar/bill/:id` | Bill splitting, GST tax calculation, payment collection | `POST /api/bar/bills/close` &rarr; `bar_payment`, `invoice` |
| **Kitchen Display (KDS)** | `/kds` | Live order tickets for bar and kitchen staff with cooking timers | `PUT /api/bar/orders/{id}/status` &rarr; `bar_order` |
| **Daily Shift Closing** | `/bar/closing` | Cash drawer reconciliation and Z-Report closing summary | `POST /api/bar/shifts/close` &rarr; `cash_shift` |

### 7. Member CRM & Acquisition (`/crm/*`)
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **CRM Dashboard** | `/crm` | Funnel metrics, conversion rates, and pending follow-ups | `GET /api/crm/stats` &rarr; `lead` |
| **Leads Kanban** | `/crm/leads` | Drag-and-drop lead stages: New, Contacted, Trial, Won, Lost | `GET /api/crm/leads` &rarr; `lead` |
| **Lead Detail & Activity** | `/crm/leads/:id` | Interaction history: calls, emails, trials, notes timeline | `POST /api/crm/leads/{id}/activity` &rarr; `follow_up` |
| **Quotation Builder** | `/crm/leads/:id/quote` | Customized packages with plan, locker, coaching discounts | `POST /api/crm/quotes` &rarr; `quote` |
| **Campaigns** | `/crm/campaigns` | Promotional outreach for summer camps and seasonal tournaments | `POST /api/crm/campaigns` &rarr; `campaign` |

### 8. Finance & Ledgers (`/finance/*`)
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Finance Overview** | `/finance` | Real-time cash balance, unpaid invoices, revenue sparklines | `GET /api/finance/kpi` &rarr; `ledger_transaction` |
| **Invoices Ledger** | `/finance/invoices` | Searchable tax invoices with status pills and printable PDF | `GET /api/invoices` &rarr; `invoice` |
| **Invoice Detail & Void** | `/finance/invoices/:id` | Paper invoice view, credit notes, and void cancellation | `POST /api/invoices/{id}/void` &rarr; `invoice`, `credit_note` |
| **Payment Transactions** | `/finance/payments` | Completed payments across Stripe, UPI, cash, and refunds | `GET /api/payments` &rarr; `payment` |
| **Expenses Tracker** | `/finance/expenses` | Club operating expenses: equipment, utility bills, maintenance | `POST /api/finance/expenses` &rarr; `expense` |
| **Vendor Bills** | `/finance/vendor-bills` | Accounts payable to sports gear suppliers and facility vendors | `POST /api/finance/vendor-bills` &rarr; `vendor_bill` |
| **GST Returns (GSTR-1)** | `/finance/gst` | B2B and B2C invoice schedules with CGST and SGST totals | `GET /api/finance/gst` &rarr; `invoice` |
| **Profit & Loss Statement** | `/finance/pnl` | Monthly income and expenditure breakdown with gross margin | `GET /api/finance/pnl` &rarr; `ledger_transaction` |
| **Cash Drawer Sign-off** | `/finance/reconciliation`| Shift sign-offs and gateway settlement reconciliation | `POST /api/finance/reconcile` &rarr; `cash_shift` |
| **Financial Period Lock** | `/finance/periods` | Accounting lock preventing retroactive edits after month-end | `POST /api/finance/periods/close` &rarr; `financial_period` |

### 9. Staff Hub & HR Portal (`/staff`, `/my/*`, `/hr/*`)
| Feature | URL | Description | Backend API & DB Table |
|---|---|---|---|
| **Staff Hub** | `/staff` | Quick launchers to all assigned staff operational terminals | `GET /api/hr/me` &rarr; `employee` |
| **Time Clock** | `/my/clock` | Shift clock-in / clock-out with elapsed time counter | `POST /api/hr/attendance/clock` &rarr; `attendance` |
| **Personal Roster** | `/my/roster` | Weekly assigned shifts and station duties | `GET /api/hr/roster/me` &rarr; `roster_shift` |
| **Leave Applications** | `/my/leave` | Leave balance tracker and time-off submission form | `POST /api/hr/leave` &rarr; `leave_request` |
| **My Payslips** | `/my/payslips` | Monthly earnings, deductions, and downloadable PDF payslips | `GET /api/hr/payslips/me` &rarr; `payroll_item` |
| **Employees Directory** | `/hr/employees` | Staff roster with employment status, roles, and contacts | `GET /api/hr/employees` &rarr; `employee`, `app_user` |
| **Monthly Payroll Run** | `/hr/payroll` | Automated payroll calculation with deductions and pay preview | `POST /api/hr/payroll/run` &rarr; `payroll_run` |
| **Club Holidays** | `/hr/holidays` | Club operational holidays and scheduled facility closures | `GET /api/club/holidays` &rarr; `club_holiday` |

---

## ⏱️ Minute-by-Minute Step-by-Step Testing Guide

Use this hands-on test sequence to verify every feature from end to end:

### ⏱️ Minutes 01–03: Authentication & Role Check
1. Open browser at `http://localhost:8082/login`.
2. Verify **Select Login Type** shows only **Member** and **Staff** (Admin option is completely removed).
3. **Member Login**:
   - Click **Member**. Choose tier **Silver**.
   - Input `shahvraj140@gmail.com` and password `password123`.
   - Click **Sign In as Member**. Verify redirect to `/app` with the member badge rendered in the header.
4. **Staff Login**:
   - Sign out, return to `/login`, and select **Staff**.
   - Pick a terminal from the dropdown (e.g. `Front Desk · Priya Sharma`).
   - Click **Sign In as Staff** &rarr; Verify immediate routing to `/desk`.

### ⏱️ Minutes 04–07: Court Reservation & Social Play
1. Navigate to `http://localhost:8082/app/book`.
2. Select **Badminton** or **Tennis**.
3. Click an available time slot (e.g. `18:00 - 19:00`).
4. Observe the 5-minute countdown reservation lock timer.
5. Click **Confirm Booking** &rarr; Notice immediate persistence and appearance in `http://localhost:8082/app/bookings`.
6. Open `http://localhost:8082/app/social`:
   - Click on **Evening Advanced Pickleball**.
   - Click **+1 Slot**, type player name, and confirm.
   - Verify that the slot updates live and displays capacity progress.

### ⏱️ Minutes 08–11: Front Desk Terminal
1. Navigate to `http://localhost:8082/desk`.
2. **Walk-in Booking**:
   - Go to `/desk/walk-in`.
   - Select a court and time cell.
   - Enter guest name and choose payment method (Cash / UPI).
   - Click **Book & Collect Payment** &rarr; View instant booking receipt.
3. **Check-In**:
   - Go to `/desk/checkin`.
   - Search for `shahvraj140@gmail.com`.
   - Click **Verify Check-In** &rarr; Status changes to checked-in with timestamp logged.

### ⏱️ Minutes 12–15: Pro Shop & Inventory Full End-to-End Testing
1. **Public Catalog Browsing (`/shop`)**:
   - Open `http://localhost:8082/shop`.
   - Observe **47 products** loaded directly from PostgreSQL with live prices, variant counts, and brand filters.
   - Filter by sport (e.g. *Badminton*) or category (e.g. *Balls & Shuttles*).
2. **Product Detail & Cart (`/shop/:slug`, `/cart`)**:
   - Click on **Yonex Astrox 99 Pro** (`/shop/yonex-astrox-99-pro`).
   - Choose variant **Grip G4 (4U)** &rarr; Click **Add to Bag**.
   - Navigate to `/cart` &rarr; Observe the 10-minute cart reservation countdown and member discount breakdown.
3. **Checkout & Order Creation (`/checkout`)**:
   - Click **Proceed to Checkout**.
   - Select **Club Pickup** &rarr; Click **Pay Now** &rarr; Confirm simulated UPI/Card payment.
   - Observe the **Club Pickup Pass** screen with real order ID (`ORD-...`), token ID, and QR code pass.
   - In PostgreSQL: `SELECT id, order_number, total, status FROM shop_order;` &rarr; Confirm the order is persisted with exact subtotal, tax, and order lines.
4. **Staff Shop POS Terminal (`/shop-console`)**:
   - Open `http://localhost:8082/shop-console`.
   - Select an item (e.g. *Wilson Blade 98 v9*) in Cart 1 &rarr; Select payment method **Cash** &rarr; Click **Charge & Print Receipt**.
   - Verify that stock decrements automatically in PostgreSQL via the `apply_stock_movement()` trigger.
5. **Quick-Sale Consumables (`/shop-console/quick`)**:
   - Open `http://localhost:8082/shop-console/quick`.
   - Tap **Yonex Super Grap** &rarr; Choose **Charge Cash** &rarr; Instant receipt generated and transaction recorded in `shop_order`.
6. **Orders Kanban Queue (`/shop-console/orders`)**:
   - Open `http://localhost:8082/shop-console/orders`.
   - Locate the online order placed in Step 3 in the `PLACED` column.
   - Click **Advance Status** &rarr; Watch it transition to `PACKED` &rarr; `READY_FOR_PICKUP` &rarr; `COLLECTED` (synced via `PATCH /api/shop/orders/{id}/status`).
7. **Inventory Management & Audit Movements (`/shop-console/inventory`)**:
   - Open `http://localhost:8082/shop-console/inventory`.
   - View on-hand vs reserved stock for all 68 variants.
   - Click **Adjust** on any SKU, add `+10` units under `RECEIPT`, enter note "Warehouse intake", and confirm.
   - In PostgreSQL: `SELECT on_hand FROM product_variant WHERE sku = '...';` &rarr; Verify stock increased by 10 units.

### ⏱️ Minutes 16–19: Courtside Bar & KDS
1. Navigate to `http://localhost:8082/bar`.
2. Click on **Table 04**.
3. Select beverages and snacks &rarr; Click **Send to Kitchen**.
4. In another tab, open `http://localhost:8082/kds`:
   - Observe the live ticket appear. Click **Start Cooking** &rarr; **Mark Ready**.
5. Return to `/bar/table/4` &rarr; Click **Close Bill** and settle invoice.

### ⏱️ Minutes 20–23: Member CRM & Pipeline
1. Navigate to `http://localhost:8082/crm`.
2. Open `/crm/leads` &rarr; Drag a lead card across the Kanban stages.
3. Open a lead detail page `/crm/leads/:id`.
4. Log an interaction note under the Activity tab.
5. Click **Create Quote** &rarr; Generate an itemized proposal with custom coaching perks.

### ⏱️ Minutes 24–27: Finance & Accounting
1. Navigate to `http://localhost:8082/finance/invoices`.
2. Click on any invoice to view the authentic paper invoice preview.
3. Click **Download / Print PDF** to verify printer styling.
4. Open `/finance/expenses` &rarr; Click **Record Expense** (`₹4,500` for *Maintenance*).
5. Open `/finance/reconciliation` &rarr; Click **Sign-off** on the active register drawer.

### ⏱️ Minutes 28–30: Staff Hub & HR Portal
1. Navigate to `http://localhost:8082/staff`.
2. Click **Time Clock** (`/my/clock`) &rarr; Click **Clock In** / **Clock Out**.
3. Open `/hr/payroll` &rarr; Click **Preview Payroll Run** to verify salary components.
4. **Confirm Complete Removal of Admin**:
   - Manually type `http://localhost:8082/admin/utilisation` or `http://localhost:8082/owner`.
   - The application immediately displays the **404 Out of Bounds** page. No admin features or bypasses exist anywhere in the application.

---

## 💻 Development Commands

```bash
# Run backend (Spring Boot on port 8081)
cd backend
mvn spring-boot:run

# Run frontend (Vite on port 8082)
cd frontend
npm run dev

# Run TypeScript build check
npm run build
```
