import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useFinanceStore, formatCurrency } from "../financeStore";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { formatINR } from "@/components/shared/Money";
import {
  TrendingUp,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Scale,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/cn";

export default function FinancePnlPage() {
  const { payments, expenses, activePeriod } = useFinanceStore();

  const [comparisonPeriod, setComparisonPeriod] = useState<"SEP_2026" | "AUG_2026">("SEP_2026");

  // Current Period (October 2026 MTD) Figures
  const currentPnl = useMemo(() => {
    // Revenue sources
    const courtRev = payments
      .filter((p) => p.source === "COURT" && p.status === "COMPLETED")
      .reduce((s, p) => s + p.amount, 0);

    const membershipRev = payments
      .filter((p) => p.source === "MEMBERSHIP" && p.status === "COMPLETED")
      .reduce((s, p) => s + p.amount, 0);

    const shopRev = payments
      .filter((p) => p.source === "SHOP" && p.status === "COMPLETED")
      .reduce((s, p) => s + p.amount, 0);

    const barRev = payments
      .filter((p) => p.source === "BAR" && p.status === "COMPLETED")
      .reduce((s, p) => s + p.amount, 0);

    const corporateRev = payments
      .filter((p) => p.source === "OTHER" && p.status === "COMPLETED")
      .reduce((s, p) => s + p.amount, 0);

    const totalRevenue = courtRev + membershipRev + shopRev + barRev + corporateRev;

    // Expenses
    const rentExp = expenses
      .filter((e) => e.category === "rent")
      .reduce((s, e) => s + e.amount, 0) || 250000;

    const utilitiesExp = expenses
      .filter((e) => e.category === "utilities")
      .reduce((s, e) => s + e.amount, 0) || 78400;

    const maintenanceExp = expenses
      .filter((e) => e.category === "maintenance")
      .reduce((s, e) => s + e.amount, 0) || 32500;

    const payrollExp = 340000; // Staff & coach salaries
    const cogsExp = 45000; // Shop and Bar COGS
    const marketingExp = expenses
      .filter((e) => e.category === "marketing")
      .reduce((s, e) => s + e.amount, 0) || 15000;

    const totalExpenses = rentExp + utilitiesExp + maintenanceExp + payrollExp + cogsExp + marketingExp;
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      courtRev,
      membershipRev,
      shopRev,
      barRev,
      corporateRev,
      totalRevenue,
      rentExp,
      utilitiesExp,
      maintenanceExp,
      payrollExp,
      cogsExp,
      marketingExp,
      totalExpenses,
      netProfit,
      margin,
    };
  }, [payments, expenses]);

  // Previous Period Benchmark (September 2026)
  const previousPnl = useMemo(() => {
    return {
      courtRev: 340000,
      membershipRev: 620000,
      shopRev: 185000,
      barRev: 290000,
      corporateRev: 410000,
      totalRevenue: 1845000,
      rentExp: 250000,
      utilitiesExp: 75000,
      maintenanceExp: 45000,
      payrollExp: 335000,
      cogsExp: 165000,
      marketingExp: 50000,
      totalExpenses: 920000,
      netProfit: 925000,
      margin: 50.1,
    };
  }, []);

  // Waterfall Chart Data
  const waterfallData = useMemo(() => {
    return [
      { name: "Courts", value: currentPnl.courtRev, type: "revenue" },
      { name: "Memberships", value: currentPnl.membershipRev, type: "revenue" },
      { name: "Shop & Bar", value: currentPnl.shopRev + currentPnl.barRev, type: "revenue" },
      { name: "Corporate", value: currentPnl.corporateRev, type: "revenue" },
      { name: "Gross Rev", value: currentPnl.totalRevenue, type: "subtotal" },
      { name: "Rent & Ground", value: -currentPnl.rentExp, type: "expense" },
      { name: "Payroll", value: -currentPnl.payrollExp, type: "expense" },
      { name: "Utilities", value: -currentPnl.utilitiesExp, type: "expense" },
      { name: "COGS & Supplies", value: -currentPnl.cogsExp, type: "expense" },
      { name: "Maintenance", value: -currentPnl.maintenanceExp, type: "expense" },
      { name: "Net Profit", value: currentPnl.netProfit, type: "total" },
    ];
  }, [currentPnl]);

  const pnlRows = [
    { label: "Court Bookings & Coaching", cur: currentPnl.courtRev, prev: previousPnl.courtRev, isRev: true },
    { label: "Membership Subscriptions", cur: currentPnl.membershipRev, prev: previousPnl.membershipRev, isRev: true },
    { label: "Pro Shop Retail Sales", cur: currentPnl.shopRev, prev: previousPnl.shopRev, isRev: true },
    { label: "Bar & Café Refreshments", cur: currentPnl.barRev, prev: previousPnl.barRev, isRev: true },
    { label: "Corporate Leases & Events", cur: currentPnl.corporateRev, prev: previousPnl.corporateRev, isRev: true },
    { label: "TOTAL OPERATING REVENUE", cur: currentPnl.totalRevenue, prev: previousPnl.totalRevenue, isHeader: true },
    { label: "Facility Ground Lease (Rent)", cur: -currentPnl.rentExp, prev: -previousPnl.rentExp, isExp: true },
    { label: "Staff & Professional Coach Payroll", cur: -currentPnl.payrollExp, prev: -previousPnl.payrollExp, isExp: true },
    { label: "HT Commercial Electricity & Water", cur: -currentPnl.utilitiesExp, prev: -previousPnl.utilitiesExp, isExp: true },
    { label: "Cost of Goods Sold (Shop + F&B)", cur: -currentPnl.cogsExp, prev: -previousPnl.cogsExp, isExp: true },
    { label: "Court Turf & Infrastructure Maintenance", cur: -currentPnl.maintenanceExp, prev: -previousPnl.maintenanceExp, isExp: true },
    { label: "Marketing & Digital Campaigns", cur: -currentPnl.marketingExp, prev: -previousPnl.marketingExp, isExp: true },
    { label: "TOTAL OPERATING EXPENSES", cur: -currentPnl.totalExpenses, prev: -previousPnl.totalExpenses, isHeader: true },
    { label: "NET OPERATING PROFIT (EBITDA)", cur: currentPnl.netProfit, prev: previousPnl.netProfit, isTotal: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit & Loss Statement"
        subtitle="Revenue streams minus operating expenses, payroll, and COGS with waterfall analysis and period comparison (FIN-11)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5"
            >
              <Download className="size-3.5" /> Download P&L PDF
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Comparative Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-court-600">
          <p className="text-xs font-semibold text-chalk/70 uppercase tracking-wider">
            Total Revenue (Oct 2026 MTD)
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-volt-400">
            {formatCurrency(currentPnl.totalRevenue)}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <ArrowUpRight className="size-3.5" /> 14.2% pace vs Sep benchmark
          </p>
        </Card>

        <Card className="p-5 bg-court-600">
          <p className="text-xs font-semibold text-chalk/70 uppercase tracking-wider">
            Operating Expenses (MTD)
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-rose-300">
            {formatCurrency(currentPnl.totalExpenses)}
          </p>
          <p className="text-[11px] text-chalk/60 mt-1">Rent, Payroll & Maintenance</p>
        </Card>

        <Card className="p-5 bg-court-600 border-volt-400/30">
          <p className="text-xs font-semibold text-volt-400 uppercase tracking-wider">
            Net EBITDA Margin
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-chalk">
            {currentPnl.margin.toFixed(1)}%
          </p>
          <p className="text-[11px] text-volt-400 mt-1 font-mono">
            Net Profit: {formatCurrency(currentPnl.netProfit)}
          </p>
        </Card>
      </div>

      {/* Waterfall-style Chart */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-chalk flex items-center gap-2">
              <TrendingUp className="size-4 text-volt-400" /> Revenue & Expense Waterfall
            </h3>
            <p className="text-xs text-chalk/60">
              Contribution cascade from gross revenues through operating deductions to net profit
            </p>
          </div>
          <span className="text-xs font-mono text-chalk/60">October 2026 MTD</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 15, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 11 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
              <RechartsTooltip
                content={({ active, payload }) => {
                  const first = payload?.[0];
                  if (active && first?.payload) {
                    const d = first.payload;
                    return (
                      <div className="rounded-lg border border-chalk/14 bg-court-700 p-2.5 text-xs text-chalk shadow-xl">
                        <p className="font-bold text-volt-400">{d.name}</p>
                        <p className="font-mono mt-0.5">{formatCurrency(d.value)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {waterfallData.map((entry, index) => {
                  let color = "#38bdf8";
                  if (entry.type === "revenue") color = "#38bdf8";
                  else if (entry.type === "subtotal") color = "#d5f63a";
                  else if (entry.type === "expense") color = "#f87171";
                  else if (entry.type === "total") color = "#34d399";
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Comparative Statement Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-chalk/10 pb-4">
          <div>
            <h3 className="text-base font-semibold text-chalk">
              Income Statement (Comparative P&L)
            </h3>
            <p className="text-xs text-chalk/60">
              Comparing Current Period (Oct 2026 MTD) against benchmark (Sep 2026)
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-chalk/60">Benchmark:</span>
            <select
              value={comparisonPeriod}
              onChange={(e) => setComparisonPeriod(e.target.value as any)}
              className="rounded-input border border-chalk/14 bg-court-700 px-3 py-1.5 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
            >
              <option value="SEP_2026">September 2026 (Actual)</option>
              <option value="AUG_2026">August 2026 (Actual)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-court-700/60 text-chalk/70 font-semibold uppercase text-[10px] tracking-wider border-b border-chalk/10">
              <tr>
                <th className="py-3 px-4">Line Item / Source</th>
                <th className="py-3 px-4 text-right">Oct 2026 (MTD)</th>
                <th className="py-3 px-4 text-right">Sep 2026 (Benchmark)</th>
                <th className="py-3 px-4 text-right">Variance (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8 text-chalk/90">
              {pnlRows.map((r, idx) => {
                const diff = r.cur - r.prev;
                const isHeader = r.isHeader;
                const isTotal = r.isTotal;

                return (
                  <tr
                    key={idx}
                    className={cn(
                      isHeader && "bg-court-700/80 font-bold text-chalk border-t-2 border-chalk/20",
                      isTotal && "bg-court-700 font-extrabold text-volt-400 border-t-2 border-volt-400/40 text-sm",
                      !isHeader && !isTotal && "hover:bg-chalk/5"
                    )}
                  >
                    <td className="py-2.5 px-4 font-medium">{r.label}</td>
                    <td
                      className={cn(
                        "py-2.5 px-4 text-right font-mono",
                        r.isExp ? "text-rose-300" : isTotal ? "text-volt-400" : "text-chalk"
                      )}
                    >
                      {formatINR(r.cur)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-chalk/70">
                      {formatINR(r.prev)}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 px-4 text-right font-mono font-medium",
                        diff > 0 ? "text-emerald-400" : diff < 0 ? "text-rose-400" : "text-chalk/60"
                      )}
                    >
                      {diff > 0 ? `+${formatINR(diff)}` : formatINR(diff)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
