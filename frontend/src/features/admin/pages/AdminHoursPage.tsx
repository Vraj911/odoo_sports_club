import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAdminConfigStore } from "../adminConfigStore";
import type { DayOperatingHours, HolidayRecord, BookingRules } from "../types";
import {
  Timer,
  Calendar,
  ShieldCheck,
  PlusCircle,
  Trash2,
  Clock,
  Ban,
  CheckCircle2,
  AlertTriangle,
  CalendarOff,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

export default function AdminHoursPage() {
  const {
    hours,
    holidays,
    bookingRules,
    updateDayHours,
    addHoliday,
    removeHoliday,
    updateBookingRules,
  } = useAdminConfigStore();

  const [rulesState, setRulesState] = useState<BookingRules>({ ...bookingRules });

  // Add Holiday Modal state
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("2026-11-04");
  const [holidayType, setHolidayType] = useState<HolidayRecord["type"]>("PUBLIC_HOLIDAY");
  const [holidayNotes, setHolidayNotes] = useState("");

  const handleRulesSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBookingRules(rulesState);
  };

  const handleAddHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName.trim() || !holidayDate) return;
    addHoliday(holidayName.trim(), holidayDate, holidayType, holidayNotes.trim() || undefined);
    setIsHolidayModalOpen(false);
    setHolidayName("");
    setHolidayNotes("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operating Hours & Booking Governance"
        subtitle="Configure standard weekday opening schedules, seasonal closures/holidays, slot intervals, cancellation policies, and daily booking caps."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Weekly Operating Hours Grid */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-court-500 border-white/14 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="size-4 text-volt-400" />
                  <span>Standard Weekly Schedule</span>
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Opening & closing bounds for member bookings and lighting schedules.
                </p>
              </div>
              <span className="text-[11px] text-white/50 font-mono">Asia/Kolkata</span>
            </div>

            <div className="divide-y divide-white/10">
              {hours.map((item) => (
                <div
                  key={item.day}
                  className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="w-28">
                    <span className="font-semibold text-sm text-white">{item.day}</span>
                    {item.isClosed && (
                      <span className="block text-[11px] text-rose-400 font-medium">Closed</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-1 sm:justify-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/60">Open:</span>
                      <input
                        type="time"
                        value={item.openTime}
                        disabled={item.isClosed}
                        onChange={(e) => updateDayHours(item.day, { openTime: e.target.value })}
                        className="h-9 px-2.5 rounded-lg bg-navy-800 border border-white/18 text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:border-volt-400"
                      />
                    </div>

                    <span className="text-white/40">→</span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-white/60">Close:</span>
                      <input
                        type="time"
                        value={item.closeTime}
                        disabled={item.isClosed}
                        onChange={(e) => updateDayHours(item.day, { closeTime: e.target.value })}
                        className="h-9 px-2.5 rounded-lg bg-navy-800 border border-white/18 text-xs text-white disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:border-volt-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => updateDayHours(item.day, { isClosed: !item.isClosed })}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        item.isClosed
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                          : "bg-white/6 border-white/14 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {item.isClosed ? "Mark Open" : "Mark Closed"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Booking Rules & Governance Card */}
          <Card className="p-6 bg-court-500 border-white/14 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-emerald-400" />
                  <span>Booking Rules & Cancellation Policy</span>
                </h3>
                <p className="text-xs text-white/70 mt-0.5">
                  Business rules strictly enforced on the front-end reservation engine.
                </p>
              </div>
            </div>

            <form onSubmit={handleRulesSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5">
                    Slot Length (Minutes) *
                  </label>
                  <select
                    value={rulesState.slotLengthMinutes}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, slotLengthMinutes: Number(e.target.value) })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  >
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (Default)</option>
                    <option value={90}>90 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5">
                    Slot Interval Step *
                  </label>
                  <select
                    value={rulesState.slotIntervalMinutes}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, slotIntervalMinutes: Number(e.target.value) })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  >
                    <option value={15}>15 Minutes</option>
                    <option value={30}>30 Minutes (Default)</option>
                    <option value={60}>60 Minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5">
                    Member Daily Cap *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={rulesState.dailyBookingCap}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, dailyBookingCap: Number(e.target.value) })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  />
                  <span className="text-[10px] text-white/50 block mt-0.5">
                    Max sessions per member / day
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5">
                    Checkout Hold Duration *
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={15}
                    value={rulesState.holdDurationMinutes}
                    onChange={(e) =>
                      setRulesState({ ...rulesState, holdDurationMinutes: Number(e.target.value) })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  />
                  <span className="text-[10px] text-white/50 block mt-0.5">
                    Cart hold minutes (default 5)
                  </span>
                </div>
              </div>

              {/* Cancellation Policy Builder */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                  Cancellation & Refund Policy Builder
                </span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Free Cancellation Window (Hours Before Session) *"
                    type="number"
                    value={rulesState.freeCancellationHoursBefore}
                    onChange={(e) =>
                      setRulesState({
                        ...rulesState,
                        freeCancellationHoursBefore: Number(e.target.value),
                      })
                    }
                    required
                  />

                  <Input
                    label="Late Cancellation Fee / Forfeit (%) *"
                    type="number"
                    value={rulesState.lateCancellationFeePercent}
                    onChange={(e) =>
                      setRulesState({
                        ...rulesState,
                        lateCancellationFeePercent: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <p className="text-[11px] text-white/60">
                  Members cancelling at least {rulesState.freeCancellationHoursBefore} hours prior receive
                  a 100% refund. Cancellations inside this window forfeit{" "}
                  {rulesState.lateCancellationFeePercent}% of session fees.
                </p>
              </div>

              {/* Expired Member Policy & Warning Days */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5">
                    Expiry Warning Trigger (Days Before Expiry)
                  </label>
                  <input
                    type="number"
                    value={rulesState.expiringSoonWarningDays}
                    onChange={(e) =>
                      setRulesState({
                        ...rulesState,
                        expiringSoonWarningDays: Number(e.target.value),
                      })
                    }
                    className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                  />
                  <span className="text-[10px] text-white/50 block mt-0.5">
                    Shows volt warning banner on member dashboard
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1.5">
                    Expired Member Reservation Action *
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                      <input
                        type="radio"
                        name="expiredPolicy"
                        value="BLOCK"
                        checked={rulesState.expiredMemberPolicy === "BLOCK"}
                        onChange={() =>
                          setRulesState({ ...rulesState, expiredMemberPolicy: "BLOCK" })
                        }
                        className="text-volt-400"
                      />
                      <span>Strictly Block Booking</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                      <input
                        type="radio"
                        name="expiredPolicy"
                        value="GUEST_RATE"
                        checked={rulesState.expiredMemberPolicy === "GUEST_RATE"}
                        onChange={() =>
                          setRulesState({ ...rulesState, expiredMemberPolicy: "GUEST_RATE" })
                        }
                        className="text-volt-400"
                      />
                      <span>Permit at Guest Walk-in Rate</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-white/10">
                <Button type="submit" variant="primary">
                  Update Booking Rules
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Holidays & Scheduled Closures */}
        <div className="space-y-6">
          <Card className="p-6 bg-court-500 border-white/14 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <CalendarOff className="size-4 text-rose-400" />
                  <span>Scheduled Closures</span>
                </h3>
                <p className="text-xs text-white/70 mt-0.5">Holidays and tournament shutdowns.</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsHolidayModalOpen(true)}
                className="gap-1.5 text-xs"
              >
                <PlusCircle className="size-3.5" />
                <span>Add</span>
              </Button>
            </div>

            <div className="space-y-3">
              {holidays.length === 0 ? (
                <p className="text-xs text-white/50 text-center py-6">No scheduled holidays.</p>
              ) : (
                holidays.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-white">{h.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-volt-400 border border-white/10">
                          {h.date}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/50 block capitalize">
                        {h.type.toLowerCase().replace(/_/g, " ")}
                      </span>
                      {h.notes && <p className="text-[11px] text-white/70 italic">{h.notes}</p>}
                    </div>

                    <button
                      onClick={() => removeHoliday(h.id)}
                      className="p-1 rounded text-white/40 hover:text-rose-400 transition-colors"
                      title="Remove closure"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="Schedule Club Holiday or Closure"
        subtitle="Dates marked as closures will block court reservations from the member calendar."
      >
        <form onSubmit={handleAddHolidaySubmit} className="space-y-4">
          <Input
            label="Holiday / Event Title *"
            placeholder="e.g. Republic Day Tournament Special"
            value={holidayName}
            onChange={(e) => setHolidayName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Date *</label>
              <input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">Category *</label>
              <select
                value={holidayType}
                onChange={(e) => setHolidayType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
              >
                <option value="PUBLIC_HOLIDAY" className="bg-navy-800 text-white">
                  Public Holiday
                </option>
                <option value="CLUB_MAINTENANCE" className="bg-navy-800 text-white">
                  Maintenance Shutdown
                </option>
                <option value="SPECIAL_EVENT" className="bg-navy-800 text-white">
                  Special Tournament / Gala
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">
              Operating Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={holidayNotes}
              onChange={(e) => setHolidayNotes(e.target.value)}
              placeholder="e.g. Courts closed from 14:00 onwards; pro shop remains open."
              className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-xs text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsHolidayModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record Holiday Closure
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
