import { useState, useCallback, useEffect } from "react";
import type { Booking, SlotCell, Sport, MemberTier, PriceQuote, AlternativeSlot, Court } from "./types";
import { api } from "@/lib/axios";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  getQuote,
  MAX_BOOKINGS_PER_DAY,
  SESSION_MINUTES,
  addMinutes,
  findAlternativeSlots,
  isSlotPast,
  TIME_SLOTS,
} from "./sampleData";

interface ApiResponse<T> {
  data: T;
  message: string;
}

interface AvailabilityResponse {
  courtId: string;
  courtName: string;
  sport: string;
  indoor: boolean;
  occupiedHalfHours: string[];
  startableStarts: string[];
}

interface BookingResponse {
  id: string;
  courtId: string;
  courtName: string;
  sport: string;
  date: string;
  startTime: string;
  endTime: string;
  status: Booking["status"];
  price: number;
  memberName: string;
  memberId?: string;
  guestName?: string;
  guestPhone?: string;
  paymentStatus: Booking["paymentStatus"];
  createdAt: string;
  holdExpiry?: string;
}

function toSport(value: string): Sport {
  return value.toLowerCase() as Sport;
}

function toBooking(value: BookingResponse): Booking {
  return {
    id: value.id,
    courtId: value.courtId,
    courtName: value.courtName,
    sport: toSport(value.sport),
    date: value.date,
    startTime: value.startTime,
    endTime: value.endTime,
    status: value.status,
    price: Number(value.price),
    memberName: value.memberName || value.guestName || "Guest",
    memberId: value.memberId || "GUEST",
    createdAt: Date.parse(value.createdAt),
    holdExpiry: value.holdExpiry ? Date.parse(value.holdExpiry) : undefined,
    paymentStatus: value.paymentStatus,
  };
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useBookings(currentTier: MemberTier = "Gold") {
  const { user } = useAuth();
  const memberId = user?.id;
  const [sport, setSport] = useState<Sport>("tennis");
  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [grid, setGrid] = useState<SlotCell[][]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ApiResponse<AvailabilityResponse[]>>("/api/availability", {
        params: { sport, date: selectedDate },
      });
      const availability = response.data.data;
      setCourts(availability.map((item) => ({
        id: item.courtId,
        name: item.courtName,
        sport: toSport(item.sport),
        indoor: item.indoor,
      })));
      setGrid(availability.map((item) => TIME_SLOTS.map((time): SlotCell => {
        const occupied = item.occupiedHalfHours.includes(time);
        const startable = item.startableStarts.includes(time);
        return {
          courtId: item.courtId,
          time,
          status: isSlotPast(selectedDate, time)
            ? "past"
            : occupied
            ? "booked"
            : startable
            ? "free"
            : "closed",
        };
      })));
    } catch {
      setError("Unable to load live court availability. Check that the backend is running.");
      setGrid([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, sport]);

  const loadBookings = useCallback(async () => {
    if (!memberId) {
      setBookings([]);
      return;
    }
    try {
      const response = await api.get<ApiResponse<BookingResponse[]>>("/api/bookings", {
        params: { memberId },
      });
      setBookings(response.data.data.map(toBooking));
    } catch {
      setBookings([]);
    }
  }, [memberId]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const todayBookingCount = bookings.filter(
    (booking) => booking.date === selectedDate && !["CANCELLED", "EXPIRED"].includes(booking.status)
  ).length;
  const canBook = todayBookingCount < MAX_BOOKINGS_PER_DAY;

  const quote = useCallback(
    (selectedSport: Sport): PriceQuote => getQuote(selectedSport, currentTier),
    [currentTier]
  );

  const createBooking = useCallback(async (courtId: string, date: string, startTime: string) => {
    try {
      const response = await api.post<ApiResponse<BookingResponse>>("/api/bookings", {
        courtId,
        memberId,
        guestName: memberId ? undefined : "Demo Guest",
        date,
        startTime,
        channel: "DESK",
      });
      const booking = toBooking(response.data.data);
      setBookings((previous) => [booking, ...previous]);
      await loadAvailability();
      return { success: true, booking };
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      return { success: false, error: message || "BOOKING_FAILED" };
    }
  }, [loadAvailability, memberId]);

  const getAlternatives = useCallback(
    (courtId: string, time: string): AlternativeSlot[] => findAlternativeSlots(grid, selectedDate, sport, courtId, time),
    [grid, selectedDate, sport]
  );

  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    await api.patch(`/api/bookings/${bookingId}/cancel`, { reason });
    await loadBookings();
    await loadAvailability();
  }, [loadAvailability, loadBookings]);

  return {
    sport,
    setSport,
    selectedDate,
    setSelectedDate,
    grid,
    setGrid,
    courts,
    bookings,
    loading,
    error,
    todayBookingCount,
    canBook,
    quote,
    createBooking,
    confirmBooking: async (_bookingId: string) => undefined,
    expireBooking: async (_bookingId: string) => undefined,
    cancelBooking,
    getAlternatives,
    simulateLoad: loadAvailability,
    refreshBookings: loadBookings,
    sessionMinutes: SESSION_MINUTES,
    addMinutes,
  };
}
