// CCMS Comprehensive Admin Configuration & Governance Store (Phase 12)
import { useSyncExternalStore } from "react";
import type {
  ClubProfile,
  AdminCourt,
  SportType,
  DayOperatingHours,
  HolidayRecord,
  BookingRules,
  AdminPlan,
  PricingRule,
  PriceSimulationResult,
  TaxRule,
  SocialTemplate,
  LeaveType,
  SalaryComponent,
  NotificationTemplate,
  NotificationDeliveryLog,
  StaffUser,
  PermissionGroupDef,
  AccessMatrixRow,
  DemoScriptStep,
} from "./types";
import { toast } from "@/components/ui/Toast";
import { adminAuditStore } from "./adminAuditStore";

// ─── INITIAL SAMPLE DATA ──────────────────────────────────────────────

export const INITIAL_CLUB_PROFILE: ClubProfile = {
  name: "The Champions Club",
  tagline: "Premier Racquet & Country Club of Mumbai",
  logoUrl: "/favicon.png",
  address: "Plot 42, Bandra-Kurla Complex Sports Avenue, G-Block",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400051",
  gstin: "27AAACT2727Q1ZW",
  phone: "+91 22 2650 8800",
  email: "contact@championsclub.in",
  website: "https://championsclub.in",
  timezone: "Asia/Kolkata",
  currency: "INR",
  invoicePrefix: "INV-2026-",
  nextInvoiceNumber: 46,
  billPrefix: "BILL-2026-",
  nextBillNumber: 18,
  receiptFooterNote: "Thank you for playing at The Champions Club. All court fees include statutory GST. Tax invoices are permanent audit records.",
};

export const INITIAL_SPORTS: SportType[] = [
  { id: "tennis", name: "Tennis", defaultSlotMinutes: 60, isPopular: true, active: true },
  { id: "badminton", name: "Badminton", defaultSlotMinutes: 60, isPopular: true, active: true },
  { id: "squash", name: "Squash", defaultSlotMinutes: 45, isPopular: false, active: true },
  { id: "padel", name: "Padel", defaultSlotMinutes: 60, isPopular: true, active: true },
  { id: "pickleball", name: "Pickleball", defaultSlotMinutes: 60, isPopular: false, active: true },
  { id: "cricket", name: "Cricket Nets", defaultSlotMinutes: 60, isPopular: false, active: true },
];

export const INITIAL_ADMIN_COURTS: AdminCourt[] = [
  { id: "CRT-T1", name: "Tennis Court 1 (Clay)", sport: "tennis", surface: "Red Clay", isIndoor: false, status: "OPERATIONAL", active: true, lightingFeePerHour: 150 },
  { id: "CRT-T2", name: "Tennis Court 2 (Synthetic)", sport: "tennis", surface: "Plexicushion Hard", isIndoor: true, status: "OPERATIONAL", active: true },
  { id: "CRT-T3", name: "Tennis Court 3 (Synthetic)", sport: "tennis", surface: "Plexicushion Hard", isIndoor: true, status: "OPERATIONAL", active: true },
  { id: "CRT-B1", name: "Badminton Court 1 (Teak)", sport: "badminton", surface: "Teak Wood BWF Pro", isIndoor: true, status: "OPERATIONAL", active: true },
  { id: "CRT-B2", name: "Badminton Court 2 (Teak)", sport: "badminton", surface: "Teak Wood BWF Pro", isIndoor: true, status: "OPERATIONAL", active: true },
  { id: "CRT-S1", name: "Squash Court 1 (Glass Back)", sport: "squash", surface: "ASB Hard Court", isIndoor: true, status: "OPERATIONAL", active: true },
  { id: "CRT-P1", name: "Padel Court 1 (Panoramic)", sport: "padel", surface: "Mondo Supercourt", isIndoor: false, status: "OPERATIONAL", active: true, lightingFeePerHour: 200 },
  { id: "CRT-P2", name: "Padel Court 2 (Standard)", sport: "padel", surface: "Textured Turf", isIndoor: false, status: "OPERATIONAL", active: true, lightingFeePerHour: 200 },
];

export const INITIAL_HOURS: DayOperatingHours[] = [
  { day: "Monday", openTime: "06:00", closeTime: "22:00", isClosed: false },
  { day: "Tuesday", openTime: "06:00", closeTime: "22:00", isClosed: false },
  { day: "Wednesday", openTime: "06:00", closeTime: "22:00", isClosed: false },
  { day: "Thursday", openTime: "06:00", closeTime: "22:00", isClosed: false },
  { day: "Friday", openTime: "06:00", closeTime: "23:00", isClosed: false },
  { day: "Saturday", openTime: "06:00", closeTime: "23:00", isClosed: false },
  { day: "Sunday", openTime: "06:00", closeTime: "22:00", isClosed: false },
];

export const INITIAL_HOLIDAYS: HolidayRecord[] = [
  { id: "HOL-01", name: "Diwali Laxmi Pujan (Club Closed Evening)", date: "2026-11-01", type: "PUBLIC_HOLIDAY", notes: "Courts open 06:00 - 14:00 only" },
  { id: "HOL-02", name: "Annual Court Deep Conditioning & Re-surfacing", date: "2026-11-15", type: "CLUB_MAINTENANCE", notes: "All outdoor clay and padel courts blocked" },
  { id: "HOL-03", name: "Christmas Gala Exhibition Dinner", date: "2026-12-25", type: "SPECIAL_EVENT", notes: "Courts close at 18:00 for awards night" },
];

export const INITIAL_BOOKING_RULES: BookingRules = {
  slotLengthMinutes: 60,
  slotIntervalMinutes: 30,
  dailyBookingCap: 2,
  holdDurationMinutes: 5,
  freeCancellationHoursBefore: 12,
  lateCancellationFeePercent: 50,
  expiringSoonWarningDays: 15,
  reminderDaysBeforeExpiry: [30, 7, 1],
  expiredMemberPolicy: "GUEST_RATE",
};

export const INITIAL_ADMIN_PLANS: AdminPlan[] = [
  {
    id: "plan-gold",
    name: "Gold All-Access",
    tier: "Gold",
    monthlyFee: 1800,
    annualFee: 18000,
    validityDays: 365,
    shopDiscountPercent: 15,
    barDiscountPercent: 15,
    advanceBookingDays: 14,
    socialAccess: true,
    guestPassesCount: 2,
    active: true,
    tagline: "Unlimited complimentary court play with prime peak privileges.",
    courtRates: {
      tennis: 0,
      badminton: 0,
      squash: 0,
      padel: 0,
      pickleball: 0,
    },
    effectiveDate: "2026-04-01",
  },
  {
    id: "plan-silver",
    name: "Silver Regular",
    tier: "Silver",
    monthlyFee: 1050,
    annualFee: 10000,
    validityDays: 365,
    shopDiscountPercent: 10,
    barDiscountPercent: 10,
    advanceBookingDays: 10,
    socialAccess: true,
    guestPassesCount: 1,
    active: true,
    tagline: "Preferred member rates with priority weekday booking window.",
    courtRates: {
      tennis: 300,
      badminton: 200,
      squash: 250,
      padel: 400,
      pickleball: 200,
    },
    effectiveDate: "2026-04-01",
  },
  {
    id: "plan-junior",
    name: "Junior Academy",
    tier: "Junior",
    monthlyFee: 650,
    annualFee: 6000,
    validityDays: 365,
    shopDiscountPercent: 10,
    barDiscountPercent: 5,
    advanceBookingDays: 7,
    socialAccess: false,
    guestPassesCount: 0,
    active: true,
    tagline: "Subsidized junior development rates under 18 years.",
    courtRates: {
      tennis: 200,
      badminton: 150,
      squash: 150,
      padel: 300,
      pickleball: 150,
    },
    effectiveDate: "2026-04-01",
  },
  {
    id: "plan-trial",
    name: "Trial / Guest Pass",
    tier: "Trial",
    monthlyFee: 0,
    annualFee: 0,
    validityDays: 14,
    shopDiscountPercent: 0,
    barDiscountPercent: 0,
    advanceBookingDays: 3,
    socialAccess: false,
    guestPassesCount: 0,
    active: true,
    tagline: "Standard guest walk-in & pay-per-play access.",
    courtRates: {
      tennis: 600,
      badminton: 400,
      squash: 500,
      padel: 800,
      pickleball: 400,
    },
    effectiveDate: "2026-04-01",
  },
];

export const INITIAL_PRICING_RULES: PricingRule[] = [
  {
    id: "RULE-001",
    sport: "tennis",
    customerType: "GOLD",
    dayType: "ALL",
    timeBand: "ALL",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    pricePerHour: 0,
    priority: 10,
    notes: "Gold tier complimentary benefit for tennis",
  },
  {
    id: "RULE-002",
    sport: "tennis",
    customerType: "SILVER",
    dayType: "WEEKDAY",
    timeBand: "OFF_PEAK",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    pricePerHour: 300,
    priority: 8,
    notes: "Silver member regular off-peak court rate",
  },
  {
    id: "RULE-003",
    sport: "tennis",
    customerType: "SILVER",
    dayType: "ALL",
    timeBand: "PEAK",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    pricePerHour: 400,
    priority: 9,
    notes: "Silver member peak hour rate (17:00-22:00)",
  },
  {
    id: "RULE-004",
    sport: "tennis",
    customerType: "GUEST",
    dayType: "ALL",
    timeBand: "ALL",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    pricePerHour: 600,
    priority: 4,
    notes: "Standard guest public walk-in rate",
  },
  {
    id: "RULE-005",
    sport: "padel",
    customerType: "GUEST",
    dayType: "WEEKEND",
    timeBand: "PEAK",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    pricePerHour: 950,
    priority: 12,
    notes: "Premium weekend night padel with lighting",
  },
  {
    id: "RULE-006",
    sport: "badminton",
    customerType: "JUNIOR",
    dayType: "ALL",
    timeBand: "ALL",
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    pricePerHour: 150,
    priority: 6,
    notes: "Subsidized junior coaching sparring fee",
  },
];

export const INITIAL_TAX_RULES: TaxRule[] = [
  { id: "TAX-01", name: "Court Booking GST (Sports Facilities)", hsnSac: "999691", category: "COURT", cgstRate: 9, sgstRate: 9, totalGstRate: 18, isInclusive: true, active: true },
  { id: "TAX-02", name: "Membership Subscription (Club Services)", hsnSac: "999599", category: "MEMBERSHIP", cgstRate: 9, sgstRate: 9, totalGstRate: 18, isInclusive: false, active: true },
  { id: "TAX-03", name: "Sports Goods & Equipment Retail", hsnSac: "950699", category: "SHOP", cgstRate: 6, sgstRate: 6, totalGstRate: 12, isInclusive: true, active: true },
  { id: "TAX-04", name: "Café & Lounge Restaurant Services", hsnSac: "996331", category: "BAR", cgstRate: 2.5, sgstRate: 2.5, totalGstRate: 5, isInclusive: false, active: true },
  { id: "TAX-05", name: "Restringing & Racquet Maintenance", hsnSac: "998729", category: "SERVICE", cgstRate: 9, sgstRate: 9, totalGstRate: 18, isInclusive: true, active: true },
];

export const INITIAL_SOCIAL_TEMPLATES: SocialTemplate[] = [
  {
    id: "SOC-TMP-01",
    title: "Friday Night Racquet Mixer & Social Ladder",
    sport: "tennis",
    recurrenceDay: "Friday",
    startTime: "18:00",
    endTime: "22:00",
    courtIds: ["CRT-T1", "CRT-T2", "CRT-T3"],
    capacity: 24,
    pricePerTier: { Gold: 0, Silver: 250, Junior: 200, Guest: 600 },
    includesRefreshments: true,
    active: true,
  },
  {
    id: "SOC-TMP-02",
    title: "Saturday Sunset Padel Americano",
    sport: "padel",
    recurrenceDay: "Saturday",
    startTime: "17:00",
    endTime: "20:00",
    courtIds: ["CRT-P1", "CRT-P2"],
    capacity: 16,
    pricePerTier: { Gold: 150, Silver: 350, Junior: 300, Guest: 750 },
    includesRefreshments: true,
    active: true,
  },
];

export const INITIAL_LEAVE_TYPES: LeaveType[] = [
  { id: "LEV-01", name: "Annual Casual Leave (CL)", paid: true, yearlyDays: 12, requiresDocument: false, description: "Paid casual time-off for personal commitments.", active: true },
  { id: "LEV-02", name: "Sick / Medical Leave (SL)", paid: true, yearlyDays: 10, requiresDocument: true, description: "Paid medical recovery leave; requires medical note for >2 days.", active: true },
  { id: "LEV-03", name: "Privilege Earned Leave (PL)", paid: true, yearlyDays: 15, requiresDocument: false, description: "Accrued annual vacation leave; requires 14-day advance notice.", active: true },
  { id: "LEV-04", name: "Compensatory Off (Comp-off)", paid: true, yearlyDays: 6, requiresDocument: false, description: "Awarded for weekend tournament shift duty.", active: true },
  { id: "LEV-05", name: "Loss of Pay (LWP)", paid: false, yearlyDays: 30, requiresDocument: false, description: "Unpaid leave beyond accrued statutory entitlements.", active: true },
];

export const INITIAL_SALARY_COMPONENTS: SalaryComponent[] = [
  { id: "SAL-01", name: "Basic Salary", type: "EARNING", calcType: "FIXED", defaultValue: 25000, isStatutory: true, description: "Statutory foundational monthly compensation.", active: true },
  { id: "SAL-02", name: "House Rent Allowance (HRA)", type: "EARNING", calcType: "PERCENTAGE", defaultValue: 40, isStatutory: true, description: "40% of basic pay as tax-exempt housing benefit.", active: true },
  { id: "SAL-03", name: "Special / Shift Allowance", type: "EARNING", calcType: "FIXED", defaultValue: 5000, isStatutory: false, description: "Courtside and late-night operational shift bonus.", active: true },
  { id: "SAL-04", name: "Provident Fund (Employee PF 12%)", type: "DEDUCTION", calcType: "PERCENTAGE", defaultValue: 12, isStatutory: true, description: "Statutory EPFO pension deduction on Basic.", active: true },
  { id: "SAL-05", name: "ESIC Contribution (0.75%)", type: "DEDUCTION", calcType: "PERCENTAGE", defaultValue: 0.75, isStatutory: true, description: "State employee medical insurance scheme.", active: true },
  { id: "SAL-06", name: "Maharashtra Professional Tax (PT)", type: "DEDUCTION", calcType: "FIXED", defaultValue: 200, isStatutory: true, description: "State revenue statutory labor tax.", active: true },
  { id: "SAL-07", name: "Income Tax (TDS on Salary)", type: "DEDUCTION", calcType: "FIXED", defaultValue: 1500, isStatutory: true, description: "Calculated slab-based tax deducted at source.", active: true },
];

export const INITIAL_NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: "TMPL-01",
    trigger: "BOOKING_CONFIRMATION",
    triggerLabel: "Booking Confirmation",
    channel: "EMAIL",
    subject: "Confirmed: {{court_name}} on {{booking_date}} at {{start_time}}",
    body: "Dear {{member_name}},\n\nYour court reservation is confirmed!\n\nCourt: {{court_name}}\nSport: {{sport_name}}\nDate: {{booking_date}}\nTime: {{start_time}} - {{end_time}}\nAmount Paid: {{amount_paid}}\n\nPlease check in at the reception 10 minutes before game time.\n\nWarm regards,\nThe Champions Club Concierge",
    availableVariables: ["{{member_name}}", "{{court_name}}", "{{sport_name}}", "{{booking_date}}", "{{start_time}}", "{{end_time}}", "{{amount_paid}}"],
    active: true,
  },
  {
    id: "TMPL-02",
    trigger: "BOOKING_CONFIRMATION",
    triggerLabel: "Booking Confirmation",
    channel: "SMS_WHATSAPP",
    body: "Hi {{member_name}}! Confirmed: {{court_name}} on {{booking_date}} @ {{start_time}}. QR Check-in: https://championsclub.in/app/bookings. See you on the court!",
    availableVariables: ["{{member_name}}", "{{court_name}}", "{{booking_date}}", "{{start_time}}"],
    active: true,
  },
  {
    id: "TMPL-03",
    trigger: "MEMBERSHIP_EXPIRY",
    triggerLabel: "Membership Expiry Reminder",
    channel: "EMAIL",
    subject: "Important: Your {{tier_name}} Membership expires in {{days_left}} days",
    body: "Dear {{member_name}},\n\nYour Champions Club {{tier_name}} subscription is scheduled to expire on {{expiry_date}}.\n\nRenew early to retain your complimentary booking privileges and pro shop loyalty credits.\n\nRenew online instantly: https://championsclub.in/app/membership\n\nBest,\nMembership Services",
    availableVariables: ["{{member_name}}", "{{tier_name}}", "{{days_left}}", "{{expiry_date}}"],
    active: true,
  },
  {
    id: "TMPL-04",
    trigger: "REGISTRATION_WELCOME",
    triggerLabel: "New Member Registration Welcome",
    channel: "EMAIL",
    subject: "Welcome to The Champions Club, {{member_name}}!",
    body: "Welcome {{member_name}}! Your digital membership card is ready. Download the web app to reserve courts, top-up your lounge tab, and join the Friday Social ladder.",
    availableVariables: ["{{member_name}}", "{{member_id}}", "{{tier_name}}"],
    active: true,
  },
];

export const INITIAL_DELIVERY_LOGS: NotificationDeliveryLog[] = [
  { id: "LOG-901", trigger: "BOOKING_CONFIRMATION", channel: "EMAIL", recipient: "pratham@championsclub.in", recipientName: "Pratham Patel", sentAt: "2026-10-03T18:05:00Z", status: "DELIVERED", attempts: 1 },
  { id: "LOG-902", trigger: "BOOKING_CONFIRMATION", channel: "SMS_WHATSAPP", recipient: "+91 98200 12345", recipientName: "Pratham Patel", sentAt: "2026-10-03T18:05:05Z", status: "DELIVERED", attempts: 1 },
  { id: "LOG-903", trigger: "MEMBERSHIP_EXPIRY", channel: "EMAIL", recipient: "rohan.varma@example.com", recipientName: "Rohan Varma", sentAt: "2026-10-03T09:00:00Z", status: "DELIVERED", attempts: 1 },
  { id: "LOG-904", trigger: "PAYMENT_RECEIPT", channel: "EMAIL", recipient: "ananya.iyer@example.com", recipientName: "Ananya Iyer", sentAt: "2026-10-02T19:30:00Z", status: "DELIVERED", attempts: 1 },
];

export const INITIAL_STAFF_USERS: StaffUser[] = [
  { id: "STF-001", name: "Sunita Deshmukh", email: "sunita@championsclub.in", phone: "+91 98200 99001", role: "ADMIN", groups: ["FRONT_DESK", "POS_BAR", "SHOP_INVENTORY", "CRM", "FINANCE"], status: "ACTIVE", lastLogin: "2026-10-04T00:01:00Z", employeeId: "EMP-001", isSelf: true },
  { id: "STF-002", name: "Aarav Mehta", email: "aarav.mehta@championsclub.in", phone: "+91 98200 99002", role: "STAFF", groups: ["POS_BAR"], status: "ACTIVE", lastLogin: "2026-10-03T23:10:00Z", employeeId: "EMP-005" },
  { id: "STF-003", name: "Rohit Verma", email: "rohit.verma@championsclub.in", phone: "+91 98200 99003", role: "STAFF", groups: ["FRONT_DESK"], status: "ACTIVE", lastLogin: "2026-10-03T19:40:00Z", employeeId: "EMP-002" },
  { id: "STF-004", name: "Anita Desai", email: "anita.desai@championsclub.in", phone: "+91 98200 99004", role: "STAFF", groups: ["SHOP_INVENTORY"], status: "ACTIVE", lastLogin: "2026-10-03T21:15:00Z", employeeId: "EMP-004" },
  { id: "STF-005", name: "Meera Iyer", email: "meera.iyer@championsclub.in", phone: "+91 98200 99005", role: "STAFF", groups: ["FRONT_DESK", "CRM"], status: "ACTIVE", lastLogin: "2026-10-03T17:30:00Z", employeeId: "EMP-003" },
  { id: "STF-006", name: "Kabir Khan", email: "kabir.khan@championsclub.in", phone: "+91 98200 99006", role: "STAFF", groups: ["POS_BAR"], status: "ACTIVE", lastLogin: "2026-10-03T22:50:00Z", employeeId: "EMP-006" },
  { id: "STF-007", name: "Devendra Mehta", email: "devendra.mehta@championsclub.in", phone: "+91 98200 99007", role: "STAFF", groups: ["FINANCE", "CRM"], status: "ACTIVE", lastLogin: "2026-10-02T16:00:00Z", employeeId: "EMP-007" },
];

export const INITIAL_PERMISSION_GROUPS: PermissionGroupDef[] = [
  {
    id: "GRP-01",
    key: "FRONT_DESK",
    name: "Front Desk & Reception",
    description: "Court check-in, member onboarding, walk-in bookings, member profile lookups, and counter fee collection.",
    isDefault: true,
    permissions: ["members.view", "members.manage", "memberships.manage", "bookings.view", "bookings.manage", "bookings.cancel", "social.manage", "checkin.manage", "enquiries.manage", "crm.leads.view", "crm.followups", "payments.take"],
  },
  {
    id: "GRP-02",
    key: "POS_BAR",
    name: "Bar & Food POS (F&B)",
    description: "Floor tables, open tabs, KDS kitchen tickets, bar beverage orders, automatic tier discounts, shift management.",
    isDefault: true,
    permissions: ["pos.use", "bar.orders.create", "bar.tables.manage", "bar.tabs.manage", "bar.discounts.auto", "payments.take", "bar.bills.close", "bar.shift.view", "bar.stock.view", "kds.use"],
  },
  {
    id: "GRP-03",
    key: "SHOP_INVENTORY",
    name: "Pro Shop & Inventory",
    description: "Equipment and apparel retail, barcode inventory scans, purchase orders, restringing intake, low-stock alerts.",
    isDefault: true,
    permissions: ["shop.products.manage", "inventory.view", "inventory.update", "shop.counter.sell", "shop.orders.manage", "lowstock.view", "shop.returns", "shop.po", "shop.restring", "shop.reports"],
  },
  {
    id: "GRP-04",
    key: "CRM",
    name: "CRM & Member Acquisition",
    description: "Trial requests, lead pipeline, follow-up reminders, corporate quotes, conversions, and campaign outreach.",
    isDefault: true,
    permissions: ["crm.leads.view", "crm.leads.manage", "crm.followups", "crm.quotes", "crm.convert", "crm.dashboard", "crm.campaigns", "enquiries.manage"],
  },
  {
    id: "GRP-05",
    key: "FINANCE",
    name: "Finance & Accounts",
    description: "Invoicing, accounts receivable, vendor bills, expense ledger, GST returns, and P&L analysis.",
    isDefault: true,
    permissions: ["finance.invoices", "finance.payments.view", "finance.payments.record", "finance.records", "finance.revenue.view", "finance.reports"],
  },
];

export const DEMO_SCRIPT_STEPS: DemoScriptStep[] = [
  { id: 1, title: "Register Junior → QR Member Card", description: "Register young athlete in Junior tier and view instant digital QR card.", srsRequirement: "MEM-01, MEM-02", targetPath: "/desk/register", buttonLabel: "Go to Register", completed: true },
  { id: 2, title: "6 PM Rush Race (Slot Taken & Daily Cap)", description: "Experience 2-booking daily cap and live conflict resolution.", srsRequirement: "BKG-07, BKG-12", targetPath: "/app/book", buttonLabel: "Go to Booking", completed: true },
  { id: 3, title: "Friday Social Mixer Fills & Waitlists", description: "View social ladder with automated waitlist promotion.", srsRequirement: "BKG-18, BKG-19", targetPath: "/app/social", buttonLabel: "Go to Social Play", completed: true },
  { id: 4, title: "Broken String Intake + Pro Shop Order", description: "Process 24h restringing job and low-stock replenishment alert.", srsRequirement: "SHP-08, SHP-14", targetPath: "/shop-console/restring", buttonLabel: "Go to Restringing", completed: true },
  { id: 5, title: "Bar 20 Orders → KDS → Tab Discount → Closing", description: "Kitchen display updates, tier tab discount, and end-of-day register closing.", srsRequirement: "BAR-01..09", targetPath: "/bar", buttonLabel: "Go to Bar Floor", completed: true },
  { id: 6, title: "Website Trial → CRM Lead → Quote → Member", description: "Full lead lifecycle conversion from public booking to paid membership.", srsRequirement: "CRM-01..06", targetPath: "/crm/leads", buttonLabel: "Go to CRM Leads", completed: true },
  { id: 7, title: "Owner Dashboard + Share Link + GST Audit", description: "Executive KPIs, peak heatmap, drill-down drawer, and public read-only link.", srsRequirement: "RPT-01..12", targetPath: "/owner", buttonLabel: "Go to Owner Dashboard", completed: true },
];

export const ACCESS_MATRIX_DATA: AccessMatrixRow[] = [
  { module: "Courts & Booking", screen: "Book a Court (/app/book)", path: "/app/book", memberAccess: "✓", groupAccess: { FRONT_DESK: "✓", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Courts & Booking", screen: "Operations Calendar (/admin/calendar)", path: "/admin/calendar", memberAccess: "—", groupAccess: { FRONT_DESK: "✓", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Courts & Booking", screen: "Court Blocks (/admin/blocks)", path: "/admin/blocks", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Front Desk", screen: "Desk Overview (/desk)", path: "/desk", memberAccess: "—", groupAccess: { FRONT_DESK: "✓", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Front Desk", screen: "Register Member (/desk/register)", path: "/desk/register", memberAccess: "—", groupAccess: { FRONT_DESK: "✓", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Pro Shop", screen: "Point of Sale (/shop-console)", path: "/shop-console", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "—", SHOP_INVENTORY: "✓", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Pro Shop", screen: "Inventory & Restock (/shop-console/inventory)", path: "/shop-console/inventory", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "—", SHOP_INVENTORY: "✓", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Bar & Lounge", screen: "Bar Floor (/bar)", path: "/bar", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "✓", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Bar & Lounge", screen: "Kitchen Display (/kds)", path: "/kds", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "✓", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "CRM", screen: "Leads Funnel (/crm/leads)", path: "/crm/leads", memberAccess: "—", groupAccess: { FRONT_DESK: "✓ (View)", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "✓ (Manage)", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Finance", screen: "Payments & Invoices (/finance)", path: "/finance", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "✓" }, adminAccess: "✓" },
  { module: "Executive & Admin", screen: "Owner Dashboard (/owner)", path: "/owner", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Executive & Admin", screen: "Staff & Permission Groups (/admin/staff)", path: "/admin/staff", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
  { module: "Executive & Admin", screen: "Immutable Audit Log (/admin/audit-log)", path: "/admin/audit-log", memberAccess: "—", groupAccess: { FRONT_DESK: "—", POS_BAR: "—", SHOP_INVENTORY: "—", CRM: "—", FINANCE: "—" }, adminAccess: "✓" },
];

// ─── STATE HOLDER ─────────────────────────────────────────────────────

interface AdminConfigState {
  profile: ClubProfile;
  courts: AdminCourt[];
  sports: SportType[];
  hours: DayOperatingHours[];
  holidays: HolidayRecord[];
  bookingRules: BookingRules;
  plans: AdminPlan[];
  pricingRules: PricingRule[];
  taxes: TaxRule[];
  socialTemplates: SocialTemplate[];
  leaveTypes: LeaveType[];
  salaryComponents: SalaryComponent[];
  notificationTemplates: NotificationTemplate[];
  deliveryLogs: NotificationDeliveryLog[];
  staffUsers: StaffUser[];
  permissionGroups: PermissionGroupDef[];
  demoSteps: DemoScriptStep[];
}

let state: AdminConfigState = {
  profile: INITIAL_CLUB_PROFILE,
  courts: INITIAL_ADMIN_COURTS,
  sports: INITIAL_SPORTS,
  hours: INITIAL_HOURS,
  holidays: INITIAL_HOLIDAYS,
  bookingRules: INITIAL_BOOKING_RULES,
  plans: INITIAL_ADMIN_PLANS,
  pricingRules: INITIAL_PRICING_RULES,
  taxes: INITIAL_TAX_RULES,
  socialTemplates: INITIAL_SOCIAL_TEMPLATES,
  leaveTypes: INITIAL_LEAVE_TYPES,
  salaryComponents: INITIAL_SALARY_COMPONENTS,
  notificationTemplates: INITIAL_NOTIFICATION_TEMPLATES,
  deliveryLogs: INITIAL_DELIVERY_LOGS,
  staffUsers: INITIAL_STAFF_USERS,
  permissionGroups: INITIAL_PERMISSION_GROUPS,
  demoSteps: DEMO_SCRIPT_STEPS,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

// ─── STORE API ────────────────────────────────────────────────────────

export const adminConfigStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return state;
  },

  // 1. Club Profile
  updateProfile(partial: Partial<ClubProfile>) {
    const prev = state.profile;
    state = { ...state, profile: { ...state.profile, ...partial } };
    emitChange();
    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "CONFIG_UPDATE",
      entity: "Club Profile",
      entityId: "CFG-MAIN",
      reason: "Updated club identity and billing configuration details",
      approver: "Sunita Deshmukh (Admin)",
      beforeState: prev,
      afterState: state.profile,
    });
    toast.success("Club profile & billing series updated successfully!");
  },

  // 2. Courts & Sports
  addCourt(court: Omit<AdminCourt, "id">) {
    const newCourt: AdminCourt = {
      id: `CRT-${court.sport.slice(0, 1).toUpperCase()}${state.courts.length + 1}`,
      ...court,
    };
    state = { ...state, courts: [...state.courts, newCourt] };
    emitChange();
    toast.success(`Court ${newCourt.name} added to club inventory!`);
  },

  updateCourt(id: string, updates: Partial<AdminCourt>) {
    state = {
      ...state,
      courts: state.courts.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    emitChange();
    toast.success("Court configuration updated!");
  },

  addSportType(name: string, defaultSlotMinutes: number = 60) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (state.sports.some((s) => s.id === id)) {
      toast.error("Sport type already exists.");
      return;
    }
    const newSport: SportType = {
      id,
      name,
      defaultSlotMinutes,
      isPopular: false,
      active: true,
    };
    state = { ...state, sports: [...state.sports, newSport] };
    emitChange();
    toast.success(`Sport type ${name} added successfully!`);
  },

  // 3. Operating Hours & Holidays
  updateDayHours(day: DayOperatingHours["day"], updates: Partial<DayOperatingHours>) {
    state = {
      ...state,
      hours: state.hours.map((h) => (h.day === day ? { ...h, ...updates } : h)),
    };
    emitChange();
    toast.success(`Operating hours for ${day} updated.`);
  },

  addHoliday(name: string, date: string, type: HolidayRecord["type"], notes?: string) {
    const newHoliday: HolidayRecord = {
      id: `HOL-${Date.now().toString().slice(-4)}`,
      name,
      date,
      type,
      ...(notes ? { notes } : {}),
    };
    state = { ...state, holidays: [...state.holidays, newHoliday] };
    emitChange();
    toast.success(`Holiday / closure on ${date} recorded.`);
  },

  removeHoliday(id: string) {
    state = {
      ...state,
      holidays: state.holidays.filter((h) => h.id !== id),
    };
    emitChange();
    toast.info("Holiday removed.");
  },

  // 4. Booking Rules
  updateBookingRules(updates: Partial<BookingRules>) {
    state = { ...state, bookingRules: { ...state.bookingRules, ...updates } };
    emitChange();
    toast.success("Court booking governance rules updated!");
  },

  // 5. Plans & Entitlements
  updatePlan(planId: string, updates: Partial<AdminPlan>) {
    state = {
      ...state,
      plans: state.plans.map((p) => (p.id === planId ? { ...p, ...updates } : p)),
    };
    emitChange();
    toast.success("Membership plan entitlements updated! Changes apply immediately.");
  },

  // 6. Pricing Rules & Simulator
  addPricingRule(rule: Omit<PricingRule, "id">) {
    const newRule: PricingRule = {
      id: `RULE-${Date.now().toString().slice(-4)}`,
      ...rule,
    };
    state = { ...state, pricingRules: [newRule, ...state.pricingRules] };
    emitChange();
    toast.success("Pricing rule added!");
  },

  updatePricingRule(id: string, updates: Partial<PricingRule>) {
    state = {
      ...state,
      pricingRules: state.pricingRules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    };
    emitChange();
    toast.success("Pricing rule updated!");
  },

  deletePricingRule(id: string) {
    state = {
      ...state,
      pricingRules: state.pricingRules.filter((r) => r.id !== id),
    };
    emitChange();
    toast.info("Pricing rule removed.");
  },

  /** Price Simulator Engine: evaluates hierarchy + detects Guest < Silver < Gold violation */
  simulatePrice(params: {
    sport: string;
    customerType: "GOLD" | "SILVER" | "JUNIOR" | "GUEST";
    dayType: "WEEKDAY" | "WEEKEND" | "HOLIDAY";
    timeBand: "PEAK" | "OFF_PEAK";
    date?: string;
  }): PriceSimulationResult {
    const applicable = state.pricingRules.filter((r) => {
      const sportMatch = r.sport === "all" || r.sport === params.sport;
      const custMatch = r.customerType === "ALL" || r.customerType === params.customerType;
      const dayMatch = r.dayType === "ALL" || r.dayType === params.dayType;
      const timeMatch = r.timeBand === "ALL" || r.timeBand === params.timeBand;
      return sportMatch && custMatch && dayMatch && timeMatch;
    });

    // Score rules by specificity: specific sport = +8, customer = +4, day = +2, time = +1
    applicable.sort((a, b) => {
      const score = (r: PricingRule) =>
        (r.sport !== "all" ? 8 : 0) +
        (r.customerType !== "ALL" ? 4 : 0) +
        (r.dayType !== "ALL" ? 2 : 0) +
        (r.timeBand !== "ALL" ? 1 : 0);
      return score(b) - score(a);
    });

    const winningRule = applicable[0] || null;
    let finalPrice = winningRule ? winningRule.pricePerHour : 600;

    // Check tier hierarchy for violations: Guest >= Silver >= Gold
    let goldRate = 0;
    let silverRate = 300;
    let guestRate = 600;

    const goldRule = state.pricingRules.find((r) => r.sport === params.sport && r.customerType === "GOLD");
    if (goldRule) goldRate = goldRule.pricePerHour;
    const silverRule = state.pricingRules.find((r) => r.sport === params.sport && r.customerType === "SILVER");
    if (silverRule) silverRate = silverRule.pricePerHour;
    const guestRule = state.pricingRules.find((r) => r.sport === params.sport && r.customerType === "GUEST");
    if (guestRule) guestRate = guestRule.pricePerHour;

    const isOrderingViolated = guestRate < silverRate || silverRate < goldRate;
    let orderingViolationMessage: string | undefined;
    if (isOrderingViolated) {
      orderingViolationMessage = `Rule Ordering Conflict: Guest tariff (₹${guestRate}) cannot be lower than Silver member tariff (₹${silverRate}) or Gold member tariff (₹${goldRate}). Policy mandates Guest ≥ Silver ≥ Gold.`;
    }

    const explanation = winningRule
      ? `Winning Rule: ${winningRule.id} (Specificity rank ${winningRule.priority}) for ${winningRule.customerType} ${winningRule.sport.toUpperCase()} during ${winningRule.timeBand} (${winningRule.dayType}).`
      : "Fallback default club tariff applied (₹600 / hr).";

    return {
      sport: params.sport,
      customerType: params.customerType,
      dayType: params.dayType,
      timeBand: params.timeBand,
      date: params.date || "2026-10-05",
      finalPrice,
      winningRule,
      ruleHierarchyExplanation: explanation,
      isOrderingViolated,
      orderingViolationMessage,
    };
  },

  // 7. Taxes
  updateTax(id: string, updates: Partial<TaxRule>) {
    state = {
      ...state,
      taxes: state.taxes.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    };
    emitChange();
    toast.success("GST rate configuration updated!");
  },

  // 8. Social Templates
  updateSocialTemplate(id: string, updates: Partial<SocialTemplate>) {
    state = {
      ...state,
      socialTemplates: state.socialTemplates.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    };
    emitChange();
    toast.success("Social play recurring template updated!");
  },

  // 9. Leave Types & Salary Components
  updateLeaveType(id: string, updates: Partial<LeaveType>) {
    state = {
      ...state,
      leaveTypes: state.leaveTypes.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    };
    emitChange();
    toast.success("Leave entitlement policy updated!");
  },

  updateSalaryComponent(id: string, updates: Partial<SalaryComponent>) {
    state = {
      ...state,
      salaryComponents: state.salaryComponents.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    };
    emitChange();
    toast.success("Salary component updated!");
  },

  // 10. Notification Templates & Test Trigger
  updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>) {
    state = {
      ...state,
      notificationTemplates: state.notificationTemplates.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    };
    emitChange();
    toast.success("Notification template saved.");
  },

  sendTestNotification(templateId: string, testRecipient: string) {
    const tmpl = state.notificationTemplates.find((t) => t.id === templateId);
    if (!tmpl) return;

    const newLog: NotificationDeliveryLog = {
      id: `LOG-${Date.now().toString().slice(-3)}`,
      trigger: tmpl.trigger,
      channel: tmpl.channel,
      recipient: testRecipient,
      recipientName: "Test Recipient",
      sentAt: new Date().toISOString(),
      status: "DELIVERED",
      attempts: 1,
    };

    state = {
      ...state,
      deliveryLogs: [newLog, ...state.deliveryLogs],
    };
    emitChange();
    toast.success(`Test ${tmpl.channel} dispatched to ${testRecipient}!`);
  },

  // 11. Staff Governance & Groups
  createStaffUser(user: { name: string; email: string; phone: string; groups: string[]; employeeId?: string }) {
    const newUser: StaffUser = {
      id: `STF-00${state.staffUsers.length + 1}`,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: "STAFF",
      groups: user.groups,
      status: "ACTIVE",
      lastLogin: "Never",
      ...(user.employeeId ? { employeeId: user.employeeId } : {}),
    };
    state = { ...state, staffUsers: [...state.staffUsers, newUser] };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "STAFF_CREATE",
      entity: "Staff Directory",
      entityId: `${newUser.id} (${newUser.name})`,
      reason: `Staff account provisioned with capability groups: ${user.groups.join(", ")}`,
      approver: "Sunita Deshmukh (Admin)",
      afterState: newUser,
    });

    toast.success(`Staff user ${user.name} created! Groups: ${user.groups.join(", ")}`);
  },

  updateStaffGroups(staffId: string, newGroups: string[], reason: string) {
    const staff = state.staffUsers.find((s) => s.id === staffId);
    if (!staff) return;

    // Safeguard: Cannot demote self if admin
    if (staff.isSelf && staff.role === "ADMIN") {
      toast.error("Security policy: You cannot alter permissions on your own active administrator account.");
      return;
    }

    const prevGroups = staff.groups;
    state = {
      ...state,
      staffUsers: state.staffUsers.map((s) => (s.id === staffId ? { ...s, groups: newGroups } : s)),
    };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "PERMISSION_GROUP_CHANGE",
      entity: "Staff Permissions",
      entityId: `${staff.id} (${staff.name})`,
      reason,
      approver: "Sunita Deshmukh (Admin)",
      beforeState: { groups: prevGroups },
      afterState: { groups: newGroups },
    });

    toast.success(`Permission groups updated for ${staff.name}!`);
  },

  deactivateStaff(staffId: string, reason: string) {
    const staff = state.staffUsers.find((s) => s.id === staffId);
    if (!staff) return;

    if (staff.isSelf) {
      toast.error("You cannot deactivate your own logged-in administrator account.");
      return;
    }

    // Check if last remaining admin
    const activeAdmins = state.staffUsers.filter((s) => s.role === "ADMIN" && s.status === "ACTIVE");
    if (staff.role === "ADMIN" && activeAdmins.length <= 1) {
      toast.error("Cannot deactivate the sole remaining club administrator.");
      return;
    }

    state = {
      ...state,
      staffUsers: state.staffUsers.map((s) => (s.id === staffId ? { ...s, status: "INACTIVE" } : s)),
    };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "STAFF_DEACTIVATE",
      entity: "Staff Account",
      entityId: `${staff.id} (${staff.name})`,
      reason,
      approver: "Sunita Deshmukh (Admin)",
      beforeState: { status: "ACTIVE" },
      afterState: { status: "INACTIVE" },
    });

    toast.info(`Staff account ${staff.name} deactivated.`);
  },

  promoteToAdmin(staffId: string, reason: string) {
    const staff = state.staffUsers.find((s) => s.id === staffId);
    if (!staff) return;

    state = {
      ...state,
      staffUsers: state.staffUsers.map((s) => (s.id === staffId ? { ...s, role: "ADMIN" } : s)),
    };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "ROLE_PROMOTION",
      entity: "Administrator Role Escalation",
      entityId: `${staff.id} (${staff.name})`,
      reason,
      approver: "Sunita Deshmukh (Admin)",
      beforeState: { role: "STAFF" },
      afterState: { role: "ADMIN" },
    });

    toast.success(`${staff.name} promoted to Administrator! Full console bypass granted.`);
  },

  // 12. Permission Groups Builder
  createPermissionGroup(group: { key: string; name: string; description: string; permissions: string[] }, reason: string) {
    const upperKey = group.key.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (state.permissionGroups.some((g) => g.key === upperKey)) {
      toast.error("Permission group key already exists.");
      return;
    }

    const newGroup: PermissionGroupDef = {
      id: `GRP-0${state.permissionGroups.length + 1}`,
      key: upperKey,
      name: group.name,
      description: group.description,
      isDefault: false,
      permissions: group.permissions,
    };

    state = {
      ...state,
      permissionGroups: [...state.permissionGroups, newGroup],
    };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "PERMISSION_GROUP_CHANGE",
      entity: "Permission Groups Configuration",
      entityId: newGroup.key,
      reason,
      approver: "Sunita Deshmukh (Admin)",
      afterState: newGroup,
    });

    toast.success(`Permission group ${newGroup.name} created! Available in staff selector immediately.`);
  },

  updatePermissionGroup(key: string, updates: Partial<PermissionGroupDef>, reason: string) {
    const existing = state.permissionGroups.find((g) => g.key === key);
    if (!existing) return;

    state = {
      ...state,
      permissionGroups: state.permissionGroups.map((g) => (g.key === key ? { ...g, ...updates } : g)),
    };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "PERMISSION_GROUP_CHANGE",
      entity: "Permission Group Policy",
      entityId: key,
      reason,
      approver: "Sunita Deshmukh (Admin)",
      beforeState: existing,
      afterState: { ...existing, ...updates },
    });

    toast.success(`Permission group ${existing.name} updated!`);
  },

  deletePermissionGroup(key: string, reason: string) {
    const group = state.permissionGroups.find((g) => g.key === key);
    if (!group) return;

    if (group.isDefault) {
      toast.error("Core standard permission groups (FRONT_DESK, POS_BAR, etc.) cannot be deleted.");
      return;
    }

    const assignedStaff = state.staffUsers.filter((s) => s.groups.includes(key));
    if (assignedStaff.length > 0) {
      toast.error(`Cannot delete group: Assigned to ${assignedStaff.length} active staff member(s). Reassign them first.`);
      return;
    }

    state = {
      ...state,
      permissionGroups: state.permissionGroups.filter((g) => g.key !== key),
    };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "PERMISSION_GROUP_CHANGE",
      entity: "Permission Group Removal",
      entityId: key,
      reason,
      approver: "Sunita Deshmukh (Admin)",
      beforeState: group,
    });

    toast.info(`Permission group ${group.name} removed.`);
  },

  // 13. Seed & Demo Data Reset
  resetDemoData(reason: string) {
    state = {
      profile: INITIAL_CLUB_PROFILE,
      courts: INITIAL_ADMIN_COURTS,
      sports: INITIAL_SPORTS,
      hours: INITIAL_HOURS,
      holidays: INITIAL_HOLIDAYS,
      bookingRules: INITIAL_BOOKING_RULES,
      plans: INITIAL_ADMIN_PLANS,
      pricingRules: INITIAL_PRICING_RULES,
      taxes: INITIAL_TAX_RULES,
      socialTemplates: INITIAL_SOCIAL_TEMPLATES,
      leaveTypes: INITIAL_LEAVE_TYPES,
      salaryComponents: INITIAL_SALARY_COMPONENTS,
      notificationTemplates: INITIAL_NOTIFICATION_TEMPLATES,
      deliveryLogs: INITIAL_DELIVERY_LOGS,
      staffUsers: INITIAL_STAFF_USERS,
      permissionGroups: INITIAL_PERMISSION_GROUPS,
      demoSteps: DEMO_SCRIPT_STEPS,
    };
    emitChange();

    adminAuditStore.logAction({
      userName: "Sunita Deshmukh",
      userRole: "ADMIN",
      action: "SEED_DATA_RESET",
      entity: "Database Seed Store",
      entityId: "SYS-SEED-ALL",
      reason,
      approver: "Sunita Deshmukh (Admin)",
    });

    toast.success("CCMS Demo dataset restored to initial state across all modules!");
  },
};

export function useAdminConfigStore() {
  const current = useSyncExternalStore(adminConfigStore.subscribe, adminConfigStore.getSnapshot);
  return {
    ...current,
    updateProfile: adminConfigStore.updateProfile,
    addCourt: adminConfigStore.addCourt,
    updateCourt: adminConfigStore.updateCourt,
    addSportType: adminConfigStore.addSportType,
    updateDayHours: adminConfigStore.updateDayHours,
    addHoliday: adminConfigStore.addHoliday,
    removeHoliday: adminConfigStore.removeHoliday,
    updateBookingRules: adminConfigStore.updateBookingRules,
    updatePlan: adminConfigStore.updatePlan,
    addPricingRule: adminConfigStore.addPricingRule,
    updatePricingRule: adminConfigStore.updatePricingRule,
    deletePricingRule: adminConfigStore.deletePricingRule,
    simulatePrice: adminConfigStore.simulatePrice,
    updateTax: adminConfigStore.updateTax,
    updateSocialTemplate: adminConfigStore.updateSocialTemplate,
    updateLeaveType: adminConfigStore.updateLeaveType,
    updateSalaryComponent: adminConfigStore.updateSalaryComponent,
    updateNotificationTemplate: adminConfigStore.updateNotificationTemplate,
    sendTestNotification: adminConfigStore.sendTestNotification,
    createStaffUser: adminConfigStore.createStaffUser,
    updateStaffGroups: adminConfigStore.updateStaffGroups,
    deactivateStaff: adminConfigStore.deactivateStaff,
    promoteToAdmin: adminConfigStore.promoteToAdmin,
    createPermissionGroup: adminConfigStore.createPermissionGroup,
    updatePermissionGroup: adminConfigStore.updatePermissionGroup,
    deletePermissionGroup: adminConfigStore.deletePermissionGroup,
    resetDemoData: adminConfigStore.resetDemoData,
  };
}
