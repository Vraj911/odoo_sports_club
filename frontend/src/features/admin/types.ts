// Domain types for CCMS Admin Operations & Configuration (Phase 11 & Phase 12)

export interface CourtResource {
  id: string;
  name: string;
  sport: "tennis" | "badminton" | "squash" | "padel" | "pickleball";
  isIndoor: boolean;
  status: "OPERATIONAL" | "MAINTENANCE";
}

export interface AdminResourceBooking {
  id: string;
  courtId: string;
  courtName: string;
  sport: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  memberName: string;
  memberTier: string;
  price: number;
  status: "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "MAINTENANCE";
  notes?: string;
}

export interface CourtBlockRecord {
  id: string;
  courtId: string;
  courtName: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: "MAINTENANCE" | "TOURNAMENT" | "WEATHER" | "VIP_EVENT";
  notes: string;
  status: "ACTIVE" | "RELEASED";
  blockedBy: string;
  createdAt: string;
  affectedBookingIds: string[];
}

export interface AdminOverrideRecord {
  id: string;
  type: "DAILY_CAP" | "PRICE_OVERRIDE" | "TIER_DISCOUNT";
  memberId: string;
  memberName: string;
  targetDate: string;
  beforeValue: string;
  afterValue: string;
  reason: string;
  approvedBy: string;
  timestamp: string;
}

export type ApprovalType =
  | "TAB_TRANSFER"
  | "VOID_COMP"
  | "BAR_REOPEN"
  | "STOCK_WRITEOFF"
  | "REFUND"
  | "LEAVE_APPROVAL";

export interface AdminApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  amount?: number;
  entityRef?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewComment?: string;
  reviewedAt?: string;
}

export interface UtilisationDataPoint {
  courtId: string;
  courtName: string;
  sport: string;
  availableHours: number;
  bookedHours: number;
  utilisationRate: number; // %
  peakHour: string;
  revenue: number;
}

// ─── PHASE 12 CONFIGURATION & SYSTEM TYPES ─────────────────────────────

export interface ClubProfile {
  name: string;
  tagline: string;
  logoUrl: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
  timezone: "Asia/Kolkata";
  currency: "INR";
  invoicePrefix: string;
  nextInvoiceNumber: number;
  billPrefix: string;
  nextBillNumber: number;
  receiptFooterNote: string;
}

export interface SportType {
  id: string;
  name: string;
  defaultSlotMinutes: number;
  isPopular: boolean;
  active: boolean;
}

export interface AdminCourt {
  id: string;
  name: string;
  sport: string;
  surface: string;
  isIndoor: boolean;
  status: "OPERATIONAL" | "MAINTENANCE";
  active: boolean;
  lightingFeePerHour?: number;
}

export interface DayOperatingHours {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  openTime: string; // HH:mm
  closeTime: string; // HH:mm
  isClosed: boolean;
}

export interface HolidayRecord {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: "PUBLIC_HOLIDAY" | "CLUB_MAINTENANCE" | "SPECIAL_EVENT";
  notes?: string;
}

export interface BookingRules {
  slotLengthMinutes: number; // default 60
  slotIntervalMinutes: number; // default 30
  dailyBookingCap: number; // default 2
  holdDurationMinutes: number; // default 5
  freeCancellationHoursBefore: number; // e.g. 12
  lateCancellationFeePercent: number; // e.g. 50%
  expiringSoonWarningDays: number; // default 15
  reminderDaysBeforeExpiry: number[]; // [30, 7, 1]
  expiredMemberPolicy: "BLOCK" | "GUEST_RATE";
}

export interface AdminPlan {
  id: string;
  name: string;
  tier: "Gold" | "Silver" | "Junior" | "Trial";
  monthlyFee: number;
  annualFee: number;
  validityDays: number;
  shopDiscountPercent: number;
  barDiscountPercent: number;
  advanceBookingDays: number;
  socialAccess: boolean;
  guestPassesCount: number;
  active: boolean;
  tagline: string;
  courtRates: Record<string, number>; // sport -> rate per hour (₹0 allowed)
  effectiveDate: string;
}

export interface PricingRule {
  id: string;
  sport: string;
  customerType: "GOLD" | "SILVER" | "JUNIOR" | "GUEST" | "ALL";
  dayType: "WEEKDAY" | "WEEKEND" | "HOLIDAY" | "ALL";
  timeBand: "PEAK" | "OFF_PEAK" | "ALL";
  validFrom: string; // YYYY-MM-DD
  validTo: string; // YYYY-MM-DD
  pricePerHour: number;
  priority: number; // Higher number = more specific
  notes?: string;
}

export interface PriceSimulationResult {
  sport: string;
  customerType: string;
  dayType: string;
  timeBand: string;
  date: string;
  finalPrice: number;
  winningRule: PricingRule | null;
  ruleHierarchyExplanation: string;
  isOrderingViolated: boolean; // Guest < Silver < Gold violation flag
  orderingViolationMessage?: string;
}

export interface TaxRule {
  id: string;
  name: string;
  hsnSac: string;
  category: "COURT" | "MEMBERSHIP" | "SHOP" | "BAR" | "SERVICE";
  cgstRate: number;
  sgstRate: number;
  totalGstRate: number;
  isInclusive: boolean;
  active: boolean;
}

export interface SocialTemplate {
  id: string;
  title: string;
  sport: string;
  recurrenceDay: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  courtIds: string[];
  capacity: number;
  pricePerTier: {
    Gold: number;
    Silver: number;
    Junior: number;
    Guest: number;
  };
  includesRefreshments: boolean;
  active: boolean;
}

export interface LeaveType {
  id: string;
  name: string;
  paid: boolean;
  yearlyDays: number;
  requiresDocument: boolean;
  description: string;
  active: boolean;
}

export interface SalaryComponent {
  id: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  calcType: "FIXED" | "PERCENTAGE";
  defaultValue: number;
  isStatutory: boolean; // PF, ESI, TDS
  description: string;
  active: boolean;
}

export type NotificationTrigger =
  | "REGISTRATION_WELCOME"
  | "BOOKING_CONFIRMATION"
  | "BOOKING_REMINDER"
  | "BOOKING_CANCELLED"
  | "WAITLIST_OFFER"
  | "MEMBERSHIP_EXPIRY"
  | "PAYMENT_RECEIPT"
  | "ORDER_STATUS"
  | "LOW_STOCK"
  | "NEW_LEAD"
  | "FOLLOWUP_DUE"
  | "LEAVE_DECISION"
  | "PAYSLIP_READY"
  | "SCHEDULED_REPORT";

export interface NotificationTemplate {
  id: string;
  trigger: NotificationTrigger;
  triggerLabel: string;
  channel: "EMAIL" | "IN_APP" | "SMS_WHATSAPP";
  subject?: string;
  body: string;
  availableVariables: string[];
  active: boolean;
}

export interface NotificationDeliveryLog {
  id: string;
  trigger: NotificationTrigger;
  channel: "EMAIL" | "IN_APP" | "SMS_WHATSAPP";
  recipient: string;
  recipientName: string;
  sentAt: string;
  status: "DELIVERED" | "QUEUED" | "FAILED";
  attempts: number;
  error?: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "STAFF" | "ADMIN";
  groups: string[]; // e.g. ["FRONT_DESK", "CRM"]
  status: "ACTIVE" | "INACTIVE";
  lastLogin: string;
  employeeId?: string;
  isSelf?: boolean;
}

export interface PermissionGroupDef {
  id: string;
  key: string; // UPPER_SNAKE e.g. "FRONT_DESK"
  name: string;
  description: string;
  isDefault: boolean;
  permissions: string[];
}

export interface AccessMatrixRow {
  module: string;
  screen: string;
  path: string;
  memberAccess: string;
  groupAccess: Record<string, string>; // groupKey -> "✓" | "—" | "Own data"
  adminAccess: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action:
    | "PRICE_OVERRIDE"
    | "REFUND"
    | "CAP_OVERRIDE"
    | "DISCOUNT_OVERRIDE"
    | "STOCK_ADJUSTMENT"
    | "PAYROLL_RUN"
    | "PERMISSION_GROUP_CHANGE"
    | "VOID_COMP"
    | "DAY_REOPEN"
    | "PERIOD_REOPEN"
    | "SUSPENSION"
    | "STAFF_CREATE"
    | "STAFF_DEACTIVATE"
    | "ROLE_PROMOTION"
    | "CONFIG_UPDATE"
    | "SEED_DATA_RESET";
  entity: string;
  entityId: string;
  reason: string;
  approver?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
}

export interface DemoScriptStep {
  id: number;
  title: string;
  description: string;
  srsRequirement: string;
  targetPath: string;
  buttonLabel: string;
  completed: boolean;
}
