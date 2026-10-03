import { useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { KPICard } from "@/components/ui/KPICard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { useGo } from "@/app/router/links";
import { useFinanceStore, formatCurrency } from "../financeStore";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { formatINR } from "@/components/shared/Money";
import {
  Landmark,
  Receipt,
  HandCoins,
  Wallet,
  Briefcase,
  FileText,
  Percent,
  TrendingUp,
  Scale,
  CalendarRange,
  ArrowRight,
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const SOURCE_COLORS: Record<string, string> = {
  COURT: "#38bdf8",
  MEMBERSHIP: "#d5f63a",
  SHOP: "#34d399",
  BAR: "#fbbf24",
  OTHER: "#c084fc",
};

export default function FinanceOverviewPage() {
  const go = useGo();
  const {
    payments,
    invoices,
    expenses,
    vendorBills,
    activePeriod,
    totalRevenueMTD,
    totalOutstandingReceivables,
    totalOutstandingPayables,
    totalExpensesMTD,
  } = useFinanceStore();

  // Revenue breakdown by source
  const revenueBySource = useMemo(() => {
    const map: Record<string, number> = {
      COURT: 0,
      MEMBERSHIP: 0,
      SHOP: 0,
      BAR: 0,
      OTHER: 0,
    };
    payments
      .filter((p) => p.status === "COMPLETED")
      .forEach((p) => {
        map[p.source] = (map[p.source] || 0) + p.amount;
      });

    return Object.entries(map).map(([source, amount]) => ({
      name: source,
      amount,
      color: SOURCE_COLORS[source] || "#94a3b8",
    }));
  }, [payments]);

  // Overdue Invoices
  const overdueInvoices = useMemo(() => {
    return invoices.filter((i) => i.status === "OVERDUE");
  }, [invoices]);

  const netOperatingMargin = totalRevenueMTD - totalExpensesMTD;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Overview"
        subtitle="CCMS general ledger, multi-channel payment reconciliation, tax invoices, and accounting compliance."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/finance/payments")}
              className="gap-1.5"
            >
              <HandCoins className="size-3.5" /> Payments Ledger
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => go("/finance/invoices")}
              className="gap-1.5"
            >
              <Receipt className="size-3.5" /> Invoices
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Top Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Revenue (MTD)"
          value={formatCurrency(totalRevenueMTD)}
          delta={{ value: "+14.8%", isPositive: true }}
          sparklineData={[{ v: 120000 }, { v: 145000 }, { v: 180000 }, { v: 210000 }, { v: 255000 }, { v: totalRevenueMTD }]}
        />
        <KPICard
          label="Outstanding Receivables"
          value={formatCurrency(totalOutstandingReceivables)}
          delta={{
            value: `${overdueInvoices.length} Overdue`,
            isPositive: overdueInvoices.length === 0,
          }}
          sparklineData={[{ v: 90000 }, { v: 110000 }, { v: 105000 }, { v: 115000 }, { v: totalOutstandingReceivables }]}
        />
        <KPICard
          label="What Club Owes (Payables)"
          value={formatCurrency(totalOutstandingPayables)}
          delta={{ value: "Due Bills", isPositive: false }}
          sparklineData={[{ v: 60000 }, { v: 75000 }, { v: 80000 }, { v: 95000 }, { v: totalOutstandingPayables }]}
        />
        <KPICard
          label="Net Operating Cashflow"
          value={formatCurrency(netOperatingMargin)}
          delta={{ value: "48% Margin", isPositive: true }}
          sparklineData={[{ v: 70000 }, { v: 85000 }, { v: 95000 }, { v: 110000 }, { v: netOperatingMargin }]}
        />
      </div>

      {/* Overdue Attention Banner if any */}
      {overdueInvoices.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-rose-200">
                Action Required: {overdueInvoices.length} Overdue Receivables Alert
              </p>
              <p className="text-xs text-rose-200/70 mt-0.5">
                Totaling {formatCurrency(overdueInvoices.reduce((s, i) => s + i.balanceDue, 0))} past due date. Follow up with corporate accounts or send automated reminder slips.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => go("/finance/invoices")}
            className="gap-1.5 shrink-0 self-start sm:self-center"
          >
            Review Overdue Invoices <ArrowRight className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Revenue Charts & Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Donut Chart */}
        <Card className="p-6 lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-chalk">Revenue by Source</h3>
            <span className="text-xs text-chalk/60 font-mono">Oct 2026</span>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBySource}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {revenueBySource.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    const first = payload?.[0];
                    if (active && first?.payload) {
                      const data = first.payload;
                      return (
                        <div className="rounded-lg border border-chalk/14 bg-court-700 p-2.5 text-xs text-chalk shadow-lg">
                          <p className="font-bold text-volt-400">{data.name}</p>
                          <p className="font-mono">{formatCurrency(data.amount)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-chalk/10 pt-3">
            {revenueBySource.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-chalk/80">{item.name}</span>
                </div>
                <span className="font-mono font-medium text-chalk">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Access Matrix */}
        <Card className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-chalk">Finance Modules & Registers</h3>
            <span className="text-xs text-chalk/60">Phase 9 Full Feature Set</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                title: "Payments Ledger",
                desc: "Integrated multi-source receipts",
                path: "/finance/payments",
                icon: HandCoins,
                badge: `${payments.length} Records`,
              },
              {
                title: "Tax Invoices",
                desc: "Gap-free sequential billing",
                path: "/finance/invoices",
                icon: Receipt,
                badge: `${invoices.length} Invoices`,
              },
              {
                title: "Business Clients",
                desc: "Corporate billing & contracts",
                path: "/finance/business-clients",
                icon: Briefcase,
                badge: "3 Active",
              },
              {
                title: "Operating Expenses",
                desc: "Categorized expense disbursements",
                path: "/finance/expenses",
                icon: Wallet,
                badge: `${expenses.length} Records`,
              },
              {
                title: "Vendor Bills",
                desc: "Accounts payable & dues",
                path: "/finance/vendor-bills",
                icon: FileText,
                badge: `${vendorBills.length} Bills`,
              },
              {
                title: "Vendors Directory",
                desc: "Supplier & contractor master",
                path: "/finance/vendors",
                icon: Building,
                badge: "4 Vendors",
              },
              {
                title: "GST Reporting",
                desc: "GSTR-1, GSTR-3B & Tax Registers",
                path: "/finance/gst",
                icon: Percent,
                badge: "Sales & Purchases",
              },
              {
                title: "Profit & Loss",
                desc: "Waterfall income statement",
                path: "/finance/pnl",
                icon: TrendingUp,
                badge: "Comparative",
              },
              {
                title: "Daily Reconciliation",
                desc: "Cash drawer & Gateway settlements",
                path: "/finance/reconciliation",
                icon: Scale,
                badge: "Balanced",
              },
              {
                title: "Financial Periods",
                desc: "Period locking & audit controls",
                path: "/finance/periods",
                icon: CalendarRange,
                badge: activePeriod?.name || "Active",
              },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.path}
                  onClick={() => go(mod.path)}
                  className="group flex flex-col justify-between rounded-xl border border-chalk/10 bg-court-600/50 p-4 transition-all hover:-translate-y-0.5 hover:border-volt-400/40 hover:bg-court-600 hover:shadow-card cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-court-700 text-volt-400 group-hover:bg-volt-400 group-hover:text-ink-900 transition-colors">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-mono text-chalk/50 group-hover:text-volt-400 transition-colors">
                      {mod.badge}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-chalk group-hover:text-volt-400 transition-colors">
                      {mod.title}
                    </p>
                    <p className="text-[11px] text-chalk/60 truncate mt-0.5">{mod.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Ledger Transactions Feed */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-chalk">Recent Payment Receipts</h3>
            <p className="text-xs text-chalk/60">Live ledger stream from courts, pro shop, and bar</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => go("/finance/payments")} className="gap-1.5">
            Full Ledger <ArrowRight className="size-3.5" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-court-700/60 text-chalk/70 font-semibold uppercase text-[10px] tracking-wider border-b border-chalk/10">
              <tr>
                <th className="py-2.5 px-3">Receipt / Ref</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-2">Source</th>
                <th className="py-2.5 px-2">Method</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Received By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8 text-chalk/90">
              {payments.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-chalk/5 transition-colors">
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-volt-400">{p.id}</span>
                    <p className="text-[11px] font-mono text-chalk/50">{p.ref}</p>
                  </td>
                  <td className="py-3 px-3 font-medium text-chalk">{p.customerName}</td>
                  <td className="py-3 px-2">
                    <span className="rounded bg-chalk/10 px-2 py-0.5 text-[10px] font-semibold text-chalk/80">
                      {p.source}
                    </span>
                  </td>
                  <td className="py-3 px-2 font-mono text-chalk/80">{p.method}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-chalk">
                    {formatINR(p.amount)}
                  </td>
                  <td className="py-3 px-3">
                    <StatusPill
                      tone={
                        p.status === "COMPLETED"
                          ? "success"
                          : p.status === "FAILED"
                          ? "danger"
                          : p.status === "FAILED_RETRIED"
                          ? "info"
                          : "warning"
                      }
                    >
                      {p.status === "FAILED_RETRIED" ? "Failed → Retried" : p.status}
                    </StatusPill>
                  </td>
                  <td className="py-3 px-3 text-chalk/60 truncate max-w-[140px]">{p.receivedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
