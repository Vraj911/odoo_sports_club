import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, type Column } from "@/components/ui/Table";
import { KPICard } from "@/components/ui/KPICard";
import { useAdminOpsStore } from "../adminOpsStore";
import { useOwnerStore } from "../../owner/ownerStore";
import { PeakHoursHeatmap } from "../../owner/components/PeakHoursHeatmap";
import type { UtilisationDataPoint } from "../types";
import {
  Activity,
  Flame,
  Clock,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function AdminUtilisationPage() {
  const { utilisationData } = useAdminOpsStore();
  const { heatmapData } = useOwnerStore();

  const [selectedSport, setSelectedSport] = useState<string>("ALL");

  const filteredUtilisation = useMemo(() => {
    if (selectedSport === "ALL") return utilisationData;
    return utilisationData.filter((u) => u.sport === selectedSport);
  }, [utilisationData, selectedSport]);

  const overallUtilisation = useMemo(() => {
    if (!utilisationData.length) return 0;
    const totalBooked = utilisationData.reduce((sum, u) => sum + u.bookedHours, 0);
    const totalAvail = utilisationData.reduce((sum, u) => sum + u.availableHours, 0);
    return Math.round((totalBooked / totalAvail) * 100);
  }, [utilisationData]);

  const columns: Column<UtilisationDataPoint>[] = [
    {
      key: "court",
      header: "Court & Sport",
      render: (u) => (
        <div className="space-y-0.5">
          <p className="font-bold text-xs text-chalk">{u.courtName}</p>
          <span className="text-[10px] font-mono text-volt-400 uppercase font-semibold">
            {u.sport}
          </span>
        </div>
      ),
    },
    {
      key: "hours",
      header: "Booked / Available",
      render: (u) => (
        <div className="font-mono text-xs">
          <span className="text-chalk font-bold">{u.bookedHours} hrs</span>
          <span className="text-chalk/40"> / {u.availableHours} hrs</span>
        </div>
      ),
    },
    {
      key: "rate",
      header: "Utilisation %",
      render: (u) => (
        <div className="space-y-1 w-36">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-volt-400">{u.utilisationRate}%</span>
            <span className="text-[10px] text-chalk/50">
              {u.utilisationRate >= 75 ? "Optimal" : u.utilisationRate >= 50 ? "Moderate" : "Low"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-court-700 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                u.utilisationRate >= 75
                  ? "bg-volt-400"
                  : u.utilisationRate >= 50
                  ? "bg-emerald-400"
                  : "bg-amber-400"
              )}
              style={{ width: `${u.utilisationRate}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      key: "peak",
      header: "Peak Density Window",
      render: (u) => (
        <span className="font-mono text-xs text-chalk/70">{u.peakHour}</span>
      ),
    },
    {
      key: "revenue",
      header: "Revenue Yield",
      render: (u) => (
        <span className="font-mono text-xs font-bold text-volt-400">
          ₹{u.revenue.toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Court Utilisation & Capacity Analytics"
        subtitle="Ratio of booked court hours to operational capacity (Booked ÷ Available) across sports and time windows (BKG-25)."
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Overall Club Utilisation"
          value={`${overallUtilisation}%`}
          delta={{ value: "+4.2%", isPositive: true }}
          sparklineData={[{ v: 64 }, { v: 68 }, { v: 72 }, { v: 70 }, { v: 75 }, { v: 78 }]}
        />
        <KPICard
          label="Busiest Sport Category"
          value="Padel & Tennis"
          delta={{ value: "91% Peak", isPositive: true }}
        />
        <KPICard
          label="Peak Operating Window"
          value="18:00 – 21:30"
          delta={{ value: "94% Fill", isPositive: true }}
        />
        <KPICard
          label="Daily Booked Court Hours"
          value="74.5 hrs"
          delta={{ value: "+12 hrs", isPositive: true }}
          sparklineData={[{ v: 55 }, { v: 60 }, { v: 62 }, { v: 68 }, { v: 72 }, { v: 74 }]}
        />
      </div>

      {/* Filter and Sport Selection */}
      <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-volt-400" />
          <span className="text-xs font-semibold text-chalk">Sport Discipline:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "ALL", label: "All Courts (8)" },
            { id: "tennis", label: "Tennis" },
            { id: "badminton", label: "Badminton" },
            { id: "squash", label: "Squash" },
            { id: "padel", label: "Padel" },
          ].map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setSelectedSport(sp.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                selectedSport === sp.id
                  ? "bg-volt-400 text-ink-900 border-volt-400 font-bold"
                  : "bg-court-700/60 border-chalk/10 text-chalk/70 hover:text-chalk"
              )}
            >
              {sp.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Court Utilisation Ranking Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-volt-400" />
            <h3 className="text-sm font-semibold text-chalk">Court-by-Court Capacity Utilization</h3>
          </div>
          <span className="text-xs text-chalk/50 font-mono">
            Standard: 16 Operating Hours / Day
          </span>
        </div>

        <Table
          data={filteredUtilisation}
          columns={columns}
          keyExtractor={(u) => u.courtId}
          emptyTitle="No court data found"
          emptySubtitle="No courts match the selected sport filter."
        />
      </Card>

      {/* Heatmap Card */}
      <PeakHoursHeatmap cells={heatmapData} />
    </div>
  );
}
