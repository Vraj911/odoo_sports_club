import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Lock, Wrench, Users, UserCheck,
  Plus, Clock, Activity, ZapOff, Search, SlidersHorizontal,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import type { SlotCell, Sport } from "@/features/booking/types";
import { SPORT_LABELS, SPORT_ICONS } from "@/features/booking/types";
import {
  COURTS,
  TIME_SLOTS,
  SESSION_MINUTES,
  SLOT_INTERVAL,
  addMinutes,
  canFitSession,
  timeToMinutes,
} from "@/features/booking/sampleData";

export type GridMode = "public" | "member" | "staff";
export type GridDensity = "comfortable" | "compact";

export interface AvailabilityGridProps {
  grid: SlotCell[][];
  sport: Sport;
  date: string;
  mode: GridMode;
  loading?: boolean | undefined;
  error?: string | null | undefined;
  selectedSlot?: { courtId: string; time: string } | null | undefined;
  onSelectSlot?: ((slot: { courtId: string; time: string }) => void) | undefined;
  onSportChange?: ((sport: Sport) => void) | undefined;
  onDateChange?: ((date: string) => void) | undefined;
  onRetry?: (() => void) | undefined;
  density?: GridDensity | undefined;
}

// ── 14-day date strip ──
function getDateStrip(currentDate: string): { date: string; label: string; dayName: string; isToday: boolean }[] {
  const dates: { date: string; label: string; dayName: string; isToday: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    dates.push({
      date: str,
      label: `${d.getDate()} ${monthNames[d.getMonth()] ?? ""}`,
      dayName: dayNames[d.getDay()] ?? "Mon",
      isToday: i === 0,
    });
  }
  return dates;
}

// ── Format time for display ──
function formatTime(t: string): string {
  const parts = t.split(":");
  const h = Number(parts[0] ?? 0);
  const m = Number(parts[1] ?? 0);
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hr}:${String(m).padStart(2, "0")}`;
}

// ── Hold countdown display ──
function HoldCountdown({ expiry }: { expiry: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  if (remaining <= 0) return <span className="text-[10px] text-danger">Expired</span>;

  return (
    <span className="font-mono text-[10px] tabular-nums text-warning">
      {mm}:{ss}
    </span>
  );
}

// ── Single slot cell ──
function SlotCellView({
  cell,
  isSelected,
  isSecondHalf,
  mode,
  density,
  onClick,
  onKeyDown,
}: {
  cell: SlotCell;
  isSelected: boolean;
  isSecondHalf: boolean;
  mode: GridMode;
  density: GridDensity;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const h = density === "compact" ? "h-[44px]" : "h-[56px]";
  const isFree = cell.status === "free";
  const isInteractive = isFree && canFitSession(cell.time);
  const flashRef = useRef(false);

  // Flash animation for live booked cells
  const [flash, setFlash] = useState(false);
  const flashProp = (cell as SlotCell & { _flash?: boolean })._flash;
  useEffect(() => {
    if (flashProp && !flashRef.current) {
      flashRef.current = true;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [flashProp]);

  const baseClasses = cn(
    "relative flex flex-col items-center justify-center px-1 text-[11px] font-medium transition-all duration-150 border-r border-chalk/8 select-none min-w-[72px]",
    h,
    flash && "ring-2 ring-volt-400 ring-inset animate-pulse",
  );

  if (cell.status === "past") {
    return (
      <div className={cn(baseClasses, "bg-court-700/40 text-chalk/30 cursor-not-allowed")} aria-disabled>
        <span className="text-[10px]">Past</span>
      </div>
    );
  }

  if (cell.status === "closed") {
    return (
      <div className={cn(baseClasses, "bg-court-700/30 text-chalk/25 cursor-not-allowed")} aria-disabled>
        <ZapOff className="size-3.5 mb-0.5" />
        <span className="text-[10px]">Closed</span>
      </div>
    );
  }

  if (cell.status === "booked") {
    if (mode === "staff") {
      return (
        <button
          type="button"
          onClick={onClick}
          onKeyDown={onKeyDown}
          className={cn(baseClasses, "bg-court-700 text-chalk/80 hover:bg-court-600/80 cursor-pointer text-center")}
          title={`Booked: ${cell.memberInitials ?? "Member"}. Click to view / manage`}
        >
          <Lock className="size-3.5 mb-0.5 text-volt-400/80" />
          {cell.memberInitials && (
            <span className="text-[10px] font-mono font-semibold text-volt-400">{cell.memberInitials}</span>
          )}
          <span className="text-[10px]">Booked</span>
        </button>
      );
    }
    return (
      <div className={cn(baseClasses, "bg-court-700 text-chalk/60 cursor-not-allowed")}>
        <Lock className="size-3.5 mb-0.5" />
        <span className="text-[10px]">Booked</span>
      </div>
    );
  }

  if (cell.status === "held") {
    return (
      <div className={cn(baseClasses, "bg-warning/12 border-warning/30 text-warning cursor-not-allowed")}
        style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(251,191,36,0.08) 4px, rgba(251,191,36,0.08) 8px)" }}
      >
        <Clock className="size-3.5 mb-0.5" />
        {cell.holdExpiry && <HoldCountdown expiry={cell.holdExpiry} />}
      </div>
    );
  }

  if (cell.status === "blocked") {
    return (
      <div
        className={cn(baseClasses, "bg-court-700/50 text-chalk/40 cursor-not-allowed")}
        title={cell.blockReason ?? "Blocked"}
        style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 8px)" }}
      >
        <Wrench className="size-3.5 mb-0.5" />
        <span className="text-[10px]">Blocked</span>
      </div>
    );
  }

  if (cell.status === "social") {
    return (
      <div className={cn(baseClasses, "bg-info/12 border-info/25 text-info cursor-pointer hover:bg-info/20")} onClick={onClick}>
        <Users className="size-3.5 mb-0.5" />
        <span className="text-[10px]">{cell.socialCurrent}/{cell.socialMax}</span>
      </div>
    );
  }

  if (cell.status === "mine") {
    return (
      <div className={cn(baseClasses, "bg-volt-400/12 border-2 border-volt-400/60 text-volt-400")}>
        <UserCheck className="size-3.5 mb-0.5" />
        <span className="text-[10px]">Mine</span>
      </div>
    );
  }

  // FREE
  return (
    <button
      className={cn(
        baseClasses,
        "bg-chalk/6 cursor-pointer",
        isInteractive && "hover:bg-volt-400/12 hover:border-volt-400/40 focus-visible:ring-2 focus-visible:ring-volt-400",
        isSelected && "bg-volt-400/20 border-2 border-volt-400 shadow-volt",
        isSecondHalf && "bg-volt-400/10 border-l-0 border-volt-400/40",
        !isInteractive && "cursor-not-allowed opacity-40",
      )}
      onClick={isInteractive ? onClick : undefined}
      onKeyDown={onKeyDown}
      disabled={!isInteractive}
      tabIndex={isInteractive ? 0 : -1}
      role="gridcell"
      aria-label={`Free slot at ${cell.time} on court`}
    >
      {isInteractive && !isSelected && <Plus className="size-3.5 text-chalk/30" />}
      {isSelected && <span className="text-volt-400 text-[10px] font-semibold">Selected</span>}
    </button>
  );
}

// ── Main Grid ──
export function AvailabilityGrid({
  grid,
  sport,
  date,
  mode,
  loading = false,
  error = null,
  selectedSlot,
  onSelectSlot,
  onSportChange,
  onDateChange,
  onRetry,
  density: initialDensity = "comfortable",
}: AvailabilityGridProps) {
  const [density, setDensity] = useState<GridDensity>(initialDensity);
  const [showLegend, setShowLegend] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dateStrip = useMemo(() => getDateStrip(date), [date]);
  const courts = useMemo(() => COURTS.filter((c) => c.sport === sport), [sport]);

  const sports: Sport[] = ["tennis", "padel", "badminton", "cricket-net"];

  // "Next available" quick jump
  const jumpToNextFree = useCallback(() => {
    for (const row of grid) {
      for (const cell of row) {
        if (cell.status === "free" && canFitSession(cell.time)) {
          onSelectSlot?.({ courtId: cell.courtId, time: cell.time });
          return;
        }
      }
    }
  }, [grid, onSelectSlot]);

  // Determine the second half cell of a 60-min selection
  const getSecondHalfTime = (time: string): string | null => {
    const nextTime = addMinutes(time, SLOT_INTERVAL);
    if (timeToMinutes(nextTime) + SLOT_INTERVAL > timeToMinutes("22:00")) return null;
    return nextTime;
  };

  if (error) {
    return (
      <div className="rounded-[20px] border border-danger/30 bg-danger/8 p-8 text-center">
        <p className="text-sm text-danger mb-3">{error}</p>
        {onRetry && (
          <Button size="sm" variant="danger" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Date Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          className="shrink-0 rounded-pill p-2 text-chalk/60 hover:bg-chalk/10"
          onClick={() => {
            const idx = dateStrip.findIndex((d) => d.date === date);
            const prev = idx > 0 ? dateStrip[idx - 1] : undefined;
            if (prev) onDateChange?.(prev.date);
          }}
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {dateStrip.map((d) => (
            <button
              key={d.date}
              onClick={() => onDateChange?.(d.date)}
              className={cn(
                "shrink-0 flex flex-col items-center gap-0.5 rounded-[14px] px-3 py-2 text-xs font-medium transition-all",
                d.date === date
                  ? "bg-volt-400 text-ink-900 shadow-volt"
                  : "text-chalk/70 hover:bg-chalk/10",
                d.isToday && d.date !== date && "border border-volt-400/40",
              )}
            >
              <span className="text-[10px]">{d.dayName}</span>
              <span>{d.label}</span>
            </button>
          ))}
        </div>
        <button
          className="shrink-0 rounded-pill p-2 text-chalk/60 hover:bg-chalk/10"
          onClick={() => {
            const idx = dateStrip.findIndex((d) => d.date === date);
            const next = idx >= 0 && idx < dateStrip.length - 1 ? dateStrip[idx + 1] : undefined;
            if (next) onDateChange?.(next.date);
          }}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Sport chips + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-pill bg-chalk/8 p-1.5 border border-chalk/10">
          {sports.map((s) => (
            <button
              key={s}
              onClick={() => onSportChange?.(s)}
              className={cn(
                "rounded-pill px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap",
                s === sport
                  ? "bg-volt-400 text-ink-900 shadow-volt"
                  : "text-chalk/70 hover:bg-chalk/10 hover:text-chalk",
              )}
            >
              <span className="mr-1">{SPORT_ICONS[s]}</span>
              {SPORT_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Badge live className="text-[11px]">Live</Badge>

          <button
            onClick={() => setShowLegend((v) => !v)}
            className="rounded-pill border border-chalk/18 px-2.5 py-1.5 text-[11px] text-chalk/70 hover:bg-chalk/10"
          >
            Legend {showLegend ? "▴" : "▾"}
          </button>

          <button
            onClick={() => setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))}
            className="rounded-pill border border-chalk/18 p-1.5 text-chalk/60 hover:bg-chalk/10"
            title={`Density: ${density}`}
          >
            <SlidersHorizontal className="size-3.5" />
          </button>

          <Button size="sm" variant="ghost" onClick={jumpToNextFree} leftIcon={<Search className="size-3.5" />}>
            Next free
          </Button>
        </div>
      </div>

      {/* Legend */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-3 px-2 text-[11px]"
          >
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-chalk/10 border border-chalk/20" /> Free</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-court-700" /> Booked</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-warning/20 border border-warning/40" /> Held</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-court-700/50" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.06) 2px, rgba(255,255,255,0.06) 4px)" }} /> Blocked</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-info/20 border border-info/40" /> Social</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-volt-400/20 border-2 border-volt-400" /> Mine</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Table */}
      <div className="w-full overflow-hidden rounded-[16px] border border-chalk/14 bg-court-500 shadow-card">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : grid.length === 0 ? (
          <EmptyState
            title={`No ${SPORT_LABELS[sport]} courts available`}
            description="Try a different sport or date."
          />
        ) : (
          <div ref={scrollRef} className="overflow-x-auto">
            <table className="w-full border-collapse text-left" role="grid">
              <thead className="sticky top-0 z-10 bg-court-700">
                <tr>
                  <th className="sticky left-0 z-20 bg-court-700 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-chalk/70 border-r border-chalk/14 min-w-[110px]">
                    Court
                  </th>
                  {TIME_SLOTS.map((t) => (
                    <th
                      key={t}
                      className="px-1 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-chalk/70 border-r border-chalk/8 min-w-[72px] whitespace-nowrap"
                    >
                      {formatTime(t)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((court, courtIdx) => {
                  const row = grid[courtIdx];
                  if (!row) return null;

                  return (
                    <tr
                      key={court.id}
                      className={cn(
                        "border-t border-chalk/8 transition-colors",
                        courtIdx % 2 === 1 ? "bg-court-600/40" : "bg-court-500"
                      )}
                    >
                      <td className="sticky left-0 z-10 bg-inherit px-3 py-2 border-r border-chalk/14">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-chalk">{court.name}</span>
                          <span className="text-[10px] text-chalk/50">
                            {court.indoor ? "Indoor" : "Outdoor"}
                          </span>
                        </div>
                      </td>
                      {row.map((cell, ci) => {
                        const isSelected =
                          selectedSlot?.courtId === cell.courtId &&
                          selectedSlot?.time === cell.time;
                        const secondHalfTime = selectedSlot
                          ? getSecondHalfTime(selectedSlot.time)
                          : null;
                        const isSecondHalf =
                          !!selectedSlot &&
                          selectedSlot.courtId === cell.courtId &&
                          secondHalfTime === cell.time;

                        return (
                          <td key={`${cell.courtId}-${cell.time}`} className="p-0">
                            <SlotCellView
                              cell={cell}
                              isSelected={isSelected}
                              isSecondHalf={isSecondHalf}
                              mode={mode}
                              density={density}
                              onClick={() => onSelectSlot?.({ courtId: cell.courtId, time: cell.time })}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onSelectSlot?.({ courtId: cell.courtId, time: cell.time });
                                }
                              }}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
