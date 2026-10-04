import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { FloorHeader } from "../components/FloorHeader";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import {
  Lock,
  Unlock,
  AlertTriangle,
  Printer,
  Download,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  Users,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Wine,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function BarClosingPage() {
  const go = useGo();
  const { dailyClosing, tabs, closeDailyOperations, reopenDailyOperations } = useBarStore();

  const [isConfirmCloseModalOpen, setIsConfirmCloseModalOpen] = useState(false);
  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);

  const openTabs = tabs.filter((t) => t.status === "OPEN");

  // Chart data: Categories
  const categoryData = [
    { name: "Food", amount: dailyClosing.categoryBreakdown.food },
    { name: "Beverages", amount: dailyClosing.categoryBreakdown.beverages },
    { name: "Soft Drinks", amount: dailyClosing.categoryBreakdown.softDrinks },
    { name: "Snacks", amount: dailyClosing.categoryBreakdown.snacks },
  ];

  // Chart data: Payment Methods
  const paymentData = [
    { name: "UPI", value: dailyClosing.paymentBreakdown.upi, color: "#D5F63A" }, // volt
    { name: "Card", value: dailyClosing.paymentBreakdown.card, color: "#38BDF8" }, // cyan
    { name: "Cash", value: dailyClosing.paymentBreakdown.cash, color: "#34D399" }, // emerald
    { name: "Member Tabs", value: dailyClosing.paymentBreakdown.tabs, color: "#F59E0B" }, // amber
  ];

  const handleCloseDay = () => {
    closeDailyOperations();
    setIsConfirmCloseModalOpen(false);
  };

  const handleConfirmReopen = (reason: string, pin?: string) => {
    if (pin) {
      const res = reopenDailyOperations(pin, reason);
      if (res.success) {
        alert("Daily operations successfully reopened for edits.");
      } else {
        alert(res.error || "Failed to reopen day.");
      }
    }
    setIsAdminPinOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-court-800 text-white flex flex-col">
      <FloorHeader />

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Locked Day Banner if Closed */}
        {dailyClosing.isClosed && (
          <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 shadow-xl flex flex-wrap items-center justify-between gap-3 text-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-ink-950 font-bold flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base text-white tracking-wide uppercase">
                  Daily Operations Closed & Locked (Z-Report Finalized)
                </h3>
                <p className="text-xs text-amber-200/80">
                  Closed at {dailyClosing.closedAt} by {dailyClosing.closedBy}. All POS order edits and bill modifications are locked.
                </p>
              </div>
            </div>

            <Button
              onClick={() => setIsAdminPinOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-ink-900 font-bold text-xs h-9 flex items-center gap-1.5 shadow-md"
            >
              <Unlock className="w-3.5 h-3.5" />
              Reopen Day (Admin PIN)
            </Button>
          </div>
        )}

        {/* Top Header with Export Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Z-Report Date: {new Date(dailyClosing.date).toLocaleDateString("en-IN", { dateStyle: "full" })}</span>
              <span className="px-2 py-0.2 rounded bg-volt-400/20 text-volt-300 font-semibold text-[10px]">
                AUTHORIZED
              </span>
            </div>
            <h1 className="text-2xl font-heading font-black text-white">Daily Financial Closing</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-white/20 text-xs text-white hover:text-white"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Z-Report
            </Button>

            {!dailyClosing.isClosed && (
              <Button
                size="sm"
                onClick={() => setIsConfirmCloseModalOpen(true)}
                className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-xs h-9"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Close Day (Lock Register)
              </Button>
            )}
          </div>
        </div>

        {/* Hero KPI: What the bar earned today */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-court-700 to-court-600 border border-white/15 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-1">
                What the bar earned today
              </span>
              <div className="text-4xl md:text-5xl font-heading font-black text-volt-300 font-mono tracking-tight">
                ₹{dailyClosing.netRevenue.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-white/60 mt-1">
                Net earnings after discounts & GST reconciliation across all covers.
              </p>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-white/50 block">Gross Sales</span>
                <span className="font-mono text-base font-bold text-white">
                  ₹{dailyClosing.grossSales.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-white/50 block">Member Discounts</span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  −₹{dailyClosing.memberDiscounts.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-white/50 block">Taxes (GST)</span>
                <span className="font-mono text-base font-bold text-white">
                  ₹{dailyClosing.taxesCollected.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-center">
                <span className="text-[11px] text-white/50 block">Total Covers</span>
                <span className="font-mono text-base font-bold text-volt-300">
                  {dailyClosing.totalCovers} guests
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Warning if open tabs exist */}
        {openTabs.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>{openTabs.length} active member tabs</strong> must be settled or moved to
                monthly member ledger accounts before daily closing can be finalized.
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => go("/bar/tabs")}
              className="bg-amber-400 text-ink-900 font-bold text-xs h-8"
            >
              Resolve Tabs →
            </Button>
          </div>
        )}

        {/* 2-Columns: Charts (Category breakdown & Payment Donut) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Revenue by Category */}
          <div className="bg-court-700/80 p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-bold text-white text-sm">Revenue by Menu Category</h3>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(val: any) => [`₹${val.toLocaleString("en-IN")}`, "Sales"]}
                  />
                  <Bar dataKey="amount" fill="#D5F63A" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Payment Methods Donut */}
          <div className="bg-court-700/80 p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="font-bold text-white text-sm">Payment Collections Breakdown</h3>
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "rgba(255,255,255,0.1)", borderRadius: "12px" }}
                    formatter={(val: any) => [`₹${val.toLocaleString("en-IN")}`, "Amount"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
              {paymentData.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-white/70">{p.name}:</span>
                  <span className="font-mono font-bold text-white">₹{p.value.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Performance Table */}
        <div className="bg-court-700/80 p-5 rounded-2xl border border-white/10 space-y-3">
          <h3 className="font-bold text-white text-sm">Staff Shift Attributions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-court-800 text-white/60 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Staff Member</th>
                  <th className="py-2.5 px-3">Orders Handled</th>
                  <th className="py-2.5 px-3">Total Sales</th>
                  <th className="py-2.5 px-3">Avg Ticket Time</th>
                  <th className="py-2.5 px-3 text-right">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dailyClosing.staffSales.map((s) => (
                  <tr key={s.staffName} className="hover:bg-white/5">
                    <td className="py-2.5 px-3 font-semibold text-white">{s.staffName}</td>
                    <td className="py-2.5 px-3 font-mono">{s.ordersCount} tickets</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-volt-300">
                      ₹{s.totalSales.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{s.avgPrepTimeMinutes} mins</td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 font-semibold">
                        Reconciled ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Close Day */}
      <Modal
        isOpen={isConfirmCloseModalOpen}
        onClose={() => setIsConfirmCloseModalOpen(false)}
        title="Confirm Daily Financial Closing"
      >
        <div className="space-y-4">
          <p className="text-xs text-white/80">
            Are you sure you want to finalize today's bar operations and generate the Z-Report?
          </p>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Net Sales to Lock:</span>
              <strong className="text-volt-300 font-mono">₹{dailyClosing.netRevenue.toLocaleString("en-IN")}</strong>
            </div>
            <div className="flex justify-between">
              <span>Open Tabs:</span>
              <span>{openTabs.length} active</span>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsConfirmCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCloseDay}
              className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold"
            >
              Confirm & Lock Day
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin PIN Dialog to Reopen Day */}
      <AdminPinDialog
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onConfirm={handleConfirmReopen}
        title="Admin Override: Reopen Daily Operations"
        description="Reopening a locked financial day requires administrator PIN authorization and a mandatory audit reason."
      />
    </div>
  );
}
export default BarClosingPage;
