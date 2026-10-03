import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import {
  CalendarDays,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Calendar,
  DollarSign,
  Footprints,
  Phone,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { StatusPill } from "@/components/ui/StatusPill";
import { AvailabilityGrid } from "@/components/shared/AvailabilityGrid";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import {
  SAMPLE_DESK_BOOKINGS,
  DESK_MEMBERS,
  performDeskCheckin,
} from "../sampleData";
import { useBookings } from "@/features/booking/useBookings";
import type { Sport, SlotCell } from "@/features/booking/types";
import type { DeskBookingRecord, DeskMember } from "../types";

export default function DeskAvailability() {
  const navigate = useGo();
  const { grid, sport, setSport, selectedDate: date, setSelectedDate: setDate } = useBookings("Gold");

  // Drawer state for clicked booked slot
  const [selectedBooking, setSelectedBooking] = useState<DeskBookingRecord | null>(null);
  const [bookingMember, setBookingMember] = useState<DeskMember | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cancellation and No-show ReasonDialog state
  const [reasonAction, setReasonAction] = useState<"CANCEL" | "NO_SHOW" | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reschedule inline state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newTime, setNewTime] = useState("");

  const handleSelectSlot = (slot: { courtId: string; time: string }) => {
    // Find if there is a matching booked record
    const match = SAMPLE_DESK_BOOKINGS.find(
      (b) => b.courtId === slot.courtId && b.startTime === slot.time && b.date === date
    );

    if (match) {
      setSelectedBooking(match);
      const mem = DESK_MEMBERS.find((m: DeskMember) => m.id === match.memberId) ?? null;
      setBookingMember(mem);
      setIsRescheduling(false);
      setIsDrawerOpen(true);
    } else {
      // If free slot, ask to book walk-in
      navigate(`/desk/walk-in`);
    }
  };

  const handleCheckinBooking = () => {
    if (!selectedBooking) return;
    performDeskCheckin(selectedBooking.memberId);
    selectedBooking.status = "CHECKED_IN";
    selectedBooking.checkedInAt = Date.now();
    setToastMessage(`Checked in ${selectedBooking.memberName} for ${selectedBooking.courtName}!`);
    setIsDrawerOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmReason = (reason: string) => {
    if (!selectedBooking) return;

    if (reasonAction === "CANCEL") {
      selectedBooking.status = "CANCELLED";
      selectedBooking.cancelledAt = Date.now();
      selectedBooking.cancelReason = reason;
      setToastMessage(`Booking #${selectedBooking.id} cancelled. Reason audited.`);
    } else if (reasonAction === "NO_SHOW") {
      selectedBooking.status = "NO_SHOW";
      setToastMessage(`Marked #${selectedBooking.id} as NO-SHOW. Staff audit logged.`);
    }

    setReasonAction(null);
    setIsDrawerOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmReschedule = () => {
    if (!selectedBooking || !newTime) return;
    const [h, m] = newTime.split(":");
    const endH = String(Number(h) + 1).padStart(2, "0");
    selectedBooking.startTime = newTime;
    selectedBooking.endTime = `${endH}:${m}`;
    setToastMessage(`Booking rescheduled to ${newTime} – ${endH}:${m}!`);
    setIsRescheduling(false);
    setIsDrawerOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-pill bg-navy-800 border-l-4 border-volt-400 px-5 py-3 shadow-2xl text-sm font-medium text-white flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="size-4 text-volt-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="size-6 text-volt-400" />
            <span>Staff Master Court Matrix</span>
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Complete facility schedule. Click a booked slot to open action drawer (Check-in, Reschedule, Cancel, Mark No-show)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/desk/walk-in")}
            className="flex items-center gap-2"
          >
            <Footprints className="size-4 text-volt-400" />
            <span>Walk-in Booking</span>
          </Button>
        </div>
      </div>

      {/* Main Staff Availability Grid */}
      <div className="w-full">
        <AvailabilityGrid
          grid={grid}
          sport={sport}
          date={date}
          mode="staff"
          onSelectSlot={handleSelectSlot}
          onSportChange={(newSport) => setSport(newSport)}
          onDateChange={(newDate) => setDate(newDate)}
        />
      </div>

      {/* BOOKED SLOT DETAIL DRAWER */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span>Booking #{selectedBooking?.id}</span>
            {selectedBooking && (
              <StatusPill
                variant={
                  selectedBooking.status === "CONFIRMED"
                    ? "info"
                    : selectedBooking.status === "CHECKED_IN"
                    ? "success"
                    : selectedBooking.status === "NO_SHOW"
                    ? "warning"
                    : "danger"
                }
              >
                {selectedBooking.status}
              </StatusPill>
            )}
          </div>
        }
        subtitle="Manage reservation, check-in, or perform audited cancellation"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-6">
            {/* Member Card Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={
                    bookingMember?.avatar ??
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  }
                  alt={selectedBooking.memberName}
                  className="size-12 rounded-full object-cover border border-volt-400/40"
                />
                <div>
                  <h4 className="font-semibold text-white text-base">
                    {selectedBooking.memberName}
                  </h4>
                  <p className="text-xs text-white/60 font-mono">
                    {selectedBooking.memberId} · {selectedBooking.tier}
                  </p>
                </div>
              </div>

              {bookingMember && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-volt-400 hover:text-volt-300"
                  onClick={() => navigate(`/desk/members/${bookingMember.id}`)}
                >
                  View Profile
                </Button>
              )}
            </div>

            {/* Session Info Details */}
            <div className="p-4 rounded-2xl bg-navy-950/60 border border-white/10 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Sport &amp; Court:</span>
                <span className="font-semibold text-white">
                  {selectedBooking.courtName} ({selectedBooking.sport.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Date:</span>
                <span className="font-mono text-white">{selectedBooking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Reserved Time:</span>
                <span className="font-mono text-volt-400 font-semibold">
                  {selectedBooking.startTime} – {selectedBooking.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Channel / Source:</span>
                <span className="uppercase text-white">{selectedBooking.source}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white/60">Price &amp; Payment:</span>
                <span className="font-mono font-bold text-white">
                  ₹{selectedBooking.price.toLocaleString("en-IN")} via {selectedBooking.paymentMethod}
                </span>
              </div>
            </div>

            {/* Reschedule Inline Box */}
            {isRescheduling ? (
              <div className="p-4 rounded-xl bg-volt-400/10 border border-volt-400/30 flex flex-col gap-3">
                <p className="text-xs font-semibold text-volt-400">Select New Start Time:</p>
                <div className="grid grid-cols-3 gap-2">
                  {["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewTime(t)}
                      className={`py-2 text-xs font-mono rounded-lg border transition-colors ${
                        newTime === t
                          ? "bg-volt-400 text-ink-900 border-volt-400 font-bold"
                          : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setIsRescheduling(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="text-xs"
                    disabled={!newTime}
                    onClick={handleConfirmReschedule}
                  >
                    Confirm Reschedule
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Actions Bar */}
            <div className="flex flex-col gap-2.5 pt-2">
              {selectedBooking.status === "CONFIRMED" && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full h-12 text-sm font-bold"
                  onClick={handleCheckinBooking}
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Check-in Member Now
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => setIsRescheduling((r) => !r)}
                >
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Reschedule
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full text-xs text-warning border-warning/30 hover:bg-warning/10"
                  onClick={() => setReasonAction("NO_SHOW")}
                >
                  <AlertOctagon className="size-3.5 mr-1.5" />
                  Mark No-Show
                </Button>
              </div>

              <Button
                type="button"
                variant="danger"
                className="w-full text-xs mt-1"
                onClick={() => setReasonAction("CANCEL")}
              >
                <XCircle className="size-3.5 mr-1.5" />
                Cancel Booking (Audited)
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Sensitive Action Audited Reason Dialog */}
      <ReasonDialog
        isOpen={Boolean(reasonAction)}
        onClose={() => setReasonAction(null)}
        onConfirm={handleConfirmReason}
        title={reasonAction === "CANCEL" ? "Cancel Court Booking" : "Mark Booking as No-Show"}
        description={
          reasonAction === "CANCEL"
            ? "Mandatory audit reason required. Slot will be released and refund or quota adjusted."
            : "Marking as No-show logs an infraction on member profile according to Club bylaws."
        }
        actionLabel={reasonAction === "CANCEL" ? "Confirm Cancellation" : "Confirm No-Show"}
        variant={reasonAction === "CANCEL" ? "danger" : "primary"}
      />
    </div>
  );
}
