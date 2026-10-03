import type { MemberTier, Sport } from "@/features/booking/types";

export type DeskMemberStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "PENDING_PAYMENT"
  | "SUSPENDED";

export interface GuardianRecord {
  name: string;
  phone: string;
  relationship: string;
  consentSigned: boolean;
}

export interface MemberNote {
  id: string;
  staffName: string;
  timestamp: number;
  text: string;
  isPrivate: boolean;
}

export interface DeskMember {
  id: string; // e.g. "CC-000123"
  name: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  gender?: "M" | "F" | "Other" | undefined;
  address: string;
  tier: MemberTier;
  status: DeskMemberStatus;
  validTill: string; // YYYY-MM-DD
  daysRemaining: number;
  dues: number; // outstanding tab or invoice amount
  avatar: string;
  qrToken: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  guardian?: GuardianRecord | undefined;
  nextBooking?: {
    id: string;
    courtName: string;
    date: string;
    time: string;
    sport: Sport;
    status: string;
  } | undefined;
  tags: string[];
  notes: MemberNote[];
  memberSince: string;
}

export interface DeskCheckinEligibility {
  member: DeskMember;
  membershipValid: boolean;
  membershipStatusText: string;
  todayBooking: {
    id: string;
    courtName: string;
    time: string;
    sport: Sport;
    status: string;
  } | null;
  bookingStatusText: string;
  duesAmount: number;
  duesStatusText: string;
  canCheckIn: boolean;
}

export type BookingSource = "online" | "walk-in" | "phone";

export interface DeskBookingRecord {
  id: string;
  courtId: string;
  courtName: string;
  sport: Sport;
  date: string;
  startTime: string;
  endTime: string;
  memberName: string;
  memberId: string;
  tier: MemberTier | "Guest";
  price: number;
  status: "CONFIRMED" | "CHECKED_IN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  source: BookingSource;
  paymentMethod: "Cash" | "UPI" | "Card" | "Member Card" | "Pay Later";
  checkedInAt?: number | undefined;
  cancelledAt?: number | undefined;
  cancelReason?: string | undefined;
}

export interface DeskPaymentRecord {
  id: string; // TXN-xxx
  invoiceNumber: string;
  date: string;
  timestamp: number;
  memberId: string;
  memberName: string;
  category: "MEMBERSHIP" | "COURT" | "BAR" | "SHOP";
  amount: number;
  method: "Cash" | "UPI" | "Card" | "Member Tab";
  status: "COMPLETED" | "REFUNDED" | "VOID";
  source: BookingSource;
  reference?: string | undefined;
}
