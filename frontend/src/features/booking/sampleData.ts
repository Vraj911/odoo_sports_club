import type {
  Court,
  MemberTier,
  Sport,
  SlotCell,
  Booking,
  PriceQuote,
  AlternativeSlot,
  SocialSession,
  SocialParticipant,
  SocialWaitlistEntry,
} from "./types";

// ── Sample Courts (Matched with Database UUIDs) ──
export const COURTS: Court[] = [
  { id: "6869edd3-d75d-4d32-9d70-2e641af5bf60", name: "Tennis 1", sport: "tennis", indoor: false },
  { id: "0c0b020a-8926-469d-89ec-61ae84bf8a22", name: "Tennis 2", sport: "tennis", indoor: false },
  { id: "ca6feb00-b627-420a-833e-c20f70b2e499", name: "Padel 1", sport: "padel", indoor: true },
  { id: "8d6085df-2915-4fb3-93bc-ed2c5c587f81", name: "Badminton 1", sport: "badminton", indoor: true },
  { id: "5a16e67f-4787-4c69-b81b-358217218e5a", name: "Cricket Net 1", sport: "cricket-net", indoor: false },
];

// ── Opening / Closing ──
export const OPEN_TIME = "06:00";
export const CLOSE_TIME = "22:00";
export const SESSION_MINUTES = 60;
export const SLOT_INTERVAL = 30; // minutes per column
export const MAX_BOOKINGS_PER_DAY = 2;
export const HOLD_SECONDS = 5 * 60; // 5 minutes

// ── Pricing per 60 min (INR) by sport × tier ──
export const PRICING: Record<Sport, Record<MemberTier, number>> = {
  tennis:       { Gold: 0, Silver: 300, Junior: 200, Guest: 600 },
  padel:        { Gold: 0, Silver: 400, Junior: 300, Guest: 800 },
  badminton:    { Gold: 0, Silver: 200, Junior: 150, Guest: 400 },
  "cricket-net": { Gold: 0, Silver: 500, Junior: 350, Guest: 1000 },
};

// ── Advance booking window by tier (days) ──
export const ADVANCE_DAYS: Record<MemberTier, number> = {
  Gold: 14,
  Silver: 10,
  Junior: 7,
  Guest: 3,
};

// ── Parse "HH:mm" safely ──
function parseTime(t: string): [number, number] {
  const parts = t.split(":");
  return [Number(parts[0] ?? 0), Number(parts[1] ?? 0)];
}

// ── Parse "YYYY-MM-DD" safely ──
function parseDate(d: string): [number, number, number] {
  const parts = d.split("-");
  return [Number(parts[0] ?? 0), Number(parts[1] ?? 0), Number(parts[2] ?? 0)];
}

// ── Generate time slots from open to last bookable start ──
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const [openH, openM] = parseTime(OPEN_TIME);
  const [closeH, closeM] = parseTime(CLOSE_TIME);
  const openMin = openH * 60 + openM;
  const closeMin = closeH * 60 + closeM;
  const lastStart = closeMin - SESSION_MINUTES;

  for (let m = openMin; m <= lastStart; m += SLOT_INTERVAL) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

// ── Compute price quote ──
export function getQuote(sport: Sport, tier: MemberTier): PriceQuote {
  const guestRate = PRICING[sport].Guest;
  const tierRate = PRICING[sport][tier];
  const discount = guestRate - tierRate;
  return {
    guestRate,
    planDiscount: discount,
    planName: tier,
    ruleId: `R-${sport.slice(0, 2).toUpperCase()}-${tier.slice(0, 1)}`,
    youPay: tierRate,
  };
}

// ── Helper: add time string ──
export function addMinutes(time: string, mins: number): string {
  const [h, m] = parseTime(time);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ── Helper: time to minutes ──
export function timeToMinutes(time: string): number {
  const [h, m] = parseTime(time);
  return h * 60 + m;
}

// ── Helper: is slot past ──
export function isSlotPast(date: string, time: string): boolean {
  const now = new Date();
  const [y, mo, d] = parseDate(date);
  const [h, m] = parseTime(time);
  const slotDate = new Date(y, mo - 1, d, h, m);
  return slotDate < now;
}

// ── Helper: can fit 60 min ──
export function canFitSession(time: string): boolean {
  const [closeH, closeM] = parseTime(CLOSE_TIME);
  const closeMin = closeH * 60 + closeM;
  const slotMin = timeToMinutes(time);
  return slotMin + SESSION_MINUTES <= closeMin;
}

// ── Indian names for realistic sample data ──
const INDIAN_NAMES: string[] = [
  "Arjun Mehta", "Priya Sharma", "Rohan Kapoor", "Ananya Iyer",
  "Vikram Singh", "Neha Gupta", "Karthik Nair", "Divya Joshi",
  "Suresh Reddy", "Meera Patel", "Amit Agarwal", "Pooja Verma",
  "Rajesh Kumar", "Sneha Rao", "Aditya Bhat", "Kavita Deshmukh",
];

export function randomName(): string {
  return INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)] ?? "Guest";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Sample pre-existing bookings ──
export function generateSampleBookings(date: string): Booking[] {
  return [
    {
      id: "BK-1001",
      courtId: "tc-1",
      courtName: "Tennis 1",
      sport: "tennis",
      date,
      startTime: "09:00",
      endTime: "10:00",
      status: "CONFIRMED",
      price: 0,
      memberName: "Arjun Mehta",
      memberId: "M-001",
      createdAt: Date.now() - 3600_000,
    },
    {
      id: "BK-1002",
      courtId: "tc-2",
      courtName: "Tennis 2",
      sport: "tennis",
      date,
      startTime: "10:00",
      endTime: "11:00",
      status: "CONFIRMED",
      price: 300,
      memberName: "Priya Sharma",
      memberId: "M-002",
      createdAt: Date.now() - 7200_000,
    },
    {
      id: "BK-1003",
      courtId: "pd-1",
      courtName: "Padel 1",
      sport: "padel",
      date,
      startTime: "11:00",
      endTime: "12:00",
      status: "CONFIRMED",
      price: 0,
      memberName: "Vikram Singh",
      memberId: "M-003",
      createdAt: Date.now() - 1800_000,
    },
  ];
}

// ── Generate initial slot grid ──
export function generateInitialGrid(
  date: string,
  sport: Sport,
  existingBookings: Booking[]
): SlotCell[][] {
  const courts = COURTS.filter((c) => c.sport === sport);

  return courts.map((court) => {
    return TIME_SLOTS.map((time): SlotCell => {
      const isPast = isSlotPast(date, time);
      const canFit = canFitSession(time);

      // Check if this slot is booked
      const booking = existingBookings.find(
        (b) =>
          b.courtId === court.id &&
          b.date === date &&
          timeToMinutes(time) >= timeToMinutes(b.startTime) &&
          timeToMinutes(time) < timeToMinutes(b.endTime) &&
          (b.status === "CONFIRMED" || b.status === "PENDING")
      );

      if (isPast) {
        return { courtId: court.id, time, status: "past" };
      }
      if (!canFit) {
        return { courtId: court.id, time, status: "closed" };
      }
      if (booking) {
        const isMine = booking.memberId === "SELF";
        const s: SlotCell = {
          courtId: court.id,
          time,
          status: isMine ? "mine" : booking.status === "PENDING" ? "held" : "booked",
          bookingId: booking.id,
          memberName: booking.memberName,
          memberInitials: initials(booking.memberName),
          holdExpiry: booking.holdExpiry,
        };
        return s;
      }
      if (hash % 11 === 0) {
        return {
          courtId: court.id,
          time,
          status: "social",
          socialCurrent: 3 + (hash % 5),
          socialMax: 8,
        };
      }
      if (hash % 23 === 0) {
        return {
          courtId: court.id,
          time,
          status: "blocked",
          blockReason: "Maintenance",
        };
      }

      return { courtId: court.id, time, status: "free" };
    });
  });
}

// ── Find alternative free slots ──
export function findAlternativeSlots(
  grid: SlotCell[][],
  date: string,
  sport: Sport,
  excludeCourtId: string,
  excludeTime: string,
  maxResults = 4
): AlternativeSlot[] {
  const courts = COURTS.filter((c) => c.sport === sport);
  const results: AlternativeSlot[] = [];

  for (const row of grid) {
    for (const cell of row) {
      if (results.length >= maxResults) break;
      if (cell.status !== "free") continue;
      if (cell.courtId === excludeCourtId && cell.time === excludeTime) continue;
      if (!canFitSession(cell.time)) continue;

      const court = courts.find((c) => c.id === cell.courtId);
      if (court) {
        results.push({
          courtId: cell.courtId,
          courtName: court.name,
          time: cell.time,
          date,
        });
      }
    }
  }

  return results;
}

// ── Offset Date Helper: "YYYY-MM-DD" ──
export function formatOffsetDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ── Upcoming Fridays Helper ──
export function getNextFridays(count = 3): string[] {
  const fridays: string[] = [];
  const current = new Date();
  const dayOfWeek = current.getDay(); // 0 is Sun, 5 is Fri
  let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  if (daysUntilFriday === 0 && current.getHours() >= 22) {
    daysUntilFriday = 7;
  }
  const nextFriday = new Date(current);
  nextFriday.setDate(current.getDate() + daysUntilFriday);

  for (let i = 0; i < count; i++) {
    const f = new Date(nextFriday);
    f.setDate(nextFriday.getDate() + i * 7);
    const y = f.getFullYear();
    const m = String(f.getMonth() + 1).padStart(2, "0");
    const d = String(f.getDate()).padStart(2, "0");
    fridays.push(`${y}-${m}-${d}`);
  }
  return fridays;
}

// ── Cancellation Policy Result ──
export interface CancellationPolicyResult {
  freeCancellation: boolean;
  hoursRemaining: number;
  cancellationFee: number;
  refundAmount: number;
  originalPrice: number;
  policySummary: string;
}

// ── Cancellation Policy: free until 4 hours before slot, 50% fee thereafter ──
export function calculateCancellationPolicy(
  booking: Booking,
  now: Date = new Date()
): CancellationPolicyResult {
  const [y, m, d] = parseDate(booking.date);
  const [h, min] = parseTime(booking.startTime);
  const slotStart = new Date(y, m - 1, d, h, min);

  const diffMs = slotStart.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  const originalPrice = booking.price;

  if (originalPrice === 0) {
    return {
      freeCancellation: true,
      hoursRemaining,
      cancellationFee: 0,
      refundAmount: 0,
      originalPrice: 0,
      policySummary: "Complimentary booking: No cancellation fee applies. Slot will be released immediately.",
    };
  }

  // Free cancellation until 4 hours before
  if (hoursRemaining >= 4) {
    return {
      freeCancellation: true,
      hoursRemaining,
      cancellationFee: 0,
      refundAmount: originalPrice,
      originalPrice,
      policySummary: `Free cancellation (> 4 h before slot): Full refund of ₹${originalPrice} will be credited to original payment.`,
    };
  }

  // Within 4 hours of slot
  const fee = Math.round(originalPrice * 0.5);
  const refund = originalPrice - fee;
  return {
    freeCancellation: false,
    hoursRemaining,
    cancellationFee: fee,
    refundAmount: refund,
    originalPrice,
    policySummary: `Late cancellation (within 4 h of slot): 50% cancellation fee applies (₹${fee}). Refund of ₹${refund} will be credited to original payment.`,
  };
}

// ── Sample Member Bookings for /app/bookings ──
export function generateInitialMemberBookings(): Booking[] {
  const [fri1] = getNextFridays(1);
  const friDate = fri1 ?? formatOffsetDate(2);
  const now = Date.now();

  return [
    {
      id: "BK-8021",
      courtId: "tc-2",
      courtName: "Tennis 2",
      sport: "tennis",
      date: friDate,
      startTime: "18:00",
      endTime: "19:00",
      status: "CONFIRMED",
      price: 300,
      guestRate: 600,
      planDiscount: 300,
      ruleId: "R-TE-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000 * 2,
      paid: true,
      paymentStatus: "PAID",
      paymentMethod: "UPI (Razorpay)",
      paidAt: now - 86400000 * 2 + 120000,
      checkinCode: "CC-8021-TC2",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000 * 2, note: "Slot held for 5 minutes" },
        { status: "CONFIRMED", timestamp: now - 86400000 * 2 + 120000, note: "Payment of ₹300 received via UPI" },
      ],
    },
    {
      id: "BK-8022",
      courtId: "pd-1",
      courtName: "Padel 1",
      sport: "padel",
      date: formatOffsetDate(3),
      startTime: "10:00",
      endTime: "11:00",
      status: "CONFIRMED",
      price: 400,
      guestRate: 800,
      planDiscount: 400,
      ruleId: "R-PA-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000,
      paid: false,
      paymentStatus: "UNPAID",
      isRepriced: true,
      repricedReason: "Re-priced at new rate due to seasonal tier revision",
      checkinCode: "CC-8022-PD1",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000, note: "Booking reserved" },
        { status: "CONFIRMED", timestamp: now - 86400000 + 60000, note: "Confirmed under pay-at-desk terms" },
      ],
    },
    {
      id: "BK-8023",
      courtId: "bd-1",
      courtName: "Badminton 1",
      sport: "badminton",
      date: formatOffsetDate(0), // Today! Starts soon to test within-4h policy
      startTime: "16:00",
      endTime: "17:00",
      status: "CONFIRMED",
      price: 200,
      guestRate: 400,
      planDiscount: 200,
      ruleId: "R-BA-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 3600000 * 8,
      paid: true,
      paymentStatus: "PAID",
      paymentMethod: "Credit Card (HDFC)",
      paidAt: now - 3600000 * 8 + 90000,
      checkinCode: "CC-8023-BD1",
      timeline: [
        { status: "PENDING", timestamp: now - 3600000 * 8, note: "Slot reserved" },
        { status: "CONFIRMED", timestamp: now - 3600000 * 8 + 90000, note: "Payment of ₹200 confirmed" },
      ],
    },
    {
      id: "BK-8024",
      courtId: "cn-1",
      courtName: "Cricket Net 1",
      sport: "cricket-net",
      date: formatOffsetDate(5),
      startTime: "19:00",
      endTime: "20:00",
      status: "CONFIRMED",
      price: 500,
      guestRate: 1000,
      planDiscount: 500,
      ruleId: "R-CR-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000 * 3,
      paid: true,
      paymentStatus: "PAID",
      paymentMethod: "UPI (Google Pay)",
      paidAt: now - 86400000 * 3 + 45000,
      checkinCode: "CC-8024-CN1",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000 * 3, note: "Slot reserved" },
        { status: "CONFIRMED", timestamp: now - 86400000 * 3 + 45000, note: "Paid ₹500 via UPI" },
      ],
    },
    // Past completed
    {
      id: "BK-7910",
      courtId: "tc-1",
      courtName: "Tennis 1",
      sport: "tennis",
      date: formatOffsetDate(-4),
      startTime: "17:00",
      endTime: "18:00",
      status: "COMPLETED",
      price: 300,
      guestRate: 600,
      planDiscount: 300,
      ruleId: "R-TE-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000 * 7,
      paid: true,
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      paidAt: now - 86400000 * 7 + 100000,
      checkinCode: "CC-7910-TC1",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000 * 7 },
        { status: "CONFIRMED", timestamp: now - 86400000 * 7 + 100000 },
        { status: "CHECKED_IN", timestamp: now - 86400000 * 4 - 3600000 * 1, note: "Checked in at reception desk" },
        { status: "COMPLETED", timestamp: now - 86400000 * 4, note: "Session concluded" },
      ],
    },
    {
      id: "BK-7895",
      courtId: "pd-2",
      courtName: "Padel 2",
      sport: "padel",
      date: formatOffsetDate(-7),
      startTime: "18:00",
      endTime: "19:00",
      status: "COMPLETED",
      price: 400,
      guestRate: 800,
      planDiscount: 400,
      ruleId: "R-PA-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000 * 10,
      paid: true,
      paymentStatus: "PAID",
      paymentMethod: "Credit Card",
      checkinCode: "CC-7895-PD2",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000 * 10 },
        { status: "CONFIRMED", timestamp: now - 86400000 * 10 + 60000 },
        { status: "CHECKED_IN", timestamp: now - 86400000 * 7 - 3600000 * 1 },
        { status: "COMPLETED", timestamp: now - 86400000 * 7 },
      ],
    },
    {
      id: "BK-7850",
      courtId: "bd-2",
      courtName: "Badminton 2",
      sport: "badminton",
      date: formatOffsetDate(-12),
      startTime: "09:00",
      endTime: "10:00",
      status: "NO_SHOW",
      price: 200,
      guestRate: 400,
      planDiscount: 200,
      ruleId: "R-BA-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000 * 15,
      paid: true,
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      checkinCode: "CC-7850-BD2",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000 * 15 },
        { status: "CONFIRMED", timestamp: now - 86400000 * 15 + 100000 },
        { status: "NO_SHOW", timestamp: now - 86400000 * 12 + 3600000 * 1, note: "Member did not arrive within grace period" },
      ],
    },
    // Cancelled
    {
      id: "BK-7988",
      courtId: "tc-3",
      courtName: "Tennis 3",
      sport: "tennis",
      date: formatOffsetDate(-2),
      startTime: "15:00",
      endTime: "16:00",
      status: "CANCELLED",
      price: 300,
      guestRate: 600,
      planDiscount: 300,
      ruleId: "R-TE-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000 * 5,
      paid: true,
      paymentStatus: "REFUNDED",
      paymentMethod: "UPI",
      refundAmount: 300,
      cancellationFee: 0,
      cancelledAt: now - 86400000 * 3,
      cancelReason: "Heavy rain forecasted — cancelled 24h prior",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000 * 5 },
        { status: "CONFIRMED", timestamp: now - 86400000 * 5 + 120000 },
        { status: "CANCELLED", timestamp: now - 86400000 * 3, note: "Cancelled > 4h before. Full refund ₹300 processed." },
      ],
    },
    {
      id: "BK-7952",
      courtId: "pd-1",
      courtName: "Padel 1",
      sport: "padel",
      date: formatOffsetDate(-5),
      startTime: "19:00",
      endTime: "20:00",
      status: "CANCELLED",
      price: 400,
      guestRate: 800,
      planDiscount: 400,
      ruleId: "R-PA-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 86400000 * 8,
      paid: true,
      paymentStatus: "PARTIAL_REFUND",
      paymentMethod: "Credit Card",
      refundAmount: 200,
      cancellationFee: 200,
      cancelledAt: now - 86400000 * 5 - 3600000 * 2,
      cancelReason: "Flight delayed (cancelled 2h prior to slot)",
      timeline: [
        { status: "PENDING", timestamp: now - 86400000 * 8 },
        { status: "CONFIRMED", timestamp: now - 86400000 * 8 + 60000 },
        { status: "CANCELLED", timestamp: now - 86400000 * 5 - 3600000 * 2, note: "Cancelled within 4h. 50% fee ₹200 applied, ₹200 refunded." },
      ],
    },
    // Waitlisted
    {
      id: "BK-8055",
      courtId: "bd-2",
      courtName: "Badminton 2",
      sport: "badminton",
      date: formatOffsetDate(4),
      startTime: "18:00",
      endTime: "19:00",
      status: "WAITLISTED",
      price: 200,
      guestRate: 400,
      planDiscount: 200,
      ruleId: "R-BA-S",
      planName: "Silver",
      memberName: "Arjun Mehta",
      memberId: "SELF",
      createdAt: now - 3600000 * 4,
      waitlistPosition: 2,
      paid: false,
      paymentStatus: "UNPAID",
      timeline: [
        { status: "WAITLISTED", timestamp: now - 3600000 * 4, note: "Joined waitlist at position #2" },
      ],
    },
  ];
}

// ── Sample Friday Social Sessions ──
export function generateSampleSocialSessions(): SocialSession[] {
  const [fri1, fri2, fri3] = getNextFridays(3);

  return [
    {
      id: "SOC-101",
      title: "Friday Night Padel Social",
      sport: "padel",
      courtId: "pd-1",
      courtName: "Padel 1",
      date: fri1 ?? formatOffsetDate(2),
      startTime: "18:00",
      endTime: "22:00",
      capacity: 8,
      participants: [],
      waitlist: [],
      pricing: { Gold: 0, Silver: 150, Junior: 100, Guest: 300 },
      description: "Fast-paced Americano format padel mixer with music and courtside drinks. All skill levels welcome!",
    },
    {
      id: "SOC-102",
      title: "Friday Tennis Doubles Mixer",
      sport: "tennis",
      courtId: "tc-2",
      courtName: "Tennis 2",
      date: fri1 ?? formatOffsetDate(2),
      startTime: "18:00",
      endTime: "21:00",
      capacity: 8,
      participants: [],
      waitlist: [],
      pricing: { Gold: 0, Silver: 200, Junior: 150, Guest: 400 },
      description: "King of the Court rotating doubles. 20-minute timed games with sudden-death deuce.",
    },
    {
      id: "SOC-103",
      title: "Friday Smash Badminton Rally",
      sport: "badminton",
      courtId: "bd-1",
      courtName: "Badminton 1",
      date: fri2 ?? formatOffsetDate(9),
      startTime: "19:00",
      endTime: "22:00",
      capacity: 8,
      participants: [],
      waitlist: [],
      pricing: { Gold: 0, Silver: 150, Junior: 100, Guest: 300 },
      description: "Social badminton doubles ladder. High tempo games, feather shuttles provided.",
    },
  ];
}
