import type { Court, MemberTier, Sport, SlotCell, Booking, PriceQuote, AlternativeSlot } from "./types";

// ── Sample Courts ──
export const COURTS: Court[] = [
  { id: "tc-1", name: "Tennis 1", sport: "tennis", indoor: false },
  { id: "tc-2", name: "Tennis 2", sport: "tennis", indoor: false },
  { id: "tc-3", name: "Tennis 3", sport: "tennis", indoor: true },
  { id: "pd-1", name: "Padel 1", sport: "padel", indoor: true },
  { id: "pd-2", name: "Padel 2", sport: "padel", indoor: true },
  { id: "bd-1", name: "Badminton 1", sport: "badminton", indoor: true },
  { id: "bd-2", name: "Badminton 2", sport: "badminton", indoor: true },
  { id: "cn-1", name: "Cricket Net 1", sport: "cricket-net", indoor: false },
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
        const s: SlotCell = {
          courtId: court.id,
          time,
          status: booking.status === "PENDING" ? "held" : "booked",
          bookingId: booking.id,
          memberName: booking.memberName,
          memberInitials: initials(booking.memberName),
          holdExpiry: booking.holdExpiry,
        };
        return s;
      }

      // Random pre-booked slots for realism
      const hash = (court.id + time + date).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
      if (hash % 7 === 0) {
        const rn = randomName();
        return {
          courtId: court.id,
          time,
          status: "booked",
          memberName: rn,
          memberInitials: initials(rn),
        };
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
