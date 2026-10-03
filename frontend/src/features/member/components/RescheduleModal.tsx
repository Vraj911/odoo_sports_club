import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AvailabilityGrid } from "@/components/shared/AvailabilityGrid";
import { AlertCircle, ArrowRight, Calendar, Check, Clock, RefreshCw } from "lucide-react";
import type { Booking, SlotCell } from "@/features/booking/types";
import {
  COURTS,
  generateInitialGrid,
  addMinutes,
  SESSION_MINUTES,
  formatOffsetDate,
} from "@/features/booking/sampleData";
import { Money } from "@/components/shared/Money";
import { useMemberBookings } from "@/features/booking/bookingStore";

export interface RescheduleModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedBooking: Booking) => void;
}

export function RescheduleModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: RescheduleModalProps) {
  const { bookings, rescheduleBooking } = useMemberBookings();

  const [date, setDate] = useState<string>(() => booking?.date ?? formatOffsetDate(1));
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string; time: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync date when booking changes
  useEffect(() => {
    if (booking) {
      setDate(booking.date);
      setSelectedSlot(null);
      setErrorMsg(null);
    }
  }, [booking, isOpen]);

  // Compute grid for the sport and date
  const grid = useMemo<SlotCell[][]>(() => {
    if (!booking) return [];
    return generateInitialGrid(date, booking.sport, bookings);
  }, [booking, date, bookings]);

  if (!booking) return null;

  const newCourt = selectedSlot ? COURTS.find((c) => c.id === selectedSlot.courtId) : null;
  const newEndTime = selectedSlot ? addMinutes(selectedSlot.time, SESSION_MINUTES) : "";

  // Check if chosen slot is identical to old slot
  const isSameSlot =
    selectedSlot &&
    selectedSlot.courtId === booking.courtId &&
    date === booking.date &&
    selectedSlot.time === booking.startTime;

  const handleConfirm = () => {
    if (!selectedSlot || !newCourt) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    setTimeout(() => {
      // Simulate random atomic race condition for testing:
      // If time is 10:00 on Court 1, simulate collision; otherwise succeed
      const isSimulatedTaken = selectedSlot.courtId === "tc-1" && selectedSlot.time === "10:00";

      if (isSimulatedTaken) {
        setIsSubmitting(false);
        setErrorMsg("New slot unavailable. Your original booking is unchanged.");
        return;
      }

      const res = rescheduleBooking(
        booking.id,
        newCourt.id,
        newCourt.name,
        booking.sport,
        date,
        selectedSlot.time,
        newEndTime
      );

      setIsSubmitting(false);

      if (!res.success) {
        setErrorMsg(res.error || "New slot unavailable. Your original booking is unchanged.");
      } else if (res.booking) {
        onSuccess(res.booking);
        onClose();
      }
    }, 500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2 text-volt-400">
          <RefreshCw className="size-5 shrink-0" />
          <span>Atomic Reschedule — {booking.courtName}</span>
        </div>
      }
      subtitle={`Original slot: ${booking.date} · ${booking.startTime}–${booking.endTime} (${booking.sport.toUpperCase()})`}
    >
      <div className="flex flex-col gap-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Error banner */}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-danger/40 bg-danger/16 p-3 text-xs text-danger font-medium animate-shake">
            <AlertCircle className="size-5 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Atomic Reschedule Failed</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-chalk/14 bg-court-700/50 p-4">
          {/* Current Slot */}
          <div className="flex flex-col gap-1 border-b sm:border-b-0 sm:border-r border-chalk/10 pb-3 sm:pb-0 sm:pr-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-chalk/50">Current Booking</span>
            <div className="text-sm font-medium text-chalk">{booking.courtName}</div>
            <div className="text-xs text-chalk/70 flex items-center gap-1.5 font-mono">
              <Calendar className="size-3.5 text-chalk/50" />
              <span>{booking.date}</span>
              <Clock className="size-3.5 text-chalk/50 ml-1.5" />
              <span>{booking.startTime}–{booking.endTime}</span>
            </div>
            <div className="text-xs text-volt-400 mt-1">
              Paid: <Money amount={booking.price} /> ({booking.ruleId ?? "Standard"})
            </div>
          </div>

          {/* New Slot */}
          <div className="flex flex-col gap-1 sm:pl-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-volt-400">Target New Slot</span>
            {selectedSlot && newCourt ? (
              <>
                <div className="text-sm font-semibold text-volt-400">{newCourt.name}</div>
                <div className="text-xs text-chalk/90 flex items-center gap-1.5 font-mono">
                  <Calendar className="size-3.5 text-volt-400" />
                  <span>{date}</span>
                  <Clock className="size-3.5 text-volt-400 ml-1.5" />
                  <span>{selectedSlot.time}–{newEndTime}</span>
                </div>
                <div className="text-xs text-chalk/70 mt-1">
                  Price difference: <span className="font-semibold text-success">₹0 (Included in plan)</span>
                </div>
              </>
            ) : (
              <div className="text-xs text-chalk/50 italic py-2">
                Click a free slot below to choose your new time
              </div>
            )}
          </div>
        </div>

        {/* Availability Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-chalk/70 px-1">
            <span className="font-medium">Select a slot on the grid:</span>
            <span className="text-[11px] text-chalk/50">Same sport ({booking.sport})</span>
          </div>

          <div className="rounded-2xl border border-chalk/14 bg-court-800/80 p-3 overflow-hidden">
            <AvailabilityGrid
              grid={grid}
              sport={booking.sport}
              date={date}
              mode="member"
              density="compact"
              selectedSlot={selectedSlot}
              onSelectSlot={(slot) => {
                setErrorMsg(null);
                setSelectedSlot(slot);
              }}
              onDateChange={(d) => {
                setErrorMsg(null);
                setDate(d);
                setSelectedSlot(null);
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-chalk/10 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!selectedSlot || Boolean(isSameSlot) || isSubmitting}
            loading={isSubmitting}
          >
            {isSameSlot ? "Select Different Slot" : "Confirm Reschedule"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
