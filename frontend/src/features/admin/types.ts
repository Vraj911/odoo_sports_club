// Domain types for CCMS Admin Operations (Phase 11)

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
