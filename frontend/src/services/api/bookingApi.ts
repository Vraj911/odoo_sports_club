import { apiClient } from "@/lib/axios";

export interface CourtDto {
  id: string;
  name: string;
  sport: string;
  indoor: boolean;
  location: string;
  slotDurationMinutes: number;
  slotIntervalMinutes: number;
}

export interface HoldSlotRequest {
  courtId: string;
  date: string; // YYYY-MM-DD
  slotIndex: number; // 0..47
  slotDurationMinutes?: number;
  memberId?: string;
}

export interface HoldSlotResponse {
  holdToken: string;
  expiresAt: string;
  slotIndex: number;
  courtId: string;
  date: string;
}

export interface ConfirmBookingRequest {
  holdToken: string;
  bookingRef?: string;
  memberTier?: string;
  guestCount?: number;
}

export interface DirectBookingRequest {
  courtId: string;
  memberId?: string;
  guestName?: string;
  guestPhone?: string;
  date: string;
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  sport?: string;
  memberTier?: string;
  paymentPolicy?: string;
  channel?: string;
  price?: number;
}

export interface BookingDto {
  id: string;
  bookingRef: string;
  courtId: string;
  courtName: string;
  sport: string;
  memberId?: string;
  memberName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "CONFIRMED" | "HOLD" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  price: number;
  paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "PARTIAL_REFUND";
  checkedInAt?: string;
  cancellationFee?: number;
  refundAmount?: number;
  cancelReason?: string;
}

export interface AlternativeSlotDto {
  courtId: string;
  courtName: string;
  date: string;
  slotIndex: number;
  startTime: string;
  endTime: string;
  sport: string;
  price: number;
}

export const bookingApi = {
  listCourts: (sport?: string) =>
    apiClient.get<CourtDto[]>("/api/courts", sport ? { sport } : undefined),

  getAvailability: (courtId: string, date: string) =>
    apiClient.get<Record<string, unknown>>("/api/bookings/availability", { courtId, date }),

  getPublicAvailability: (date?: string) =>
    apiClient.get<Record<string, unknown>>("/api/public/availability", date ? { date } : undefined),

  holdSlot: (data: HoldSlotRequest) =>
    apiClient.post<HoldSlotResponse>("/api/bookings/hold", data),

  confirmBooking: (data: ConfirmBookingRequest) =>
    apiClient.post<BookingDto>("/api/bookings/confirm", data),

  createBooking: (data: DirectBookingRequest) =>
    apiClient.post<BookingDto>("/api/bookings", {
      ...data,
      paymentPolicy: data.paymentPolicy || "PAY_AT_CLUB",
      channel: data.channel || "ONLINE",
    }),

  listBookings: (params?: { memberId?: string; courtId?: string; date?: string; status?: string }) =>
    apiClient.get<BookingDto[]>("/api/bookings", params),

  getBooking: (id: string) =>
    apiClient.get<BookingDto>(`/api/bookings/${id}`),

  cancelBooking: (id: string, reason?: string) =>
    apiClient.post<{ bookingId: string; status: string; refundAmount: number; cancellationFee: number }>(
      `/api/bookings/${id}/cancel`,
      { reason: reason || "Member cancellation" }
    ),

  rescheduleBooking: (id: string, data: { newCourtId: string; newDate: string; newStartTime: string }) =>
    apiClient.post<BookingDto>(`/api/bookings/${id}/reschedule`, data),

  checkIn: (id: string) =>
    apiClient.post<BookingDto>(`/api/bookings/${id}/check-in`),

  joinWaitlist: (data: { courtId: string; date: string; slotIndex: number; memberId: string }) =>
    apiClient.post<{ waitlistId: string; status: string }>("/api/bookings/waitlist", data),
};
