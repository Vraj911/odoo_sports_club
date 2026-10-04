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
  initials,
} from "./sampleData";

import { bookingApi } from "@/services/api/bookingApi";
import { memberStore } from "@/features/member/memberStore";

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

  // Load real bookings from backend
  const loadBookings = useCallback(async (date: string, curSport: Sport, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const profile = memberStore.getState().profile;
      const backendBookings = await bookingApi.listBookings({ date });
      const mapped: Booking[] = (backendBookings || []).map((b) => {
        const isMine =
          (profile.id && b.memberId && b.memberId.toLowerCase() === profile.id.toLowerCase()) ||
          (profile.name && b.memberName && b.memberName.toLowerCase() === profile.name.toLowerCase());
        return {
          id: b.id,
          courtId: b.courtId,
          courtName: b.courtName,
          sport: (b.sport as Sport) || curSport,
          date: b.date,
          startTime: b.startTime,
          endTime: b.endTime,
          status: (b.status as Booking["status"]) || "CONFIRMED",
          price: b.price || 0,
          paymentStatus: b.paymentStatus || "PAID",
          memberId: isMine ? "SELF" : b.memberId || "OTHER",
          memberName: b.memberName || "Booked",
          memberTier: "Gold" as MemberTier,
          guestCount: 0,
          createdAt: Date.now(),
        };
      });

      setBookings(mapped);
      const newGrid = generateInitialGrid(date, curSport, mapped);
      setGrid(newGrid);
      if (!silent) setLoading(false);
    } catch (e) {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial and reactive load on sport or date change
  useEffect(() => {
    loadBookings(selectedDate, sport, false);
  }, [sport, selectedDate, loadBookings]);

  // Real-time polling every 2.5s for live multi-tab & multi-user synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      loadBookings(selectedDate, sport, true);
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedDate, sport, loadBookings]);

  // Today's bookings count for current member
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

  // Create booking with backend synchronization & concurrency prevention
  const createBooking = useCallback(
    async (
      courtId: string,
      date: string,
      startTime: string
    ): Promise<{ success: boolean; booking?: Booking; error?: string; alternatives?: AlternativeSlot[] }> => {
      const court = COURTS.find((c) => c.id === courtId);
      if (!court) return { success: false, error: "INVALID_COURT" };

      const endTime = addMinutes(startTime, SESSION_MINUTES);
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);

      const priceQuote = getQuote(court.sport, currentTier);
      const isFree = priceQuote.youPay === 0;
      const profile = memberStore.getState().profile;

      try {
        const res = await bookingApi.createBooking({
          courtId,
          date,
          startTime,
          endTime,
          sport: court.sport,
          memberTier: currentTier,
          price: priceQuote.youPay,
          memberId: profile.id,
          guestName: profile.name,
          guestPhone: profile.phone,
        });

        const newBooking: Booking = {
          id: res.id || `BK-${Date.now().toString(36).toUpperCase()}`,
          courtId,
          courtName: res.courtName || court.name,
          sport: court.sport,
          date,
          startTime,
          endTime,
          status: isFree ? "CONFIRMED" : "PENDING",
          price: priceQuote.youPay,
          memberName: profile.name || "Member",
          memberId: "SELF",
          createdAt: Date.now(),
          holdExpiry: isFree ? undefined : Date.now() + HOLD_SECONDS * 1000,
        };

        setBookings((prev) => [...prev, newBooking]);

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
                  bookingId: newBooking.id,
                  holdExpiry: newBooking.holdExpiry,
                  memberName: profile.name,
                  memberInitials: initials(profile.name || "ME"),
                };
              }
              return cell;
            })
          )
        );

        // Notify memberStore to reload notifications immediately
        memberStore.loadNotifications();

        return { success: true, booking: newBooking };
      } catch (err: any) {
        // Immediately reload backend bookings to show real slot occupant
        await loadBookings(date, sport, true);
        const errDetails = err?.response?.data?.details;
        const alts = errDetails?.alternatives || [];
        return {
          success: false,
          error: "SLOT_TAKEN",
          alternatives: Array.isArray(alts) && alts.length > 0
            ? alts.map((a: any) => ({
                courtId: a.courtId || courtId,
                courtName: a.courtName || court.name,
                time: a.time || startTime,
                sport: court.sport,
              }))
            : findAlternativeSlots(grid, date, sport, courtId, startTime),
        };
      }
    },
    [grid, sport, currentTier, loadBookings]
  );

  // Confirm booking (after payment)
  const confirmBooking = useCallback(
    async (bookingId: string) => {
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

      try {
        await bookingApi.confirmBooking({
          holdToken: bookingId,
          memberTier: currentTier,
        });
        memberStore.loadNotifications();
      } catch {
        // ignored
      }
    },
    [currentTier]
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
              ? {
                  ...cell,
                  status: "free" as const,
                  bookingId: undefined,
                  holdExpiry: undefined,
                  memberName: undefined,
                  memberInitials: undefined,
                }
              : cell
          )
        )
      );
    },
    []
  );

  // Cancel booking
  const cancelBooking = useCallback(
    async (bookingId: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED" as const } : b
        )
      );
      setGrid((prev) =>
        prev.map((row) =>
          row.map((cell) =>
            cell.bookingId === bookingId
              ? {
                  ...cell,
                  status: "free" as const,
                  bookingId: undefined,
                  holdExpiry: undefined,
                  memberName: undefined,
                  memberInitials: undefined,
                }
              : cell
          )
        )
      );

      try {
        await bookingApi.cancelBooking(bookingId, "Cancelled from web");
        memberStore.loadNotifications();
      } catch {
        // ignored
      }
    },
    []
  );

  // Find alternatives for a taken slot
  const getAlternatives = useCallback(
    (courtId: string, time: string): AlternativeSlot[] =>
      findAlternativeSlots(grid, selectedDate, sport, courtId, time),
    [grid, selectedDate, sport]
  );

  // Manual retry / reload bookings
  const simulateLoad = useCallback(() => {
    loadBookings(selectedDate, sport, false);
  }, [loadBookings, selectedDate, sport]);

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
