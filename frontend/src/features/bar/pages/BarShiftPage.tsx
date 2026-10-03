import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { FloorHeader } from "../components/FloorHeader";
import {
  Clock,
  Banknote,
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export function BarShiftPage() {
  const go = useGo();
  const { activeShift, clockInOutShift, recordCashMovement, closeShift, dailyClosing } = useBarStore();

  const [staffPin, setStaffPin] = useState("");
  const [countedCash, setCountedCash] = useState<number>(activeShift.openingFloat || 5000);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);

  // Cash movement form state
  const [movementType, setMovementType] = useState<"CASH_IN" | "CASH_OUT">("CASH_OUT");
  const [movementAmount, setMovementAmount] = useState<number>(500);
  const [movementReason, setMovementReason] = useState("");

  const handleClockToggle = () => {
    const res = clockInOutShift(staffPin || "1234");
    alert(res.message);
  };

  const handleAddMovement = () => {
    if (!movementReason.trim()) {
      alert("Please provide a reason for the cash movement.");
      return;
    }
    recordCashMovement(movementType, movementAmount, movementReason.trim());
    setIsCashMovementModalOpen(false);
    setMovementReason("");
  };

  const netMovements = activeShift.cashMovements.reduce(
    (acc, m) => (m.type === "CASH_IN" ? acc + m.amount : acc - m.amount),
    0
  );

  const expectedCashInDrawer = netMovements;
  const variance = countedCash - expectedCashInDrawer;

  const handleCloseShift = () => {
    const res = closeShift(countedCash);
    if (res.variance === 0) {
      alert("Shift successfully closed! Drawer balanced with ₹0 variance.");
    } else {
      alert(`Shift closed with cash variance of ₹${res.variance}. Shift report submitted to management.`);
    }
  };

  return (
    <div className="min-h-screen bg-court-800 text-white flex flex-col">
      <FloorHeader />

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <h1 className="text-xl font-heading font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-volt-400" />
              <span>Shift Operations & Cash Drawer</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  activeShift.isOpen
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {activeShift.isOpen ? "Shift Active" : "Shift Closed"}
              </span>
            </h1>
            <p className="text-xs text-white/50">
              Shift tracking, register float reconciliations, and cash movement audit logs.
            </p>
          </div>
        </div>

        {/* 2-Columns: Left Clock In/Out & Shift Summary, Right Cash Drawer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* ─── LEFT: Shift Identity & Performance (5 cols) ─── */}
          <div className="md:col-span-5 space-y-4">
            {/* Active Staff Card */}
            <div className="bg-court-700/80 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/70 font-semibold uppercase tracking-wider">
                  Attributed Server
                </span>
                <span className="text-xs font-mono text-volt-300">ID: {activeShift.staffId}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-volt-400 text-ink-900 font-black text-base flex items-center justify-center">
                  AM
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">{activeShift.staffName}</h3>
                  <p className="text-xs text-white/50">
                    Clocked in at <strong className="text-white">{activeShift.clockInTime}</strong>
                  </p>
                </div>
              </div>

              {/* Clock In / Out Action */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                <Input
                  type="password"
                  value={staffPin}
                  onChange={(e) => setStaffPin(e.target.value)}
                  placeholder="Staff PIN"
                  className="w-28 h-9 text-xs font-mono"
                />
                <Button
                  size="sm"
                  onClick={handleClockToggle}
                  className={`flex-1 text-xs font-bold h-9 ${
                    activeShift.isOpen
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40"
                      : "bg-volt-400 hover:bg-volt-500 text-ink-900"
                  }`}
                >
                  {activeShift.isOpen ? "Clock Out Staff" : "Clock In Shift"}
                </Button>
              </div>

              <div className="pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => go("/my/clock")}
                  className="w-full text-xs text-volt-400 border-volt-400/30 hover:bg-volt-400/10"
                >
                  Open Time Clock & Biometric Terminal
                </Button>
              </div>
            </div>

            {/* Shift Sales Summary Card */}
            <div className="bg-court-700/80 p-5 rounded-2xl border border-white/10 space-y-3">
              <span className="text-xs text-white/70 font-semibold uppercase tracking-wider block">
                Current Shift Sales
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-court-800/70 rounded-xl border border-white/5">
                  <span className="text-[11px] text-white/50 block">Orders Handled</span>
                  <span className="font-mono text-lg font-bold text-white">26 covers</span>
                </div>
                <div className="p-3 bg-court-800/70 rounded-xl border border-white/5">
                  <span className="text-[11px] text-white/50 block">Shift Net Sales</span>
                  <span className="font-mono text-lg font-bold text-volt-300">₹34,200</span>
                </div>
              </div>

              <div className="pt-2 text-xs space-y-1.5 text-white/70">
                <div className="flex justify-between">
                  <span>UPI Collections:</span>
                  <span className="font-mono font-semibold text-white">₹18,400</span>
                </div>
                <div className="flex justify-between">
                  <span>Card EDC:</span>
                  <span className="font-mono font-semibold text-white">₹10,800</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Payments:</span>
                  <span className="font-mono font-semibold text-white">₹5,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Cash Drawer & Variance (7 cols) ─── */}
          <div className="md:col-span-7 space-y-4">
            <div className="bg-court-700/80 p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-volt-400" />
                  <h3 className="font-bold text-white text-base">Cash Drawer Float & Audits</h3>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCashMovementModalOpen(true)}
                  className="h-8 text-xs border-volt-400/30 text-volt-300 hover:bg-volt-400/10"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  + Cash In / Cash Out
                </Button>
              </div>

              {/* Live Drawer Reconciliation Strip */}
              <div className="p-4 bg-court-800 rounded-xl border border-white/10 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-white/50 block">Opening Float</span>
                  <span className="font-mono text-base font-bold text-white">
                    ₹{activeShift.openingFloat.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="border-x border-white/10">
                  <span className="text-[11px] text-white/50 block">System Expected Cash</span>
                  <span className="font-mono text-base font-bold text-volt-300">
                    ₹{expectedCashInDrawer.toLocaleString("en-IN")}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-white/50 block">Cash Variance</span>
                  <span
                    className={`font-mono text-base font-bold ${
                      variance === 0
                        ? "text-emerald-400"
                        : variance > 0
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {variance === 0 ? "Balanced ✓" : `₹${variance}`}
                  </span>
                </div>
              </div>

              {/* Counted Cash Input & Close Shift Action */}
              <div className="p-4 bg-court-600/60 rounded-xl border border-white/10 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/80 mb-1 block">
                    Actual Physical Counted Cash in Till (₹)
                  </label>
                  <Input
                    type="number"
                    value={countedCash}
                    onChange={(e) => setCountedCash(Number(e.target.value))}
                    className="h-11 text-base font-mono font-bold text-volt-300"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-white/60">Audit note:</span>
                  <span className="text-white/80">Discrepancies automatically logged to owner audit.</span>
                </div>

                <Button
                  onClick={handleCloseShift}
                  className="w-full bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-11 text-xs"
                >
                  <Lock className="w-4 h-4 mr-1.5" />
                  Reconcile & Close Shift
                </Button>
              </div>

              {/* Movement History Table */}
              <div>
                <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block mb-2">
                  Shift Cash Movement Ledger
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeShift.cashMovements.map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-court-800/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {m.type === "CASH_IN" ? (
                          <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <div>
                          <div className="font-semibold text-white">{m.reason}</div>
                          <div className="text-[10px] text-white/40">{m.timestamp}</div>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-bold ${
                          m.type === "CASH_IN" ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {m.type === "CASH_IN" ? "+" : "-"}₹{m.amount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Cash Movement (In / Out) */}
      <Modal
        isOpen={isCashMovementModalOpen}
        onClose={() => setIsCashMovementModalOpen(false)}
        title="Record Cash Movement"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setMovementType("CASH_OUT")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                movementType === "CASH_OUT"
                  ? "bg-amber-400 text-ink-900 font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Cash Out (Paid Out)
            </button>
            <button
              type="button"
              onClick={() => setMovementType("CASH_IN")}
              className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                movementType === "CASH_IN"
                  ? "bg-emerald-400 text-ink-900 font-bold"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Cash In (Float Top-up)
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/80 mb-1 block">Amount (₹)</label>
            <Input
              type="number"
              value={movementAmount}
              onChange={(e) => setMovementAmount(Number(e.target.value))}
              className="h-10 text-xs font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-white/80 mb-1 block">
              Mandatory Audit Reason
            </label>
            <Input
              value={movementReason}
              onChange={(e) => setMovementReason(e.target.value)}
              placeholder="e.g. Vendor payout for fresh bar ice, lemon box..."
              className="h-10 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button variant="ghost" size="sm" onClick={() => setIsCashMovementModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddMovement}
              className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold"
            >
              Record Movement
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default BarShiftPage;
