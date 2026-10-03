import { useSyncExternalStore, useCallback } from "react";
import type { Booking, Sport } from "./types";
import {
  generateInitialMemberBookings,
  calculateCancellationPolicy,
  type CancellationPolicyResult,
  addMinutes,
  SESSION_MINUTES,
  timeToMinutes,
} from "./sampleData";

let memberBookings: Booking[] = generateInitialMemberBookings();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return memberBookings;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const bookingStore = {
  getAll: () => memberBookings,

  getById: (id: string): Booking | undefined => {
    return memberBookings.find((b) => b.id === id);
  },

  cancel: (
    id: string,
    reason?: string
  ): { success: boolean; result?: CancellationPolicyResult; error?: string } => {
    const booking = memberBookings.find((b) => b.id === id);
    if (!booking) return { success: false, error: "Booking not found" };

    const policy = calculateCancellationPolicy(booking);
    const now = Date.now();

    const note = policy.freeCancellation
      ? `Cancelled > 4h before. Full refund of ₹${policy.refundAmount} recorded.`
      : `Cancelled within 4h. 50% fee ₹${policy.cancellationFee} applied, refund ₹${policy.refundAmount} recorded.`;

    const updatedTimeline = [
      ...(booking.timeline ?? []),
      {
        status: "CANCELLED" as const,
        timestamp: now,
        note: reason ? `${note} (Reason: ${reason})` : note,
      },
    ];

    memberBookings = memberBookings.map((b) => {
      if (b.id !== id) return b;
      return {
        ...b,
        status: "CANCELLED" as const,
        paymentStatus: policy.freeCancellation
          ? ("REFUNDED" as const)
          : policy.refundAmount > 0
          ? ("PARTIAL_REFUND" as const)
          : b.paymentStatus,
        refundAmount: policy.refundAmount,
        cancellationFee: policy.cancellationFee,
        cancelledAt: now,
        cancelReason: reason ?? "Member cancelled online",
        timeline: updatedTimeline,
      };
    });

    notify();
    return { success: true, result: policy };
  },

  reschedule: (
    id: string,
    newCourtId: string,
    newCourtName: string,
    newSport: Sport,
    newDate: string,
    newStartTime: string,
    newEndTime?: string | undefined
  ): { success: boolean; error?: string | undefined; booking?: Booking | undefined } => {
    const booking = memberBookings.find((b) => b.id === id);
    if (!booking) return { success: false, error: "Booking not found" };

    const computedEndTime = newEndTime ?? addMinutes(newStartTime, SESSION_MINUTES);
    const newStartMin = timeToMinutes(newStartTime);
    const newEndMin = timeToMinutes(computedEndTime);

    // Simulated collision check:
    // If the slot matches a hardcoded "already taken" test slot (e.g. 10:00 on Tennis 1) or has an overlap
    const hasCollision = memberBookings.some(
      (b) =>
        b.id !== id &&
        b.courtId === newCourtId &&
        b.date === newDate &&
        b.status !== "CANCELLED" &&
        b.status !== "EXPIRED" &&
        timeToMinutes(b.startTime) < newEndMin &&
        timeToMinutes(b.endTime) > newStartMin
    );

    if (hasCollision) {
      return {
        success: false,
        error: "New slot unavailable. Your original booking is unchanged.",
      };
    }

    const now = Date.now();
    const oldDetails = `${booking.courtName} on ${booking.date} (${booking.startTime}–${booking.endTime})`;
    const newDetails = `${newCourtName} on ${newDate} (${newStartTime}–${computedEndTime})`;

    const updatedTimeline = [
      ...(booking.timeline ?? []),
      {
        status: "CONFIRMED" as const,
        timestamp: now,
        note: `Rescheduled from ${oldDetails} to ${newDetails}`,
      },
    ];

    let updatedBooking: Booking | undefined;

    memberBookings = memberBookings.map((b) => {
      if (b.id !== id) return b;
      updatedBooking = {
        ...b,
        courtId: newCourtId,
        courtName: newCourtName,
        sport: newSport,
        date: newDate,
        startTime: newStartTime,
        endTime: computedEndTime,
        status: "CONFIRMED" as const,
        timeline: updatedTimeline,
      };
      return updatedBooking;
    });

    notify();
    return { success: true, booking: updatedBooking };
  },

  addBooking: (booking: Booking) => {
    memberBookings = [booking, ...memberBookings];
    notify();
  },
};

export function useMemberBookings() {
  const bookings = useSyncExternalStore(subscribe, getSnapshot);

  const cancelBooking = useCallback((id: string, reason?: string) => {
    return bookingStore.cancel(id, reason);
  }, []);

  const rescheduleBooking = useCallback(
    (
      id: string,
      newCourtId: string,
      newCourtName: string,
      newSport: Sport,
      newDate: string,
      newStartTime: string,
      newEndTime?: string
    ) => {
      return bookingStore.reschedule(
        id,
        newCourtId,
        newCourtName,
        newSport,
        newDate,
        newStartTime,
        newEndTime
      );
    },
    []
  );

  const getBooking = useCallback((id: string) => {
    return bookingStore.getById(id);
  }, []);

  return {
    bookings,
    cancelBooking,
    rescheduleBooking,
    getBooking,
  };
}
