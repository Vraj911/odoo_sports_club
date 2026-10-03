import { useState, useCallback, useEffect, useRef } from "react";
import type { Booking, SlotCell, Sport, MemberTier, PriceQuote, AlternativeSlot } from "./types";
import {
  COURTS,
  generateInitialGrid,
  generateSampleBookings,
  getQuote,
  findAlternativeSlots,
  MAX_BOOKINGS_PER_DAY,
  HOLD_SECONDS,
  addMinutes,
  SESSION_MINUTES,
  timeToMinutes,
  randomName,
  initials,
  TIME_SLOTS,
} from "./sampleData";

// ── Format date to YYYY-MM-DD ──
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── useBookings: manages the booking state for the grid and booking page ──
export function useBookings(currentTier: MemberTier = "Gold") {
  const [sport, setSport] = useState<Sport>("tennis");
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(new Date()));
  const [grid, setGrid] = useState<SlotCell[][]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulated error state → auto-clear after 1.5s
  const simulateLoad = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      // 10% chance of brief error
      if (Math.random() < 0.1) {
        setError("Brief network hiccup — retrying...");
        setTimeout(() => {
          setError(null);
          setLoading(false);
        }, 1200);
        return;
      }
      setLoading(false);
    }, 600);
  }, []);

  // Rebuild grid when sport or date changes
  useEffect(() => {
    simulateLoad();
    const sampleBookings = generateSampleBookings(selectedDate);
    const merged = [...sampleBookings, ...bookings.filter((b) => b.date === selectedDate)];
    const newGrid = generateInitialGrid(selectedDate, sport, merged);
    setGrid(newGrid);
  }, [sport, selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Today's bookings count (confirmed + pending, not cancelled)
  const todayBookingCount = bookings.filter(
    (b) =>
      b.date === selectedDate &&
      b.memberId === "SELF" &&
      b.status !== "CANCELLED" &&
      b.status !== "EXPIRED"
  ).length;

  const canBook = todayBookingCount < MAX_BOOKINGS_PER_DAY;

  // Get price quote
  const quote = useCallback(
    (s: Sport): PriceQuote => getQuote(s, currentTier),
    [currentTier]
  );

  // Create booking
  const createBooking = useCallback(
    (
      courtId: string,
      date: string,
      startTime: string,
    ): { success: boolean; booking?: Booking; error?: string } => {
      // Check cap
      const todayCount = bookings.filter(
        (b) =>
          b.date === date &&
          b.memberId === "SELF" &&
          b.status !== "CANCELLED" &&
          b.status !== "EXPIRED"
      ).length;
      if (todayCount >= MAX_BOOKINGS_PER_DAY) {
        return { success: false, error: "CAP_EXCEEDED" };
      }

      // Check overlap
      const court = COURTS.find((c) => c.id === courtId);
      if (!court) return { success: false, error: "INVALID_COURT" };

      const endTime = addMinutes(startTime, SESSION_MINUTES);
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);

      const overlap = bookings.find(
        (b) =>
          b.courtId === courtId &&
          b.date === date &&
          b.status !== "CANCELLED" &&
          b.status !== "EXPIRED" &&
          timeToMinutes(b.startTime) < endMin &&
          timeToMinutes(b.endTime) > startMin
      );

      if (overlap) {
        return { success: false, error: "SLOT_TAKEN" };
      }

      const priceQuote = getQuote(court.sport, currentTier);
      const isFree = priceQuote.youPay === 0;

      const booking: Booking = {
        id: `BK-${Date.now().toString(36).toUpperCase()}`,
        courtId,
        courtName: court.name,
        sport: court.sport,
        date,
        startTime,
        endTime,
        status: isFree ? "CONFIRMED" : "PENDING",
        price: priceQuote.youPay,
        memberName: "Demo Member",
        memberId: "SELF",
        createdAt: Date.now(),
        holdExpiry: isFree ? undefined : Date.now() + HOLD_SECONDS * 1000,
      };

      setBookings((prev) => [...prev, booking]);

      // Update grid
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) => {
            if (
              cell.courtId === courtId &&
              timeToMinutes(cell.time) >= startMin &&
              timeToMinutes(cell.time) < endMin
            ) {
              return {
                ...cell,
                status: isFree ? "mine" : "held",
                bookingId: booking.id,
                holdExpiry: booking.holdExpiry,
                memberName: "Demo Member",
                memberInitials: "DM",
              };
            }
            return cell;
          })
        )
      );

      return { success: true, booking };
    },
    [bookings, currentTier]
  );

  // Confirm booking (after payment)
  const confirmBooking = useCallback(
    (bookingId: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CONFIRMED" as const, holdExpiry: undefined } : b
        )
      );
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) =>
            cell.bookingId === bookingId
              ? { ...cell, status: "mine" as const, holdExpiry: undefined }
              : cell
          )
        )
      );
    },
    []
  );

  // Expire booking
  const expireBooking = useCallback(
    (bookingId: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "EXPIRED" as const, holdExpiry: undefined } : b
        )
      );
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) =>
            cell.bookingId === bookingId
              ? { ...cell, status: "free" as const, bookingId: undefined, holdExpiry: undefined, memberName: undefined, memberInitials: undefined }
              : cell
          )
        )
      );
    },
    []
  );

  // Cancel booking
  const cancelBooking = useCallback(
    (bookingId: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED" as const } : b
        )
      );
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) =>
            cell.bookingId === bookingId
              ? { ...cell, status: "free" as const, bookingId: undefined, holdExpiry: undefined, memberName: undefined, memberInitials: undefined }
              : cell
          )
        )
      );
    },
    []
  );

  // Find alternatives for a taken slot
  const getAlternatives = useCallback(
    (courtId: string, time: string): AlternativeSlot[] =>
      findAlternativeSlots(grid, selectedDate, sport, courtId, time),
    [grid, selectedDate, sport]
  );

  // Simulated live update: randomly book a free slot every ~8s
  useEffect(() => {
    const interval = setInterval(() => {
      setGrid((prev) => {
        const flatFree: { ri: number; ci: number }[] = [];
        prev.forEach((row, ri) => {
          row.forEach((cell, ci) => {
            if (cell.status === "free") flatFree.push({ ri, ci });
          });
        });
        if (flatFree.length === 0) return prev;

        const pick = flatFree[Math.floor(Math.random() * flatFree.length)];
        if (!pick) return prev;
        const rn = randomName();
        const next = prev.map((row, ri) =>
          ri === pick.ri
            ? row.map((cell, ci) =>
                ci === pick.ci
                  ? {
                      ...cell,
                      status: "booked" as const,
                      memberName: rn,
                      memberInitials: initials(rn),
                      _flash: true,
                    }
                  : cell
              )
            : row
        );
        return next;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return {
    sport,
    setSport,
    selectedDate,
    setSelectedDate,
    grid,
    setGrid,
    bookings,
    loading,
    error,
    todayBookingCount,
    canBook,
    quote,
    createBooking,
    confirmBooking,
    expireBooking,
    cancelBooking,
    getAlternatives,
    simulateLoad,
  };
}
