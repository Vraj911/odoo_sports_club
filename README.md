# Champions Club Management System (CCMS) · BookMyCourt

> An enterprise-grade, full-stack sports club management and court booking platform designed for premier multi-sport racquet and athletic clubs.

---

## 🌟 Overview

**CCMS (Champions Club Management System)** provides an end-to-end operational operating system for modern sports facilities. It unifies court reservations, membership life-cycles, walk-in front desk reception, pro gear commerce, bar tabs, tournament matchmaking, and multi-department staff administration into a unified, high-performance experience.

```
                                  ┌───────────────────────────┐
                                  │      CCMS Platform        │
                                  └─────────────┬─────────────┘
                                                │
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         ▼                  ▼                   ▼                   ▼                  ▼
   Public Web &       Court Booking       Member Portal        Front Desk         Pro Gear Shop
   Club Showcase         Engine          & Digital Card          Console         & Cart / Checkout
```

---

## 🏛️ System Architecture

The project is structured as a decoupled monorepo:

```
odoo_sports_club/
├── frontend/             # React 19 + TypeScript + Vite + TanStack Router (SPA)
├── backend/              # Spring Boot 3.x + Java 17 + PostgreSQL + Maven
├── srs.pdf               # Comprehensive Software Requirements Specification
└── README.md             # Project documentation & quick start
```

---

## 🚀 Key Functional Modules

### 1. 🎾 Court Booking Engine (`/app/book`, `/availability`)
- **Multi-Sport Grid**: Live scheduling for Tennis (Clay/Hard), Padel, Badminton (Wooden/Synthetic), Pickleball, Squash, and Cricket Nets.
- **Dynamic Scheduling**: 30-minute block increments, auto-grouped 60-min minimum bookings.
- **Fair-Play Rules**: 2-booking daily allowance per member, overlapping slot protection.
- **Hold & Release**: 5-minute checkout holds with real-time countdown timer before returning slots to inventory.
- **Peak / Off-Peak & Tier Pricing**: Instant pricing computation with Gold (₹0 / complimentary court hours), Silver, and Junior discounts.
- **Recurring & Waitlist**: Weekly recurrence with conflict detection; real-time waitlist notifications upon cancellations.

### 2. 👥 Social Play Matchmaking (`/app/social`)
- **Community Sessions**: Casual rallies, doubles rotations, ladder tournaments, and coaching clinics.
- **Live Rosters**: Real-time participant slots, skill rating filters (Beginner, Intermediate, Advanced), and auto-promotion from waitlists.

### 3. 💳 Membership Portal & Digital Pass (`/app/membership`, `/app/card`)
- **Tier Management**: Gold, Silver, and Junior tiers with pro-rated upgrade calculator and renewal predictions.
- **Digital Membership Card**: High-contrast digital ID with dynamic QR code (AES/HMAC encrypted token format) for contactless club check-in.
- **Billing & Invoices**: GST-compliant invoices (HSN/SAC 9995) with CGST/SGST breakup, printable views, and online payment.
- **Bar & Lounge Tab**: Active lounge tabs, itemized orders, and staff paging.

### 4. 🏢 Front Desk Reception Console (`/desk/*`)
- **Fast Check-in**: Visual QR scanner and one-click member check-in verification with membership and booking eligibility indicators.
- **3-Tap Walk-In Booking**: Rapid wizard for guests or registered members with cash, UPI, or card settlement.
- **Master Availability Grid**: Staff override controls, court maintenance holds, and no-show tracking.

### 5. 🛍️ Pro Gear Shop & E-commerce (`/shop`, `/cart`, `/checkout`, `/app/shop`)
- **Equipment Catalog**: ~40 tournament-grade products across rackets, balls, court footwear, strings, grips, bags, and apparel.
- **Variant Engine**: Multi-axis variants (Grip Size, String Tension, Shoe UK Size, Apparel Color) with dynamic SKU, stock, and price override syncing.
- **10-Minute Stock Reservation**: Live countdown timer holds stock in client state, auto-releasing unpurchased stock.
- **Tier Discounts**: Automated club member discounts (Gold 15%, Junior 10%, Silver 8%) applied transparently at cart and checkout.
- **4-Step Checkout**:
  1. *Customer Details* (prefilled for members or guest checkout)
  2. *Fulfilment* (Segmented selection: Free Pro Shop Counter Pickup vs. Home Delivery)
  3. *Review & GST Breakup* (18% GST taxable calculation)
  4. *Simulated Gateway Modal* (UPI / QR, Cards, Net Banking, Pay at Desk with instant success/failure simulation)
- **Pickup Pass & Sync**: Order confirmation with generated pickup QR code and automatic synchronization with Member Orders (`/app/orders`).

---

## 🔐 Role-Based Access Control (RBAC)

The application enforces a 3-Primary-Role permission architecture:

| Primary Role | Scope & Permissions | Typical Users |
| :--- | :--- | :--- |
| **`MEMBER`** | Public site + Member Portal (`/app/*`). Cannot access staff or console routes. | Club members (Gold, Silver, Junior) |
| **`STAFF`** | Staff Hub (`/staff`) + assigned functional Permission Groups. Bounded strictly by held groups. | Desk staff, Shop operators, Bar staff, Accountants |
| **`ADMIN`** | Unrestricted access across all operational consoles, financial controls, and audit trails. | Club Owners, General Managers, System Admins |

### Staff Permission Groups
- `FRONT_DESK`: Reception, Check-in scanner, Walk-in bookings, Court schedule overrides.
- `POS_BAR`: Lounge and cafe orders, Bar tabs, Kitchen display.
- `SHOP_INVENTORY`: Pro Shop POS, inventory management, stock adjustments, restock orders.
- `CRM`: Member directory, lead management, communication broadcast.
- `FINANCE`: Invoicing, GST audit logs, financial reports, payment reconciliations.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript (Strict Mode)
- **Build Tool**: Vite 8 + TanStack Router (File & Code-based routing)
- **Styling**: Tailwind CSS + Custom Design Tokens (`court`, `navy`, `volt`, `chalk`, `ink`)
- **Motion & Icons**: Framer Motion, Lucide React
- **State Management**: `useSyncExternalStore` atomic stores (`shopStore`, `memberStore`, `bookingStore`, `deskStore`)
- **Data Visualizations**: Recharts
- **QR Engine**: `qrcode.react` (SVG QR generation)

### Backend
- **Framework**: Java 17, Spring Boot 3.x
- **Persistence**: Spring Data JPA / Hibernate, PostgreSQL
- **Security**: Spring Security, JWT authentication, BCrypt hashing
- **Build System**: Maven (`./mvnw`)

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** >= 18.x
- **Java JDK** >= 17 (for backend)
- **PostgreSQL** (for backend database)

### Running the Frontend
```bash
# 1. Navigate to frontend
cd frontend

# 2. Configure environment (pre-configured with VITE_PORT and VITE_APP_URL)
# Edit .env to adjust port or backend URL as needed:
# VITE_PORT=8080
# VITE_APP_URL=http://localhost:8080
# VITE_API_URL=http://localhost:8081

# 3. Install dependencies
npm install

# 4. Start development server
npm run dev
```
The frontend starts on the port configured in `.env` (defaults to **`VITE_PORT=8080`**).

### Running the Backend
```bash
# 1. Navigate to backend
cd backend

# 2. Run with Maven wrapper
./mvnw spring-boot:run
```
The API starts on **`http://localhost:8081`**.

---

## 🎨 Design System Tokens

The frontend adheres strictly to the CCMS Brand Guidelines:
- **`court-500` / `court-600` / `court-700`**: Wimbledon & US Open deep court blues.
- **`navy-800` / `navy-900` / `navy-950`**: Elevated dark surface backing.
- **`volt-400` / `volt-500`**: High-voltage tennis-ball lime green accent (`#D5F63A`).
- **`chalk`**: Crisp white lines and court markings.
- **Typography**: Google Poppins across all headers, controls, and body copy.
