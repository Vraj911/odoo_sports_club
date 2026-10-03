# CCMS Frontend · Champions Club Management System

> High-performance React 19 + TypeScript + Vite frontend client for the Champions Club sports club platform.

---

## 🚀 Key Modules & Pages Implemented

### 1. Public & Marketing (`src/features/website`)
- **Landing / Home (`/`)**: Hero section featuring 28px framed brand art, player silhouettes with shadows, count-up stats, "Courts Available Now" live badge, and instant CTA navigation.
- **Facilities & Plans (`/facilities`, `/plans`)**: Court showcase and membership pricing matrix.

### 2. Authentication & Onboarding (`src/features/auth`)
- **Sign In (`/login`)**: Role-aware login with demo role switcher, credential inputs, and staff member selection modal.
- **Register (`/register`)**: 3-primary-role onboarding selection:
  - *Sign in / Register as Member*
  - *Sign in / Register as Staff* (with functional permission group selection)
  - *Sign in / Register as Admin* (Club Owner / General Manager)
- **Password Recovery (`/forgot-password`, `/reset-password`)**: Multi-step verification flow.

### 3. Court Reservation Engine (`src/features/booking`)
- **Book a Court (`/app/book`)**: Multi-sport availability grid (Tennis, Padel, Badminton, Pickleball, Squash, Cricket Net) with 30-minute cells, peak/off-peak price computation, 5-minute checkout hold timer, waitlist drawer, and weekly recurring reservations.
- **Booking Detail (`/app/bookings/:id`)**: Booking receipt, access PIN, cancellation policy with refund calculation, and atomic reschedule wizard.

### 4. Community & Social Play (`src/features/social`)
- **Social Play Sessions (`/app/social`)**: Matchmaking sessions with participant rosters, skill-level ratings, waitlist handling, and slot capacity enforcement.

### 5. Member Experience Portal (`src/features/member`)
- **Member Dashboard (`/app`)**: Personalized greeting, upcoming bookings widget, active bar tab summary, quick court booking launcher.
- **Digital Membership Card (`/app/card`)**: Digital membership pass with full-screen QR code for turnstile/desk check-in.
- **Membership & Billing (`/app/membership`, `/app/invoices`)**: Tier management (Gold 15% discount, Silver 8%, Junior 10%), pro-rated upgrade calculator, renewal scheduler, and GST invoices with HSN breakdown.
- **Pro Shop Orders (`/app/orders`, `/app/orders/:id`)**: Order tracking with timeline (PLACED → PAID → PACKED → READY_FOR_PICKUP → COLLECTED), pickup QR pass, and one-click re-ordering.
- **Lounge & Bar Tab (`/app/tab`)**: Itemized tab overview, active balance, and "Request Bill" staff alert.
- **Notifications Hub (`/app/notifications`)**: Grouped club alerts with read/unread filtering.

### 6. Front Desk Reception Console (`src/features/desk`)
- **Desk Overview (`/desk`)**: Key operational KPIs, court occupancy sparklines, and active daily schedule.
- **Check-in Console (`/desk/checkin`)**: Fast member QR code scanner with membership validity and court booking validation checks.
- **Walk-in Booking (`/desk/walkin`)**: 3-tap booking flow for walk-in players, guest rate vs. member plan lookup, and cash/UPI/card payment recording.
- **Master Grid & Records (`/desk/availability`, `/desk/bookings`, `/desk/payments`)**: Filterable tables, CSV exports, and administrative overrides with mandatory audit logging.

### 7. Pro Gear Shop & E-Commerce (`src/features/shop`)
- **Product Catalog (`/shop`, `/app/shop`)**: ~40 tournament products across rackets, balls, footwear, strings, grips, bags, and apparel. Filterable by category, sport, brand, price range, and in-stock status.
- **Product Detail (`/shop/:slug`)**: Variant axis chips (Grip size, String tension, Shoe UK size, Color) dynamically updating SKU, price, and stock levels. Quantity stepper capped at on-hand inventory.
- **10-Minute Stock Reservation**: Real-time timer (`useReservationCountdown`) reserving inventory while browsing, with automatic release upon expiration.
- **Member Tier Discount System**: Tier-based savings automatically calculated (Gold: 15% off, Junior: 10% off, Silver: 8% off).
- **Shopping Cart (`/cart`, `/app/cart`)**: Item management, live countdown timer, 18% GST (CGST + SGST) breakdown, and club pickup calculation.
- **Checkout Wizard (`/checkout`, `/app/checkout`)**:
  - *Step 1: Details* (prefilled for logged-in members or guest inputs)
  - *Step 2: Fulfilment* (Pickup at Club Pro Shop desk vs. Home Courier)
  - *Step 3: Order Review*
  - *Step 4: Simulated Payment Gateway* (UPI QR, Credit/Debit Cards, Net Banking, Pay at Desk with instant Success/Failure simulation)
- **Order Confirmation**: Order number, status pill, pickup QR pass, and automatic synchronization to `/app/orders`.

---

## 🔒 Access Control & Role Model

The application strictly implements **3 Primary Roles**:
- **`MEMBER`**: Access to public pages and member portal (`/app/*`).
- **`STAFF`**: Access to staff hub (`/staff`) and assigned functional permission groups:
  - `FRONT_DESK` (`/desk/*`)
  - `POS_BAR` (`/bar/*`)
  - `SHOP_INVENTORY` (`/shop-console/*`)
  - `CRM` (`/crm/*`)
  - `FINANCE` (`/finance/*`)
- **`ADMIN`**: Global bypass; full access to all club consoles, settings, and audits.

---

## 📁 Source Code Structure

```
frontend/src/
├── app/
│   ├── providers/        # AuthProvider, ToastProvider
│   └── router/           # TanStack Router configuration, routeConfig, guards, links
├── components/
│   ├── brand/            # CourtLines, HeroFrame, Brand assets
│   ├── layout/           # PublicLayout, AuthLayout, MemberLayout, ConsoleLayout
│   ├── shared/           # Money, AvailabilityGrid, PageSkeleton, InvoicePreview
│   └── ui/               # Button, Modal, Drawer, Table, Tabs, Input, Select, etc.
├── features/
│   ├── auth/             # LoginPage, RegisterPage, StaffLoginModal
│   ├── booking/          # BookCourt, MyBookings, BookingDetail, bookingStore
│   ├── desk/             # DeskOverview, DeskCheckin, DeskWalkIn, DeskAvailability
│   ├── member/           # MemberDashboard, ProfilePage, DigitalCardPage, OrdersPage
│   ├── shop/             # ShopCatalogPage, ProductDetailPage, CartPage, CheckoutPage, shopStore
│   ├── social/           # SocialPlay, participants modal
│   └── staff/            # StaffHub
├── lib/
│   ├── cn.ts             # Tailwind class merging utility
│   ├── permissions.ts    # RBAC configuration and permission checker
│   └── format.ts         # INR currency, date-fns in Asia/Kolkata timezone
└── types/                # Common shared TypeScript types
```

---

## 💻 Development Commands

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Compile TypeScript and build production bundle
npm run build

# Run linter
npm run lint
```
