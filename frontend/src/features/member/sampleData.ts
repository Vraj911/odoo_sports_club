import type {
  MemberProfile,
  MembershipPlan,
  BarTabItem,
  SettledTabRecord,
  Order,
  Invoice,
  ClubNotification,
} from "./types";

// ── 5 Required Sample Members for Phase 4 ──
export const SAMPLE_MEMBERS: Record<string, MemberProfile> = {
  "active-gold": {
    id: "CC-000123",
    name: "Pratham Patel",
    email: "pratham.patel@example.com",
    phone: "+91 98201 12345",
    dob: "1994-06-18",
    address: "B-402, Sea Breeze Towers, Worli Sea Face, Mumbai 400018",
    emergencyContact: {
      name: "Rohit Patel",
      phone: "+91 98201 99887",
      relationship: "Brother",
    },
    tier: "Gold",
    status: "ACTIVE",
    validTill: "2026-11-14",
    daysRemaining: 42,
    memberSince: "14 Nov 2023",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    qrToken: "QR_TOKEN_CC_000123_GOLD_ACTIVE",
    entitlements: {
      courtRate: 0,
      courtDescription: "Complimentary on all courts (₹0)",
      shopDiscount: 15,
      barDiscount: 15,
      advanceBookingDays: 14,
      guestPasses: 2,
    },
    tabLimit: 5000,
    tabBalance: 640,
    notificationPreferences: {
      bookings: { email: true, inApp: true, sms: true },
      social: { email: true, inApp: true, sms: false },
      bar: { email: false, inApp: true, sms: true },
      billing: { email: true, inApp: true, sms: true },
      shop: { email: true, inApp: true, sms: false },
    },
  },

  "expiring-soon": {
    id: "CC-000456",
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91 98111 23456",
    dob: "1996-03-22",
    address: "Flat 12, Golf Links Apartments, New Delhi 110003",
    emergencyContact: {
      name: "Karan Sharma",
      phone: "+91 98111 77665",
      relationship: "Spouse",
    },
    tier: "Gold",
    status: "EXPIRING_SOON",
    validTill: "2026-10-11",
    daysRemaining: 8,
    memberSince: "11 Oct 2024",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    qrToken: "QR_TOKEN_CC_000456_GOLD_EXPIRING",
    entitlements: {
      courtRate: 0,
      courtDescription: "Complimentary on all courts (₹0)",
      shopDiscount: 15,
      barDiscount: 15,
      advanceBookingDays: 14,
      guestPasses: 2,
    },
    tabLimit: 5000,
    tabBalance: 1250,
    notificationPreferences: {
      bookings: { email: true, inApp: true, sms: true },
      social: { email: false, inApp: true, sms: false },
      bar: { email: true, inApp: true, sms: true },
      billing: { email: true, inApp: true, sms: true },
      shop: { email: false, inApp: true, sms: false },
    },
  },

  expired: {
    id: "CC-000789",
    name: "Rohan Kapoor",
    email: "rohan.kapoor@example.com",
    phone: "+91 97170 34567",
    dob: "1991-09-12",
    address: "74, Jubilee Hills, Road No. 36, Hyderabad 500033",
    emergencyContact: {
      name: "Sunil Kapoor",
      phone: "+91 97170 11223",
      relationship: "Father",
    },
    tier: "Silver",
    status: "EXPIRED",
    validTill: "2026-09-28",
    daysRemaining: 0,
    memberSince: "28 Sep 2023",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    qrToken: "QR_TOKEN_CC_000789_SILVER_EXPIRED",
    entitlements: {
      courtRate: 300,
      courtDescription: "Standard Member Rate (Guest rate applies until renewed)",
      shopDiscount: 0,
      barDiscount: 0,
      advanceBookingDays: 3,
      guestPasses: 0,
    },
    tabLimit: 0,
    tabBalance: 0,
    notificationPreferences: {
      bookings: { email: true, inApp: true, sms: true },
      social: { email: true, inApp: true, sms: true },
      bar: { email: true, inApp: true, sms: false },
      billing: { email: true, inApp: true, sms: true },
      shop: { email: true, inApp: true, sms: false },
    },
  },

  "pending-payment": {
    id: "CC-000321",
    name: "Neha Gupta",
    email: "neha.gupta@example.com",
    phone: "+91 98450 45678",
    dob: "1998-12-05",
    address: "88, Indiranagar 100ft Road, Bengaluru 560038",
    emergencyContact: {
      name: "Anand Gupta",
      phone: "+91 98450 88990",
      relationship: "Father",
    },
    tier: "Gold",
    status: "PENDING_PAYMENT",
    validTill: "2026-10-03",
    daysRemaining: 0,
    memberSince: "03 Oct 2026",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    qrToken: "QR_TOKEN_CC_000321_PENDING_PAYMENT",
    entitlements: {
      courtRate: 0,
      courtDescription: "Gold benefits pending activation payment (₹18,000)",
      shopDiscount: 15,
      barDiscount: 15,
      advanceBookingDays: 14,
      guestPasses: 2,
    },
    tabLimit: 0,
    tabBalance: 0,
    notificationPreferences: {
      bookings: { email: true, inApp: true, sms: true },
      social: { email: true, inApp: true, sms: true },
      bar: { email: true, inApp: true, sms: true },
      billing: { email: true, inApp: true, sms: true },
      shop: { email: true, inApp: true, sms: true },
    },
  },

  junior: {
    id: "CC-000999",
    name: "Aarav Mehta",
    email: "arjun.mehta+aarav@example.com",
    phone: "+91 98200 12345",
    dob: "2012-08-14",
    address: "10B, Silver Oaks, Altamount Road, Mumbai 400026",
    emergencyContact: {
      name: "Arjun Mehta",
      phone: "+91 98200 12345",
      relationship: "Father & Guardian",
    },
    tier: "Junior",
    status: "ACTIVE",
    validTill: "2027-04-15",
    daysRemaining: 194,
    memberSince: "15 Apr 2024",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    qrToken: "QR_TOKEN_CC_000999_JUNIOR_ACTIVE",
    guardian: {
      name: "Arjun Mehta",
      phone: "+91 98200 12345",
      email: "arjun.mehta@example.com",
      relationship: "Father",
      consentSigned: true,
      consentDate: "15 Apr 2024",
    },
    entitlements: {
      courtRate: 150,
      courtDescription: "Subsidized junior court tariff (₹150)",
      shopDiscount: 10,
      barDiscount: 5,
      advanceBookingDays: 7,
      guestPasses: 0,
    },
    tabLimit: 1000,
    tabBalance: 120,
    notificationPreferences: {
      bookings: { email: true, inApp: true, sms: true },
      social: { email: false, inApp: true, sms: false },
      bar: { email: true, inApp: true, sms: true },
      billing: { email: true, inApp: true, sms: true },
      shop: { email: false, inApp: true, sms: false },
    },
  },
};

// ── Membership Plans Catalog ──
export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "plan-gold",
    name: "Gold All-Access",
    tier: "Gold",
    annualFee: 18000,
    courtRate: "₹0 complimentary",
    shopDiscount: "15% discount",
    barDiscount: "15% discount",
    advanceBookingDays: 14,
    guestPasses: 2,
    popular: true,
    description: "Unlimited court play across Tennis, Padel, Badminton & Nets with 14-day priority booking.",
  },
  {
    id: "plan-silver",
    name: "Silver Regular",
    tier: "Silver",
    annualFee: 10000,
    courtRate: "₹200–₹400 / hr",
    shopDiscount: "10% discount",
    barDiscount: "10% discount",
    advanceBookingDays: 10,
    guestPasses: 1,
    popular: false,
    description: "Ideal for club regulars playing 2–3 times a week with preferred court rates.",
  },
  {
    id: "plan-junior",
    name: "Junior Academy",
    tier: "Junior",
    annualFee: 6000,
    courtRate: "₹100–₹200 / hr",
    shopDiscount: "10% on gear",
    barDiscount: "5% on healthy snacks",
    advanceBookingDays: 7,
    guestPasses: 0,
    popular: false,
    description: "For aspiring youth athletes under 18 with coaching clinic discounts and guardian oversight.",
  },
];

// ── Computation Helper: New End Date for Renewals ──
export function computeRenewalEndDate(currentValidTill: string, isExpired: boolean): string {
  const baseDate = isExpired ? new Date() : new Date(currentValidTill);
  const newDate = new Date(baseDate);
  newDate.setFullYear(newDate.getFullYear() + 1);

  const y = newDate.getFullYear();
  const m = String(newDate.getMonth() + 1).padStart(2, "0");
  const d = String(newDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Computation Helper: Pro-rated Plan Change ──
export function computePlanChangePreview(
  currentProfile: MemberProfile,
  targetPlan: MembershipPlan
): {
  daysRemaining: number;
  dailyRate: number;
  creditAmount: number;
  newPlanFee: number;
  netPayable: number;
  isUpgrade: boolean;
} {
  const currentPlan =
    MEMBERSHIP_PLANS.find((p) => p.tier === currentProfile.tier) ?? MEMBERSHIP_PLANS[0]!;

  const daysRemaining = Math.max(0, currentProfile.daysRemaining);
  const dailyRate = Math.round((currentPlan.annualFee / 365) * 100) / 100;
  const creditAmount = Math.round(dailyRate * daysRemaining);

  const newPlanFee = targetPlan.annualFee;
  const netPayable = Math.max(0, newPlanFee - creditAmount);
  const isUpgrade = targetPlan.annualFee > currentPlan.annualFee;

  return {
    daysRemaining,
    dailyRate,
    creditAmount,
    newPlanFee,
    netPayable,
    isUpgrade,
  };
}

// ── Sample Live Bar Tab Items (BAR-06) ──
export const SAMPLE_BAR_TAB_ITEMS: BarTabItem[] = [
  {
    id: "TAB-1",
    name: "Matcha Whey Protein Shake",
    category: "Beverage",
    price: 280,
    discount: 42, // 15% Gold
    quantity: 1,
    timestamp: Date.now() - 3600000 * 2,
    table: "Courtside Lounge T-4",
    server: "Sanjay M.",
  },
  {
    id: "TAB-2",
    name: "Electrolyte Coconut Water Cooler",
    category: "Beverage",
    price: 180,
    discount: 27,
    quantity: 2,
    timestamp: Date.now() - 3600000 * 1.5,
    table: "Courtside Lounge T-4",
    server: "Sanjay M.",
  },
  {
    id: "TAB-3",
    name: "Truffle Parmesan Sourdough Toast",
    category: "Food",
    price: 320,
    discount: 48,
    quantity: 1,
    timestamp: Date.now() - 3600000 * 0.8,
    table: "Courtside Lounge T-4",
    server: "Vikram R.",
  },
];

// ── Sample Settled Tab History ──
export const SAMPLE_SETTLED_TABS: SettledTabRecord[] = [
  {
    id: "TAB-SET-901",
    date: "2026-09-30",
    itemsCount: 4,
    total: 980,
    discount: 147,
    paidAmount: 833,
    invoiceRef: "INV-2026-0812",
    paymentMethod: "UPI (Google Pay)",
    server: "Sanjay M.",
  },
  {
    id: "TAB-SET-882",
    date: "2026-09-24",
    itemsCount: 3,
    total: 750,
    discount: 112,
    paidAmount: 638,
    invoiceRef: "INV-2026-0790",
    paymentMethod: "Member Card Auto-charge",
    server: "Pooja V.",
  },
  {
    id: "TAB-SET-840",
    date: "2026-09-15",
    itemsCount: 5,
    total: 1420,
    discount: 213,
    paidAmount: 1207,
    invoiceRef: "INV-2026-0744",
    paymentMethod: "Credit Card (HDFC)",
    server: "Vikram R.",
  },
];

// ── Sample Orders (SHP-11, 17) ──
export const SAMPLE_ORDERS: Order[] = [
  {
    id: "ORD-9021",
    items: [
      {
        id: "prod-1",
        name: "Babolat Pure Aero 2026 Racket",
        quantity: 1,
        unitPrice: 18999,
        discount: 2850, // 15%
        total: 16149,
      },
      {
        id: "prod-2",
        name: "Wilson US Open Tour Balls (Can of 3)",
        quantity: 2,
        unitPrice: 550,
        discount: 165,
        total: 935,
      },
    ],
    subtotal: 20099,
    discountTotal: 3015,
    tax: 3075,
    total: 20159,
    status: "READY_FOR_PICKUP",
    orderType: "PICKUP",
    date: "2026-10-02",
    createdAt: Date.now() - 86400000 * 1,
    pickupCode: "PK-9021-BO",
    timeline: [
      { status: "PLACED", timestamp: Date.now() - 86400000 * 1, note: "Order placed online" },
      { status: "PAID", timestamp: Date.now() - 86400000 * 1 + 60000, note: "Payment of ₹20,159 verified" },
      { status: "PACKED", timestamp: Date.now() - 3600000 * 12, note: "Packed at Pro Shop Counter" },
      { status: "READY_FOR_PICKUP", timestamp: Date.now() - 3600000 * 2, note: "Ready for desk collection" },
    ],
  },
  {
    id: "ORD-8944",
    items: [
      {
        id: "prod-3",
        name: "CCMS Breathable Courtside Club Polo (Navy)",
        quantity: 1,
        unitPrice: 2200,
        discount: 330,
        total: 1870,
      },
      {
        id: "prod-4",
        name: "Tourna Grip Original Overgrips (Pack of 10)",
        quantity: 1,
        unitPrice: 1200,
        discount: 180,
        total: 1020,
      },
    ],
    subtotal: 3400,
    discountTotal: 510,
    tax: 520,
    total: 3410,
    status: "COLLECTED",
    orderType: "PICKUP",
    date: "2026-09-22",
    createdAt: Date.now() - 86400000 * 11,
    pickupCode: "PK-8944-CL",
    timeline: [
      { status: "PLACED", timestamp: Date.now() - 86400000 * 11 },
      { status: "PAID", timestamp: Date.now() - 86400000 * 11 + 45000 },
      { status: "PACKED", timestamp: Date.now() - 86400000 * 10 },
      { status: "READY_FOR_PICKUP", timestamp: Date.now() - 86400000 * 9 },
      { status: "COLLECTED", timestamp: Date.now() - 86400000 * 9 + 3600000 * 4, note: "Collected by member" },
    ],
  },
];

// ── Sample Invoices (FIN-04, 05) ──
export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: "INV-2026-0842",
    number: "CCMS/26-27/0842",
    date: "2026-10-02",
    dueDate: "2026-10-02",
    status: "PAID",
    category: "PRO_SHOP",
    items: [
      {
        description: "Babolat Pure Aero 2026 Racket",
        hsn: "9506.51.00",
        quantity: 1,
        unitPrice: 16149,
        amount: 16149,
      },
      {
        description: "Wilson US Open Balls (3-pack)",
        hsn: "9506.61.00",
        quantity: 2,
        unitPrice: 467.5,
        amount: 935,
      },
    ],
    subtotal: 17084,
    cgst: 1537.56,
    sgst: 1537.56,
    total: 20159,
    paidAt: Date.now() - 86400000 * 1,
    paymentMethod: "UPI (Google Pay)",
    transactionRef: "TXN_UPI_9928371029",
  },
  {
    id: "INV-2026-0812",
    number: "CCMS/26-27/0812",
    date: "2026-09-30",
    dueDate: "2026-09-30",
    status: "PAID",
    category: "BAR_TAB",
    items: [
      {
        description: "Courtside Bar & Kitchen Tab Settlement",
        hsn: "9963.31.00",
        quantity: 1,
        unitPrice: 706,
        amount: 706,
      },
    ],
    subtotal: 706,
    cgst: 63.5,
    sgst: 63.5,
    total: 833,
    paidAt: Date.now() - 86400000 * 3,
    paymentMethod: "UPI",
    transactionRef: "TXN_UPI_8819283011",
  },
  {
    id: "INV-2026-0760",
    number: "CCMS/26-27/0760",
    date: "2026-09-18",
    dueDate: "2026-09-18",
    status: "PAID",
    category: "COURT_BOOKING",
    items: [
      {
        description: "Guest Court Lighting & Extra Paddle Hire (Padel 1)",
        hsn: "9996.51.00",
        quantity: 1,
        unitPrice: 423.7,
        amount: 423.7,
      },
    ],
    subtotal: 423.7,
    cgst: 38.15,
    sgst: 38.15,
    total: 500,
    paidAt: Date.now() - 86400000 * 15,
    paymentMethod: "Credit Card",
    transactionRef: "TXN_CC_771829001",
  },
  {
    id: "INV-2026-0101",
    number: "CCMS/26-27/0101",
    date: "2025-11-14",
    dueDate: "2025-11-14",
    status: "PAID",
    category: "MEMBERSHIP",
    items: [
      {
        description: "Annual Gold Membership Subscription (2025–2026)",
        hsn: "9995.99.00",
        quantity: 1,
        unitPrice: 15254.24,
        amount: 15254.24,
      },
    ],
    subtotal: 15254.24,
    cgst: 1372.88,
    sgst: 1372.88,
    total: 18000,
    paidAt: Date.now() - 86400000 * 320,
    paymentMethod: "Net Banking (HDFC)",
    transactionRef: "TXN_NB_551928371",
  },
  {
    id: "INV-2026-0901",
    number: "CCMS/26-27/0901",
    date: "2026-10-01",
    dueDate: "2026-10-15",
    status: "SENT",
    category: "MEMBERSHIP",
    items: [
      {
        description: "Annual Membership Renewal (2026–2027 Preview)",
        hsn: "9995.99.00",
        quantity: 1,
        unitPrice: 15254.24,
        amount: 15254.24,
      },
    ],
    subtotal: 15254.24,
    cgst: 1372.88,
    sgst: 1372.88,
    total: 18000,
  },
];

// ── Sample Notifications (NTF-01, 02) ──
export const SAMPLE_NOTIFICATIONS: ClubNotification[] = [
  {
    id: "NTF-101",
    title: "Upcoming Tennis Booking in 2 Hours",
    message: "Tennis 2 · Today at 18:00. Turnstile check-in PIN: CC-8021-TC2.",
    category: "Bookings",
    read: false,
    timestamp: Date.now() - 1000 * 60 * 25,
    link: "/app/bookings/BK-8021",
  },
  {
    id: "NTF-102",
    title: "Pro Shop Order Ready for Pickup",
    message: "Order #ORD-9021 (Babolat Pure Aero) is packed and waiting at the Pro Shop desk.",
    category: "Orders",
    read: false,
    timestamp: Date.now() - 1000 * 60 * 90,
    link: "/app/orders/ORD-9021",
  },
  {
    id: "NTF-103",
    title: "Friday Social Americano Announced",
    message: "Spots are open for Friday Night Padel Social! 3 spots remaining for Gold members.",
    category: "Membership",
    read: false,
    timestamp: Date.now() - 1000 * 60 * 180,
    link: "/app/social",
  },
  {
    id: "NTF-104",
    title: "Bar Tab Updated: Courtside T-4",
    message: "Item added: Truffle Parmesan Sourdough Toast (₹320 - 15% Gold Disc). Balance: ₹640.",
    category: "Payments",
    read: true,
    timestamp: Date.now() - 86400000 * 1,
    link: "/app/tab",
  },
  {
    id: "NTF-105",
    title: "Tax Invoice Issued #CCMS/26-27/0842",
    message: "Receipt for ₹20,159 generated with GST breakup. Available for download.",
    category: "Payments",
    read: true,
    timestamp: Date.now() - 86400000 * 1.5,
    link: "/app/invoices/INV-2026-0842",
  },
  {
    id: "NTF-106",
    title: "Court Rescheduled Successfully",
    message: "Booking #BK-8021 moved to Tennis 2 with zero price difference.",
    category: "Bookings",
    read: true,
    timestamp: Date.now() - 86400000 * 2,
    link: "/app/bookings/BK-8021",
  },
];
