import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import { CourtLines } from "@/components/brand/CourtLines";
import { NoiseOverlay } from "@/components/brand/NoiseOverlay";
import { Button } from "@/components/ui/Button";
import { generateWeekAvailability } from "../sampleData";
import { PublicSlotAvailability, DayAvailability } from "../types";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Sparkles,
  User,
  X,
  CheckCircle2,
} from "lucide-react";

const SPORTS = [
  { id: "tennis", label: "Tennis" },
  { id: "padel", label: "Padel" },
  { id: "badminton", label: "Badminton" },
  { id: "cricket-net", label: "Cricket Net" },
];

export function AvailabilityPage() {
  const go = useGo();
  const { user } = useAuth();
  const isMember = user?.role === "MEMBER";

  // URL query parameter parsing for sport or date
  const [selectedSport, setSelectedSport] = useState("tennis");

  // Track start of the week (Monday)
  const [weekOffset, setWeekOffset] = useState(0);

  const mondayDate = useMemo(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + weekOffset * 7;
    return new Date(d.setDate(diff));
  }, [weekOffset]);

  // Mobile selected day index (0 = Monday, 6 = Sunday)
  const [mobileDayIdx, setMobileDayIdx] = useState(0);

  // Selected Slot Popover state
  const [activeSlot, setActiveSlot] = useState<{
    day: DayAvailability;
    slot: PublicSlotAvailability;
  } | null>(null);

  const weekData = useMemo(() => {
    return generateWeekAvailability(mondayDate, selectedSport);
  }, [mondayDate, selectedSport]);

  const weekLabel = useMemo(() => {
    if (weekData.length === 0) return "";
    const start = new Date(weekData[0].date);
    const end = new Date(weekData[6].date);
    return `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
  }, [weekData]);

  const timeSlotKeys = useMemo(() => {
    if (weekData.length === 0) return [];
    return Object.keys(weekData[0].slots);
  }, [weekData]);

  const handleCellClick = (day: DayAvailability, slot: PublicSlotAvailability) => {
    if (slot.status === "CLOSED" || slot.status === "FULL") return;
    setActiveSlot({ day, slot });
  };

  return (
    <div className="w-full text-chalk font-sans">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-chalk/14 bg-court-700/60 py-12 px-4 sm:px-6">
        <NoiseOverlay opacity={0.03} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
          <CourtLines variant="full" className="h-full w-full object-contain" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Public Availability
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-heading font-black tracking-tight text-chalk">
            What's Free This Week
          </h1>
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-chalk/80">
            Real-time court availability updated every 30 seconds. Select a free slot to book a trial
            or log in to book with your member benefits.
          </p>

          {/* Sport Segmented Control */}
          <div className="pt-4 flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-full bg-court-600/80 border border-chalk/14">
              {SPORTS.map((sport) => (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => setSelectedSport(sport.id)}
                  className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    selectedSport === sport.id
                      ? "bg-volt-400 text-ink-900 shadow-md font-bold"
                      : "text-chalk/70 hover:text-chalk"
                  }`}
                >
                  {sport.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Navigation & Legend Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-court-600/60 p-4 rounded-2xl border border-chalk/14">
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-heading font-bold text-sm text-white px-2 min-w-[200px] text-center">
              {weekLabel}
            </span>

            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {weekOffset !== 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWeekOffset(0)}
                className="text-xs text-volt-300 hover:underline h-8 ml-2"
              >
                Current Week
              </Button>
            )}
          </div>

          {/* Color + Text Legend (Specification compliant) */}
          <div className="flex items-center gap-4 text-xs text-chalk/80">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-volt-400 border border-volt-400/50" />
              <span>Many Free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-volt-400/30 border border-volt-400/40" />
              <span>Few Free</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-court-700 border border-chalk/14 flex items-center justify-center">
                <Lock className="w-2.5 h-2.5 text-chalk/40" />
              </span>
              <span>Full</span>
            </div>
          </div>
        </div>

        {/* ─── DESKTOP 7-DAY AVAILABILITY GRID ─── */}
        <div className="hidden md:block overflow-x-auto rounded-3xl border border-chalk/14 bg-court-700/60 shadow-xl">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-court-800/90 text-white border-b border-chalk/14">
                <th className="py-4 px-3 text-xs font-mono text-chalk/50 w-24 text-left pl-6">
                  TIME
                </th>
                {weekData.map((day) => (
                  <th key={day.date} className="py-4 px-3">
                    <div className="font-heading font-black text-sm text-white">
                      {day.dayName}
                    </div>
                    <div className="text-[11px] text-chalk/60 font-mono">
                      {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/5">
              {timeSlotKeys.map((slotKey) => (
                <tr key={slotKey} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-xs font-mono text-chalk/50 text-left pl-6">
                    {slotKey}
                  </td>
                  {weekData.map((day) => {
                    const slot = day.slots[slotKey];
                    if (!slot) return <td key={day.date} />;

                    if (slot.status === "FULL") {
                      return (
                        <td key={day.date} className="p-1">
                          <div className="h-10 rounded-xl bg-court-800/80 border border-white/5 flex items-center justify-center text-chalk/30 gap-1 text-xs select-none">
                            <Lock className="w-3 h-3 text-chalk/30" />
                            <span>Full</span>
                          </div>
                        </td>
                      );
                    }

                    // Free slot (volt tint intensity)
                    const isMany = slot.status === "MANY_FREE";

                    return (
                      <td key={day.date} className="p-1">
                        <button
                          type="button"
                          onClick={() => handleCellClick(day, slot)}
                          className={`w-full h-10 rounded-xl font-medium text-xs flex items-center justify-center transition-all cursor-pointer ${
                            isMany
                              ? "bg-volt-400 text-ink-900 font-bold hover:bg-volt-500 hover:scale-[1.02] shadow-sm"
                              : "bg-volt-400/25 text-volt-300 border border-volt-400/30 hover:bg-volt-400/40"
                          }`}
                        >
                          {slot.freeCourts} free
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── MOBILE VIEW: Day chips on top + vertical list ─── */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
            {weekData.map((day, idx) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setMobileDayIdx(idx)}
                className={`flex-1 min-w-[70px] p-2.5 rounded-2xl border text-center transition-all ${
                  mobileDayIdx === idx
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                    : "bg-court-600/70 border-chalk/14 text-white"
                }`}
              >
                <div className="text-xs uppercase font-bold">{day.dayName}</div>
                <div className="text-[11px] opacity-75">{day.dayNumber}</div>
              </button>
            ))}
          </div>

          {/* Time slot list for active mobile day */}
          {weekData[mobileDayIdx] && (
            <div className="space-y-2">
              {timeSlotKeys.map((slotKey) => {
                const day = weekData[mobileDayIdx];
                const slot = day.slots[slotKey];
                const isFull = slot?.status === "FULL";

                return (
                  <div
                    key={slotKey}
                    onClick={() => {
                      if (!isFull) handleCellClick(day, slot);
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                      isFull
                        ? "bg-court-800/80 border-white/5 opacity-50"
                        : "bg-court-600/80 border-chalk/14 cursor-pointer hover:border-volt-400/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-chalk/50" />
                      <span className="font-mono font-bold text-sm text-white">{slotKey}</span>
                    </div>

                    {isFull ? (
                      <span className="text-xs text-chalk/40 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Booked Full
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-volt-400 text-ink-900">
                        {slot.freeCourts} Courts Free
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Popover / Modal for Clicked Slot */}
      {activeSlot && (
        <div
          onClick={() => setActiveSlot(null)}
          className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-court-600 rounded-3xl border border-chalk/20 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-volt-300 uppercase tracking-wider block">
                  {selectedSport.toUpperCase()} ARENA
                </span>
                <h3 className="text-xl font-heading font-black text-white mt-0.5">
                  {activeSlot.slot.freeCourts} Courts Available
                </h3>
                <p className="text-xs text-chalk/70 mt-1">
                  {activeSlot.day.dayName}, {new Date(activeSlot.day.date).toLocaleDateString("en-IN", { dateStyle: "medium" })} · {activeSlot.slot.time} – {Number(activeSlot.slot.time.split(":")[0]) + 1}:00 IST
                </p>
              </div>
              <button
                onClick={() => setActiveSlot(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-court-700 rounded-2xl border border-chalk/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-chalk/90">
                <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                <span>Instant confirmed slot hold</span>
              </div>
              <div className="flex items-center gap-2 text-chalk/90">
                <CheckCircle2 className="w-4 h-4 text-volt-400 shrink-0" />
                <span>Rackets & balls available at front desk</span>
              </div>
            </div>

            {/* Actions: Book a Trial vs Login to Book */}
            <div className="space-y-2 pt-2">
              <Button
                onClick={() =>
                  go(
                    `/trial?sport=${selectedSport}&date=${activeSlot.day.date}&slot=${activeSlot.slot.time}`
                  )
                }
                className="w-full bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-11 text-xs shadow-volt"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Book as a Trial Session (₹499)
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (isMember) {
                    go(`/app/book?date=${activeSlot.day.date}&sport=${selectedSport}`);
                  } else {
                    go(`/login?redirect=/app/book`);
                  }
                }}
                className="w-full border-chalk/20 text-chalk hover:text-white font-semibold h-11 text-xs"
              >
                <User className="w-4 h-4 mr-1.5" />
                {isMember ? "Book with Member Privileges" : "Login to Book (Members)"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AvailabilityPage;
