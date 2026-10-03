import type { MemberTier } from "@/features/booking/types";

export type MembershipStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "PENDING_PAYMENT"
  | "SUSPENDED";

export interface GuardianInfo {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  consentSigned: boolean;
  consentDate: string;
}

export interface MemberEntitlements {
  courtRate: number;
  courtDescription: string;
  shopDiscount: number;
  barDiscount: number;
  advanceBookingDays: number;
  guestPasses: number;
}

export interface NotificationPreference {
  email: boolean;
  inApp: boolean;
  sms: boolean;
}

export interface MemberProfile {
  id: string; // e.g. "CC-000123"
  name: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  tier: MemberTier;
  status: MembershipStatus;
  validTill: string; // YYYY-MM-DD
  daysRemaining: number;
  memberSince: string;
  avatar: string;
  qrToken: string;
  guardian?: GuardianInfo | undefined;
  entitlements: MemberEntitlements;
  tabLimit: number;
  tabBalance: number;
  notificationPreferences: Record<string, NotificationPreference>;
}

export interface MembershipPlan {
  id: string;
  name: string;
  tier: MemberTier;
  annualFee: number;
  courtRate: string;
  shopDiscount: string;
  barDiscount: string;
  advanceBookingDays: number;
  guestPasses: number;
  popular?: boolean | undefined;
  description: string;
}

export interface BarTabItem {
  id: string;
  name: string;
  category: "Beverage" | "Food" | "Snack";
  price: number;
  discount: number;
  quantity: number;
  timestamp: number;
  table: string;
  server: string;
}

export interface SettledTabRecord {
  id: string;
  date: string;
  itemsCount: number;
  total: number;
  discount: number;
  paidAmount: number;
  invoiceRef: string;
  paymentMethod: string;
  server: string;
}

export type OrderStatus =
  | "PLACED"
  | "PAID"
  | "PACKED"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "COLLECTED"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  image?: string | undefined;
}

export interface Order {
  id: string; // e.g. "ORD-9021"
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  orderType: "PICKUP" | "DELIVERY";
  date: string;
  createdAt: number;
  pickupCode: string;
  shippingAddress?: string | undefined;
  timeline: {
    status: OrderStatus;
    timestamp: number;
    note?: string | undefined;
  }[];
}

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "VOID";

export interface InvoiceLineItem {
  description: string;
  hsn: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string; // e.g. "INV-2026-0842"
  number: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  category: "MEMBERSHIP" | "COURT_BOOKING" | "PRO_SHOP" | "BAR_TAB";
  items: InvoiceLineItem[];
  subtotal: number;
  cgst: number; // 9%
  sgst: number; // 9%
  total: number;
  paidAt?: number | undefined;
  paymentMethod?: string | undefined;
  transactionRef?: string | undefined;
}

export type NotificationCategory =
  | "Bookings"
  | "Orders"
  | "Membership"
  | "Payments";

export interface ClubNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  read: boolean;
  timestamp: number;
  link?: string | undefined;
}
