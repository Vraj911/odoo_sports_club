import { useState } from "react";
import { Card } from "@/components/ui/Card";
import type { HeatmapCell } from "../types";
import { Clock, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export interface PeakHoursHeatmapProps {
  cells: HeatmapCell[];
  className?: string;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 to 22
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function PeakHoursHeatmap({ cells, className }: PeakHoursHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const getCellColor = (pct: number) => {
    if (pct < 30) return "bg-court-700/60 text-chalk/40 border-chalk/5";
    if (pct < 60) return "bg-emerald-500/25 text-emerald-300 border-emerald-500/30";
    if (pct < 85) return "bg-volt-400/40 text-volt-300 border-volt-400/50 font-bold";
    return "bg-volt-400 text-ink-900 border-volt-300 font-extrabold shadow-sm"; // Peak
  };

  return (
    <Card className={cn("p-5 space-y-4", className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
            <Clock className="size-4 text-volt-400" /> Peak Hours Utilisation Heatmap
          </h3>
          <p className="text-xs text-chalk/60">
            Court occupancy density across operating hours (06:00 – 23:00 IST)
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[10px] text-chalk/60 flex-wrap">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-court-700/60 border border-chalk/10" /> &lt;30% (Low)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-emerald-500/30 border border-emerald-500/40" /> 30–60%
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-volt-400/40 border border-volt-400/60" /> 60–85% (High)
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded bg-volt-400" /> &gt;85% (Peak)
          </span>
        </div>
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[640px] space-y-1">
          {/* Header Row: Hours */}
          <div className="grid grid-cols-[56px_repeat(17,1fr)] gap-1 text-[10px] font-mono text-chalk/50 text-center pb-1 border-b border-chalk/10">
            <span className="text-left font-semibold">Day</span>
            {HOURS.map((h) => (
              <span key={h}>{String(h).padStart(2, "0")}h</span>
            ))}
          </div>

          {/* Day Rows */}
          {DAYS.map((day) => (
            <div key={day} className="grid grid-cols-[56px_repeat(17,1fr)] gap-1 items-center">
              <span className="text-xs font-mono font-medium text-chalk/70 text-left">{day}</span>
              {HOURS.map((hour) => {
                const cell =
                  cells.find((c) => c.day === day && c.hour === hour) || {
                    day,
                    hour,
                    occupancyPercent: 20,
                    bookingsCount: 2,
                  };

                return (
                  <div
                    key={hour}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={cn(
                      "h-7 rounded-md border flex items-center justify-center text-[10px] transition-all cursor-pointer hover:scale-110 hover:z-10",
                      getCellColor(cell.occupancyPercent)
                    )}
                    title={`${day} ${hour}:00 - ${cell.occupancyPercent}% Occupancy (${cell.bookingsCount}/12 courts)`}
                  >
                    {cell.occupancyPercent >= 40 ? `${cell.occupancyPercent}%` : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Active hover info banner */}
      <div className="h-6 flex items-center justify-between text-xs text-chalk/70 font-mono px-1">
        {hoveredCell ? (
          <p className="flex items-center gap-2">
            <span className="text-chalk font-bold">
              {hoveredCell.day} at {String(hoveredCell.hour).padStart(2, "0")}:00 IST
            </span>
            <span>·</span>
            <span className="text-volt-400 font-bold">{hoveredCell.occupancyPercent}% Utilised</span>
            <span>·</span>
            <span>{hoveredCell.bookingsCount} of 12 Courts Occupied</span>
          </p>
        ) : (
          <p className="text-[11px] text-chalk/40 flex items-center gap-1">
            <Info className="size-3" /> Hover over any slot cell to inspect court occupancy and capacity count
          </p>
        )}
      </div>
    </Card>
  );
}
