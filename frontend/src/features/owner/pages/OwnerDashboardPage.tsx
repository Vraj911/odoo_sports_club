import { useState, useTransition } from "react";
import { useGo } from "@/app/router/links";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KPICard } from "@/components/ui/KPICard";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { useOwnerStore, formatINR, downloadCSV } from "../ownerStore";
import { ExportMenu } from "../components/ExportMenu";
import { ShareLinkDialog } from "../components/ShareLinkDialog";
import { DrillDownDrawer } from "../components/DrillDownDrawer";
import { PeakHoursHeatmap } from "../components/PeakHoursHeatmap";
import { TrendChartCard } from "../components/TrendChartCard";
import type { TimeWindow, ComparisonType, DrillDownItem } from "../types";
import {
  Crown,
  Calendar,
  TrendingUp,
  Share2,
  Download,
  Users,
  Activity,
  Package,
  Beer,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/components/ui/Toast";

export default function OwnerDashboardPage() {
  const go = useGo();
  const [isPending, startTransition] = useTransition();

  const {
    timeWindow,
    comparison,
    setTimeWindow,
    setComparison,
    kpis,
    revenueBySource,
    revenueByMethod,
    operations,
    members,
    inventory,
    bar,
    crm,
    heatmapData,
    openDrillDown,
    filteredPayments,
  } = useOwnerStore();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // TimeWindow tab change
  const handleTimeWindowChange = (win: TimeWindow) => {
    startTransition(() => {
      setTimeWindow(win);
    });
  };

  // Comparison toggle
  const handleComparisonChange = (comp: ComparisonType) => {
    startTransition(() => {
      setComparison(comp);
    });
  };

  // Drilldown triggers
  const handleRevenueDrillDown = () => {
    const items: DrillDownItem[] = filteredPayments.map((p) => ({
      id: p.id,
      timestamp: p.timestamp,
      source: p.source,
      description: p.notes || `${p.source} Payment`,
      customerName: p.customerName,
      method: p.method,
      amount: p.amount,
      status: p.status,
    }));
    openDrillDown("Total Revenue Ledger", `All ${filteredPayments.length} recorded payments (${timeWindow.replace("_", " ")})`, items);
  };

  const handleSourceDrillDown = (item: { name: string; amount: number }) => {
    const rawSource =
      item.name.includes("Court") ? "COURT" :
      item.name.includes("Membership") ? "MEMBERSHIP" :
      item.name.includes("Shop") ? "SHOP" : "BAR";

    const matched = filteredPayments.filter((p) => p.source === rawSource);
    const items: DrillDownItem[] = matched.map((p) => ({
      id: p.id,
      timestamp: p.timestamp,
      source: p.source,
      description: p.notes || `${item.name} Transaction`,
      customerName: p.customerName,
      method: p.method,
      amount: p.amount,
      status: p.status,
    }));
    openDrillDown(`${item.name} Breakdown`, `Underlying transactions totaling ${formatINR(item.amount)}`, items);
  };

  const handleMethodDrillDown = (item: { name: string; amount: number }) => {
    const rawMethod =
      item.name.includes("UPI") ? "UPI" :
      item.name.includes("Card") ? "CARD" :
      item.name.includes("Cash") ? "CASH" : "ONLINE";

    const matched = filteredPayments.filter((p) => p.method === rawMethod);
    const items: DrillDownItem[] = matched.map((p) => ({
      id: p.id,
      timestamp: p.timestamp,
      source: p.source,
      description: p.notes || `${item.name} Settlement`,
      customerName: p.customerName,
      method: p.method,
      amount: p.amount,
      status: p.status,
    }));
    openDrillDown(`${item.name} Settlement Ledger`, `All transactions collected via ${item.name}`, items);
  };

  const handleExportFullDashboardCSV = () => {
    const headers = ["Metric Category", "Metric Name", "Current Value", "Delta %", "Comparison Baseline"];
    const rows: (string | number)[][] = [
      ["Executive Summary", "Total Revenue", kpis.revenue.value, `${kpis.revenue.deltaPercent}%`, comparison],
      ["Executive Summary", "Operating Expenses", kpis.expenses.value, `${kpis.expenses.deltaPercent}%`, comparison],
      ["Executive Summary", "Net Operating Profit", kpis.netProfit.value, `${kpis.netProfit.deltaPercent}%`, comparison],
      ["Executive Summary", "Amounts Owed / Liabilities", kpis.amountsOwed.value, `${kpis.amountsOwed.deltaPercent}%`, comparison],
      ["Executive Summary", "Accounts Receivable", kpis.receivables.value, `${kpis.receivables.deltaPercent}%`, comparison],
      ["Operations", "Total Bookings", operations.bookingsCount, `${operations.bookingsDelta}%`, comparison],
      ["Operations", "Court Utilisation Rate", `${operations.utilisationRate}%`, `${operations.utilisationDelta}%`, comparison],
      ["Operations", "Social Session Fill Rate", `${operations.socialFillRate}%`, "-", comparison],
      ["Memberships", "Total Active Members", members.totalActive, "-", comparison],
      ["Memberships", "Renewal Rate", `${members.renewalRate}%`, "-", comparison],
      ["Inventory", "Total Stock Valuation", inventory.stockValue, "-", comparison],
      ["Bar", "Bar Revenue", bar.todayRevenue, "-", comparison],
      ["CRM", "Pipeline Value", crm.pipelineValue, "-", comparison],
    ];

    downloadCSV(`ccms-executive-summary-${timeWindow.toLowerCase()}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-chalk/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <Crown className="size-4" />
            </span>
            <h1 className="text-xl font-bold text-chalk">Executive Owner Dashboard</h1>
            <span className="font-mono text-xs text-volt-400 font-bold px-2 py-0.5 rounded-full bg-volt-400/10 border border-volt-400/30">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-chalk/60 mt-0.5">
            Real-time club performance, consolidated department P&L, court utilisation, and financial governance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time Window Segmented Control */}
          <div className="flex items-center bg-court-700/60 p-1 rounded-full border border-chalk/10">
            {(["TODAY", "THIS_WEEK", "THIS_MONTH"] as TimeWindow[]).map((tw) => (
              <button
                key={tw}
                type="button"
                onClick={() => handleTimeWindowChange(tw)}
                className={cn(
                  "rounded-full px-3.5 py-1 text-xs font-semibold transition-all",
                  timeWindow === tw
                    ? "bg-volt-400 text-ink-900 shadow-sm"
                    : "text-chalk/70 hover:text-chalk"
                )}
              >
                {tw === "TODAY" ? "Today" : tw === "THIS_WEEK" ? "This Week" : "This Month"}
              </button>
            ))}
          </div>

          {/* Comparison Selector */}
          <select
            value={comparison}
            onChange={(e) => handleComparisonChange(e.target.value as ComparisonType)}
            className="h-9 rounded-full bg-court-700/60 border border-chalk/14 text-chalk/90 text-xs px-3 font-medium focus:border-volt-400 focus:outline-none"
          >
            <option value="PREV_PERIOD" className="bg-navy-900">vs Prev Period</option>
            <option value="LAST_YEAR" className="bg-navy-900">vs Last Year</option>
          </select>

          {/* Share Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            className="gap-1.5 text-xs text-chalk hover:text-volt-300"
          >
            <Share2 className="size-3.5 text-volt-400" /> Share
          </Button>

          {/* Export Menu */}
          <ExportMenu
            onExportCSV={handleExportFullDashboardCSV}
            reportTitle={`Executive Summary - ${timeWindow}`}
          />
        </div>
      </div>

      {/* ROW 1: 5 EXECUTIVE KPI CARDS (Clickable for drill-down) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div onClick={handleRevenueDrillDown} className="cursor-pointer group">
          <KPICard
            label="Gross Revenue"
            value={kpis.revenue.formattedValue}
            delta={{
              value: `+${kpis.revenue.deltaPercent}%`,
              isPositive: kpis.revenue.isPositive,
            }}
            sparklineData={kpis.revenue.sparkline}
            className="transition-transform group-hover:-translate-y-1 group-hover:border-volt-400/50"
          />
        </div>

        <div
          onClick={() => {
            const items: DrillDownItem[] = [
              { id: "EXP-101", timestamp: "2026-10-02T10:00:00Z", source: "UTILITIES", description: "Tata Power Electricity Bill", method: "BANK_TRANSFER", amount: 48500, status: "COMPLETED" },
              { id: "EXP-102", timestamp: "2026-10-01T15:30:00Z", source: "MAINTENANCE", description: "Court 2 LED Floodlight Repairs", method: "BANK_TRANSFER", amount: 14200, status: "COMPLETED" },
              { id: "EXP-103", timestamp: "2026-09-30T18:00:00Z", source: "F&B", description: "Sula Wines Restock Consignment", method: "CARD", amount: 28400, status: "COMPLETED" },
            ];
            openDrillDown("Operating Expenses Drill-Down", "Approved disbursements and supplier invoices", items);
          }}
          className="cursor-pointer group"
        >
          <KPICard
            label="Operating Expenses"
            value={kpis.expenses.formattedValue}
            delta={{
              value: `+${kpis.expenses.deltaPercent}%`,
              isPositive: false,
            }}
            sparklineData={kpis.expenses.sparkline}
            className="transition-transform group-hover:-translate-y-1 group-hover:border-rose-400/50"
          />
        </div>

        <div onClick={handleRevenueDrillDown} className="cursor-pointer group">
          <KPICard
            label="Net Operating Profit"
            value={kpis.netProfit.formattedValue}
            delta={{
              value: `+${kpis.netProfit.deltaPercent}%`,
              isPositive: kpis.netProfit.isPositive,
            }}
            sparklineData={kpis.netProfit.sparkline}
            className="transition-transform group-hover:-translate-y-1 group-hover:border-emerald-400/50"
          />
        </div>

        <div
          onClick={() => {
            const items: DrillDownItem[] = [
              { id: "PAYABLE-HR", timestamp: "2026-10-01T00:00:00Z", source: "HR_PAYROLL", description: "October Staff Payroll Liabilities", method: "NEFT", amount: 485000, status: "PENDING" },
              { id: "BILL-VND-04", timestamp: "2026-09-28T12:00:00Z", source: "VENDOR_BILL", description: "Wilson Sports Equipment Consignment", method: "NET_BANKING", amount: 39000, status: "PENDING" },
            ];
            openDrillDown("Amounts Owed & Liabilities", "Open payables, staff salaries & statutory deductions", items);
          }}
          className="cursor-pointer group"
        >
          <KPICard
            label="Amounts Owed (Liabilities)"
            value={kpis.amountsOwed.formattedValue}
            delta={{
              value: `-${kpis.amountsOwed.deltaPercent}%`,
              isPositive: false,
            }}
            sparklineData={kpis.amountsOwed.sparkline}
            className="transition-transform group-hover:-translate-y-1 group-hover:border-amber-400/50"
          />
        </div>

        <div
          onClick={() => {
            const items: DrillDownItem[] = [
              { id: "INV-2026-0044", timestamp: "2026-10-01T10:00:00Z", source: "CORPORATE_MEMBERSHIP", description: "Reliance Industries Corporate Account", customerName: "Reliance Sports Desk", method: "INVOICE", amount: 120000, status: "PENDING" },
              { id: "DUE-MEM-88", timestamp: "2026-09-29T16:00:00Z", source: "MEMBER_DUES", description: "Quarterly gold membership locker fee", customerName: "Pratham Patel", method: "UPI", amount: 64200, status: "PENDING" },
            ];
            openDrillDown("Accounts Receivable", "Outstanding corporate invoices & uncollected member dues", items);
          }}
          className="cursor-pointer group"
        >
          <KPICard
            label="Accounts Receivable"
            value={kpis.receivables.formattedValue}
            delta={{
              value: `-${kpis.receivables.deltaPercent}%`,
              isPositive: true,
            }}
            sparklineData={kpis.receivables.sparkline}
            className="transition-transform group-hover:-translate-y-1 group-hover:border-sky-400/50"
          />
        </div>
      </div>

      {/* ROW 2: REVENUE BREAKDOWNS (SOURCE & METHOD) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChartCard
          title="Revenue by Department Source"
          subtitle="Courts, Memberships, Pro Shop, and Lounge & Bar breakdown (matches Finance Ledger)"
          data={revenueBySource}
          onItemClick={handleSourceDrillDown}
          defaultChartType="donut"
        />

        <TrendChartCard
          title="Revenue by Collection Method"
          subtitle="UPI / QR, Card EDC, Online Gateway, and Front Desk Cash Drawer"
          data={revenueByMethod}
          onItemClick={handleMethodDrillDown}
          defaultChartType="donut"
        />
      </div>

      {/* ROW 3: OPERATIONS METRICS & PEAK-HOURS HEATMAP */}
      <div className="space-y-4">
        {/* Operations KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4 bg-court-700/50 border-chalk/10 flex flex-col justify-between">
            <span className="text-xs text-chalk/70 font-medium">Court Bookings</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold font-mono text-volt-400">{operations.bookingsCount}</span>
              <span className="text-[11px] text-emerald-400 flex items-center">
                <ArrowUpRight className="size-3" /> {operations.bookingsDelta}%
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-court-700/50 border-chalk/10 flex flex-col justify-between">
            <span className="text-xs text-chalk/70 font-medium">Court Utilisation</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold font-mono text-volt-400">{operations.utilisationRate}%</span>
              <span className="text-[11px] text-emerald-400 flex items-center">
                <ArrowUpRight className="size-3" /> {operations.utilisationDelta}%
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-court-700/50 border-chalk/10 flex flex-col justify-between">
            <span className="text-xs text-chalk/70 font-medium">No-Show Rate</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold font-mono text-amber-400">{operations.noShowRate}%</span>
              <span className="text-[10px] text-chalk/50 font-mono">Industry: 4.5%</span>
            </div>
          </Card>

          <Card className="p-4 bg-court-700/50 border-chalk/10 flex flex-col justify-between">
            <span className="text-xs text-chalk/70 font-medium">Cancellations</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold font-mono text-chalk">{operations.cancellationRate}%</span>
              <span className="text-[10px] text-chalk/50 font-mono">Within window</span>
            </div>
          </Card>

          <Card className="p-4 bg-court-700/50 border-chalk/10 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-xs text-chalk/70 font-medium">Social Play Fill Rate</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold font-mono text-volt-400">{operations.socialFillRate}%</span>
              <span className="text-[10px] text-emerald-400 font-bold">Optimal</span>
            </div>
          </Card>
        </div>

        {/* Peak Hours Heatmap */}
        <PeakHoursHeatmap cells={heatmapData} />
      </div>

      {/* ROW 4: MEMBERSHIP ANALYTICS & EXPIRING MEMBERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier Distribution (5 cols) */}
        <Card className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <Users className="size-4 text-volt-400" /> Active Membership Base
            </h3>
            <span className="font-mono text-xs text-volt-400 font-bold">
              {members.totalActive} Active Members
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {members.tierCounts.map((tier) => (
              <div key={tier.tier} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-chalk/80">{tier.tier}</span>
                  <span className="font-mono font-bold text-chalk">
                    {tier.count} ({Math.round((tier.count / members.totalActive) * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-court-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(tier.count / members.totalActive) * 100}%`,
                      backgroundColor: tier.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-chalk/10 text-center">
            <div className="p-2 rounded-xl bg-court-700/40">
              <p className="text-[10px] text-chalk/50">New Signups</p>
              <p className="text-base font-bold text-volt-400 font-mono">+{members.newMembersThisPeriod}</p>
            </div>
            <div className="p-2 rounded-xl bg-court-700/40">
              <p className="text-[10px] text-chalk/50">Renewal Rate</p>
              <p className="text-base font-bold text-emerald-400 font-mono">{members.renewalRate}%</p>
            </div>
            <div className="p-2 rounded-xl bg-court-700/40">
              <p className="text-[10px] text-chalk/50">Monthly Churn</p>
              <p className="text-base font-bold text-rose-300 font-mono">{members.churnRate}%</p>
            </div>
          </div>
        </Card>

        {/* Expiring Members in 30 Days (7 cols) */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
                <Clock className="size-4 text-amber-400" /> Memberships Expiring in 30 Days
              </h3>
              <p className="text-xs text-chalk/50">Proactive renewal outreach candidates</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => go("/admin/plans")}
              className="text-xs text-volt-400 hover:text-volt-300 gap-1"
            >
              Membership Plans <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            {members.expiringIn30Days.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-xl bg-court-700/40 border border-chalk/10 hover:border-chalk/20 transition-all"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-chalk">{m.name}</span>
                    <span className="rounded px-1.5 py-0.2 text-[10px] font-bold bg-volt-400/20 text-volt-400 border border-volt-400/30">
                      {m.tier}
                    </span>
                  </div>
                  <p className="text-[11px] text-chalk/50 font-mono">{m.id} · {m.phone}</p>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-400">
                    {m.daysRemaining} days left
                  </span>
                  <p className="text-[10px] text-chalk/50">Valid till {m.validTill}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ROW 5: INVENTORY & BAR PERFORMANCE SNIPPETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pro Shop & Inventory Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <Package className="size-4 text-volt-400" /> Pro Shop & Inventory Performance
            </h3>
            <span className="font-mono text-xs text-volt-400 font-bold">
              Stock Value: {formatINR(inventory.stockValue)}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-court-700/50 border border-chalk/10">
              <p className="text-chalk/60 text-[11px]">Low-Stock Alerts</p>
              <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                {inventory.lowStockCount} items below threshold
              </p>
            </div>
            <div className="p-3 rounded-xl bg-court-700/50 border border-chalk/10">
              <p className="text-chalk/60 text-[11px]">Pending Online Orders</p>
              <p className="text-lg font-bold text-volt-400 font-mono mt-0.5">
                {inventory.pendingOnlineOrders} orders ready for fulfillment
              </p>
            </div>
          </div>

          {/* Top Sellers */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-chalk/80 block">Top Revenue Merchandises</span>
            {inventory.bestSellers.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs py-1.5 border-b border-chalk/5">
                <span className="text-chalk/80 truncate">
                  <span className="text-volt-400 font-mono font-bold mr-2">#{idx + 1}</span>
                  {item.name}
                </span>
                <span className="font-mono font-bold text-chalk shrink-0">{formatINR(item.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Lounge & Bar Card */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <Beer className="size-4 text-volt-400" /> Lounge & Bar Shift Summary
            </h3>
            <span className="font-mono text-xs text-emerald-400 font-bold">
              Today: {formatINR(bar.todayRevenue)}
            </span>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-court-700/50 border border-chalk/10">
              <p className="text-chalk/50 text-[10px]">Orders Served</p>
              <p className="text-base font-bold text-chalk font-mono mt-0.5">{bar.ordersHandled}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-court-700/50 border border-chalk/10">
              <p className="text-chalk/50 text-[10px]">Average Ticket</p>
              <p className="text-base font-bold text-volt-400 font-mono mt-0.5">{formatINR(bar.averageTicket)}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-court-700/50 border border-chalk/10">
              <p className="text-chalk/50 text-[10px]">Open Tabs</p>
              <p className="text-base font-bold text-amber-400 font-mono mt-0.5">{bar.openTabsCount} tabs</p>
            </div>
          </div>

          {/* Top F&B Items */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-chalk/80 block">Highest Velocity Orders</span>
            {bar.topItems.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-xs py-1.5 border-b border-chalk/5">
                <span className="text-chalk/80 truncate">
                  <span className="text-volt-400 font-mono font-bold mr-2">#{idx + 1}</span>
                  {item.name} ({item.count} orders)
                </span>
                <span className="font-mono font-bold text-chalk shrink-0">{formatINR(item.revenue)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ROW 6: CRM KPIS & RECEIVABLES / PAYABLES AGING BUCKETS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CRM Pipeline (5 cols) */}
        <Card className="lg:col-span-5 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <Activity className="size-4 text-volt-400" /> Commercial & Corporate CRM
            </h3>
            <span className="font-mono text-xs text-volt-400 font-bold">
              {crm.newLeadsCount} New Leads
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-court-700/50 border border-chalk/10">
              <p className="text-chalk/60 text-[11px]">Pipeline Valuation</p>
              <p className="text-lg font-bold text-volt-400 font-mono mt-0.5">{formatINR(crm.pipelineValue)}</p>
            </div>
            <div className="p-3 rounded-xl bg-court-700/50 border border-chalk/10">
              <p className="text-chalk/60 text-[11px]">Conversion Rate</p>
              <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{crm.conversionRate}%</p>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => go("/crm/leads")}
            className="w-full text-xs text-chalk/80 hover:text-volt-300"
          >
            Review Active Corporate Leads
          </Button>
        </Card>

        {/* Receivables & Payables Aging Buckets (7 cols) */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <FileText className="size-4 text-volt-400" /> Aging Buckets: Receivables vs Payables
            </h3>
            <span className="text-xs text-chalk/50 font-mono">Audit Standard</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {crm.agingBuckets.map((bucket) => (
              <div key={bucket.label} className="p-3 rounded-xl bg-court-700/40 border border-chalk/10 space-y-2">
                <span className="text-xs font-bold text-chalk block text-center pb-1 border-b border-chalk/10">
                  {bucket.label}
                </span>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-chalk/60 text-[11px]">Receivables:</span>
                    <span className="font-mono text-emerald-400 font-bold">{formatINR(bucket.receivables)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-chalk/60 text-[11px]">Payables:</span>
                    <span className="font-mono text-rose-300 font-bold">{formatINR(bucket.payables)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Drill Down Drawer */}
      <DrillDownDrawer />

      {/* Share Link Modal */}
      <ShareLinkDialog
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        defaultTimeWindow={timeWindow}
      />
    </div>
  );
}
