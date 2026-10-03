import { useState } from "react";
import { useGo } from "@/app/router/links";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { useAdminOpsStore } from "../adminOpsStore";
import type { AdminResourceBooking, CourtResource } from "../types";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  MoveRight,
  Building,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/components/ui/Toast";

const TIME_SLOTS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

export default function AdminOperationsCalendarPage() {
  const go = useGo();
  const { courts, bookings, blocks, selectedDate, setSelectedDate, rescheduleBooking } = useAdminOpsStore();

  const [selectedBooking, setSelectedBooking] = useState<AdminResourceBooking | null>(null);

  // Reschedule dialog state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [targetCourtId, setTargetCourtId] = useState("");
  const [targetTime, setTargetTime] = useState("09:00");

  const handleOpenReschedule = (booking: AdminResourceBooking) => {
    setSelectedBooking(booking);
    setTargetCourtId(booking.courtId);
    setTargetTime(booking.startTime);
    setIsRescheduleOpen(true);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    rescheduleBooking(selectedBooking.id, targetCourtId, targetTime);
    setIsRescheduleOpen(false);
    setSelectedBooking(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Court Operations & Resource Calendar"
        subtitle="Live multi-court resource grid, booking allocations, maintenance blocks, and drag/click rescheduling (BKG-20)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/admin/blocks")}
              className="gap-1.5 text-xs text-chalk"
            >
              <AlertTriangle className="size-3.5 text-amber-400" /> Court Blocks
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => go("/desk/walk-in")}
              className="gap-1.5 text-xs font-bold"
            >
              + Walk-In Booking
            </Button>
          </div>
        }
      />

      {/* Date Bar & Legend */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-court-700/60 p-1 rounded-full border border-chalk/10">
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="p-1 rounded-full text-chalk/70 hover:text-chalk hover:bg-white/10"
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-mono text-xs font-bold text-chalk px-3">
              {new Date(selectedDate).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={() => {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(d.toISOString().slice(0, 10));
              }}
              className="p-1 rounded-full text-chalk/70 hover:text-chalk hover:bg-white/10"
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate("2026-10-05")}
            className="text-xs text-volt-400"
          >
            Today
          </Button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-chalk/70 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded bg-volt-400" /> Confirmed Booking
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded bg-amber-500" /> Maintenance Block
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded bg-court-700 border border-chalk/20" /> Available Slot
          </span>
        </div>
      </Card>

      {/* RESOURCE VIEW GRID (Courts as Columns, Time Slots as Rows) */}
      <Card className="p-0 overflow-hidden border border-chalk/14">
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">
            {/* Table Header: Courts */}
            <div className="grid grid-cols-[80px_repeat(8,1fr)] bg-court-700/80 border-b border-chalk/14 sticky top-0 z-20">
              <div className="p-3 text-[11px] font-mono font-bold text-chalk/60 uppercase border-r border-chalk/10">
                Time
              </div>
              {courts.map((court) => (
                <div key={court.id} className="p-3 text-center border-r border-chalk/10 last:border-r-0">
                  <p className="font-bold text-xs text-chalk leading-tight truncate">{court.name}</p>
                  <span className="text-[10px] text-chalk/50 font-mono uppercase">
                    {court.sport} · {court.isIndoor ? "Indoor" : "Outdoor"}
                  </span>
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="divide-y divide-chalk/5">
              {TIME_SLOTS.map((time) => (
                <div key={time} className="grid grid-cols-[80px_repeat(8,1fr)] min-h-[44px]">
                  {/* Time label */}
                  <div className="p-2 text-xs font-mono text-chalk/50 border-r border-chalk/10 bg-court-700/20 flex items-center justify-center">
                    {time}
                  </div>

                  {/* Court cells */}
                  {courts.map((court) => {
                    const booking = bookings.find(
                      (b) =>
                        b.courtId === court.id &&
                        b.date === selectedDate &&
                        b.startTime === time &&
                        b.status !== "CANCELLED"
                    );

                    const block = blocks.find(
                      (blk) =>
                        blk.courtId === court.id &&
                        blk.date === selectedDate &&
                        blk.status === "ACTIVE" &&
                        time >= blk.startTime &&
                        time < blk.endTime
                    );

                    return (
                      <div
                        key={court.id}
                        className="p-1 border-r border-chalk/10 last:border-r-0 relative group min-h-[44px] flex items-center"
                      >
                        {booking ? (
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(booking)}
                            className="w-full h-full rounded-lg bg-volt-400/20 border border-volt-400/40 p-1.5 text-left transition-all hover:bg-volt-400/30 hover:border-volt-400 group/btn"
                          >
                            <p className="font-bold text-[11px] text-volt-300 truncate">
                              {booking.memberName}
                            </p>
                            <p className="text-[9px] text-chalk/60 font-mono flex items-center justify-between">
                              <span>{booking.startTime}–{booking.endTime}</span>
                              <span className="text-volt-400 font-bold">{booking.memberTier}</span>
                            </p>
                          </button>
                        ) : block ? (
                          <div className="w-full h-full rounded-lg bg-amber-500/20 border border-amber-500/40 p-1 text-center flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-amber-300 font-mono">
                              BLOCKED: {block.reason}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded hover:bg-white/5 transition-colors cursor-pointer" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Booking Details Modal */}
      <Modal
        isOpen={Boolean(selectedBooking && !isRescheduleOpen)}
        onClose={() => setSelectedBooking(null)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <Calendar className="size-4" />
            </div>
            <span>Court Booking Details · {selectedBooking?.id}</span>
          </div>
        }
      >
        {selectedBooking && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-chalk">{selectedBooking.memberName}</h4>
                  <p className="text-[11px] text-chalk/60">{selectedBooking.memberTier} Member</p>
                </div>
                <StatusPill variant={selectedBooking.status === "CONFIRMED" ? "success" : "neutral"}>
                  {selectedBooking.status}
                </StatusPill>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-chalk/10 font-mono text-[11px]">
                <div>
                  <span className="text-chalk/50 block">Court:</span>
                  <span className="text-chalk font-semibold">{selectedBooking.courtName}</span>
                </div>
                <div>
                  <span className="text-chalk/50 block">Schedule:</span>
                  <span className="text-volt-400 font-semibold">{selectedBooking.date} · {selectedBooking.startTime}–{selectedBooking.endTime}</span>
                </div>
                <div>
                  <span className="text-chalk/50 block">Amount:</span>
                  <span className="text-chalk font-semibold">₹{selectedBooking.price}</span>
                </div>
                <div>
                  <span className="text-chalk/50 block">Sport:</span>
                  <span className="text-chalk uppercase font-semibold">{selectedBooking.sport}</span>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="pt-2 border-t border-chalk/10 text-chalk/70 italic text-[11px]">
                  Note: "{selectedBooking.notes}"
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenReschedule(selectedBooking)}
                className="gap-1.5"
              >
                <MoveRight className="size-3.5" /> Reschedule Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        maxWidth="md"
        title="Reschedule Court Booking (BKG-20)"
      >
        <form onSubmit={handleConfirmReschedule} className="space-y-4 text-xs">
          <p className="text-chalk/80 leading-relaxed">
            Move <strong>{selectedBooking?.memberName}</strong>'s reservation to an available court resource or new time slot.
          </p>

          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">Target Court</label>
            <select
              value={targetCourtId}
              onChange={(e) => setTargetCourtId(e.target.value)}
              className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
              required
            >
              {courts.map((c) => (
                <option key={c.id} value={c.id} className="bg-navy-900 text-chalk">
                  {c.name} ({c.sport})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">New Start Time</label>
            <select
              value={targetTime}
              onChange={(e) => setTargetTime(e.target.value)}
              className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
              required
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t} className="bg-navy-900 text-chalk">
                  {t} IST
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-chalk/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRescheduleOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm Reschedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
