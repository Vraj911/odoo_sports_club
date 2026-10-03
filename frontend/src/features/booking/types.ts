// ── Booking domain types ──

export type Sport = "tennis" | "padel" | "badminton" | "cricket-net";
export type MemberTier = "Gold" | "Silver" | "Junior" | "Guest";

export type SlotStatus =
  | "free"
  | "booked"
  | "held"
  | "blocked"
  | "social"
  | "mine"
  | "past"
  | "closed";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "WAITLISTED";

export interface Court {
  id: string;
  name: string;
  sport: Sport;
  indoor: boolean;
}

export interface SlotCell {
  courtId: string;
  time: string; // "HH:mm"
  status: SlotStatus;
  bookingId?: string | undefined;
  memberName?: string | undefined;
  memberInitials?: string | undefined;
  holdExpiry?: number | undefined; // Unix ms
  socialCurrent?: number | undefined;
  socialMax?: number | undefined;
  blockReason?: string | undefined;
}

export interface PriceQuote {
  guestRate: number;
  planDiscount: number;
  planName: string;
  ruleId: string;
  youPay: number;
}

export interface Booking {
  id: string;
  courtId: string;
  courtName: string;
  sport: Sport;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  price: number;
  memberName: string;
  memberId: string;
  createdAt: number;
  holdExpiry?: number | undefined;
}

export interface AlternativeSlot {
  courtId: string;
  courtName: string;
  time: string;
  date: string;
}

export const SPORT_LABELS: Record<Sport, string> = {
  tennis: "Tennis",
  padel: "Padel",
  badminton: "Badminton",
  "cricket-net": "Cricket Net",
};

export const SPORT_ICONS: Record<Sport, string> = {
  tennis: "🎾",
  padel: "🏓",
  badminton: "🏸",
  "cricket-net": "🏏",
};
