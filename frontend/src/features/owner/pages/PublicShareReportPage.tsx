import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { TrendChartCard } from "../components/TrendChartCard";
import { PeakHoursHeatmap } from "../components/PeakHoursHeatmap";
import { useOwnerStore, formatINR } from "../ownerStore";
import {
  ShieldAlert,
  ShieldCheck,
  Printer,
  Calendar,
  Layers,
  Crown,
  Lock,
  Clock,
  Building2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/cn";

export interface PublicShareReportPageProps {
  params?: { token?: string };
}

export default function PublicShareReportPage({ params }: PublicShareReportPageProps) {
  const token = params?.token || "board-oct26-exec";
  const {
    getShareLinkByToken,
    incrementLinkViews,
    kpis,
    revenueBySource,
    revenueByMethod,
    operations,
    members,
    heatmapData,
  } = useOwnerStore();

  const [hasIncremented, setHasIncremented] = useState(false);

  const shareRecord = getShareLinkByToken(token);

  useEffect(() => {
    if (shareRecord && !hasIncremented) {
      incrementLinkViews(token);
      setHasIncremented(true);
    }
  }, [token, shareRecord, hasIncremented, incrementLinkViews]);

  // Invalid, Revoked, or Expired Link Friendly State
  if (!shareRecord || shareRecord.status === "REVOKED" || shareRecord.status === "EXPIRED") {
    return (
      <div className="min-h-screen bg-navy-950 text-chalk flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-5 bg-court-800/80 border border-chalk/14 p-8 rounded-3xl shadow-2xl backdrop-blur-md">
          <div className="size-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto">
            <ShieldAlert className="size-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-chalk">Link No Longer Valid</h1>
            <p className="text-xs text-chalk/70 leading-relaxed">
              This executive report link has either been revoked by club administration or has exceeded its scheduled validity period.
            </p>
          </div>

          <div className="rounded-xl border border-chalk/10 bg-court-700/50 p-3 text-[11px] text-chalk/50 font-mono">
            Security Token: {token} · Status: {shareRecord?.status || "NOT_FOUND"}
          </div>

          <p className="text-[11px] text-chalk/40">
            If you require access to this financial summary, please contact Champions Sports Club Management at <span className="text-volt-400">admin@championsclub.in</span>.
          </p>
        </div>
      </div>
    );
  }

  // Active Read-Only Public Report View
  const expiryFormatted = new Date(shareRecord.expiresAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-navy-950 text-chalk p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Read-Only Status Bar */}
      <div className="rounded-2xl border border-volt-400/40 bg-court-800/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-volt-400/20 text-volt-400 border border-volt-400/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-chalk">Champions Sports Club · Executive Board Report</span>
              <span className="rounded-pill bg-volt-400 text-ink-900 text-[11px] font-extrabold px-2.5 py-0.5">
                Read-Only · Expires {expiryFormatted}
              </span>
            </div>
            <p className="text-xs text-chalk/60 font-mono mt-0.5">
              Authorized Token: {shareRecord.token} · Scope: {shareRecord.scope.replace("_", " ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs text-chalk hover:text-volt-300"
          >
            <Printer className="size-3.5" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Report Header */}
      <div className="space-y-1 pb-2 border-b border-chalk/10">
        <h1 className="text-2xl font-bold text-chalk">{shareRecord.title}</h1>
        <p className="text-xs text-chalk/70">
          Executive performance snapshot for October 2026. Consolidated general ledger revenue, operations capacity, and membership health.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Consolidated Gross Revenue"
          value={kpis.revenue.formattedValue}
          delta={{ value: `+${kpis.revenue.deltaPercent}%`, isPositive: true }}
          sparklineData={kpis.revenue.sparkline}
        />
        <KPICard
          label="Total Operating Expenses"
          value={kpis.expenses.formattedValue}
          delta={{ value: `+${kpis.expenses.deltaPercent}%`, isPositive: false }}
          sparklineData={kpis.expenses.sparkline}
        />
        <KPICard
          label="Net Operating Profit (EBITDA)"
          value={kpis.netProfit.formattedValue}
          delta={{ value: `+${kpis.netProfit.deltaPercent}%`, isPositive: true }}
          sparklineData={kpis.netProfit.sparkline}
        />
        <KPICard
          label="Court Utilisation Rate"
          value={`${operations.utilisationRate}%`}
          delta={{ value: `+${operations.utilisationDelta}%`, isPositive: true }}
        />
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChartCard
          title="Revenue by Department Source"
          subtitle="Courts, Memberships, Pro Shop, and Lounge & Bar"
          data={revenueBySource}
          defaultChartType="donut"
        />

        <TrendChartCard
          title="Revenue by Collection Method"
          subtitle="UPI / QR, Card POS, Online Web Gateway, and Cash Drawer"
          data={revenueByMethod}
          defaultChartType="donut"
        />
      </div>

      {/* Utilisation Heatmap */}
      <PeakHoursHeatmap cells={heatmapData} />

      {/* Read-only Footer */}
      <div className="text-center text-xs text-chalk/40 py-6 border-t border-chalk/10 font-mono space-y-1">
        <p>Champions Recreational & Sports Facilities Pvt. Ltd. · GSTIN: 27AAAAA0000A1Z5</p>
        <p>Confidential Document · Issued under tokenized access control</p>
      </div>
    </div>
  );
}
