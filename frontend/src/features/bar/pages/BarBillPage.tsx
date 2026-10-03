import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { BillPaymentLeg, BillSplitMode, BarReceipt } from "../types";
import { BarReceiptModal } from "../components/BarReceiptModal";
import {
  ArrowLeft,
  Receipt,
  QrCode,
  CreditCard,
  Banknote,
  Divide,
  CheckCircle2,
  Share2,
  Printer,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QRCodeSVG } from "qrcode.react";

export function BarBillPage() {
  const go = useGo();

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const orderIdMatch = pathname.match(/\/bar\/bill\/([^/]+)/);
  const orderId = orderIdMatch ? orderIdMatch[1] : "ORD-1081";

  const { orders, tables, settleBill } = useBarStore();
  const order = orders.find((o) => o.id === orderId) || orders[0];

  const tableName = order.tableId
    ? tables.find((t) => t.id === order.tableId)?.name
    : order.destination?.targetId || "Cover";

  // Split Mode State: WHOLE | BY_ITEM | EQUAL_GUESTS
  const [splitMode, setSplitMode] = useState<BillSplitMode>("WHOLE");
  const [guestCount, setGuestCount] = useState(2);
  const [activePaymentMethod, setActivePaymentMethod] = useState<"CASH" | "UPI" | "CARD" | "SPLIT">("CASH");

  // Cash Numpad state
  const [cashTendered, setCashTendered] = useState<number>(order ? order.total : 0);

  // UPI Reference state
  const [upiRef, setUpiRef] = useState("");

  // Card Reference state
  const [cardAuthCode, setCardAuthCode] = useState("");

  // Split Payment Legs state
  const [splitLegs, setSplitLegs] = useState<BillPaymentLeg[]>([
    { method: "CASH", amount: Math.floor((order?.total || 0) / 2) },
    { method: "UPI", amount: Math.ceil((order?.total || 0) / 2), reference: "UPI-SPLIT-01" },
  ]);

  // Receipt Modal State
  const [receipt, setReceipt] = useState<BarReceipt | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  if (!order) {
    return (
      <div className="min-h-screen bg-court-800 text-white p-6 flex flex-col items-center justify-center">
        <h2 className="text-lg font-bold mb-2">Order Not Found</h2>
        <Button onClick={() => go("/bar")}>Return to Floor</Button>
      </div>
    );
  }

  // Calculated Per-Guest Amount for Equal Split
  const perGuestAmount = Math.ceil(order.total / Math.max(1, guestCount));

  // Change Due for Cash
  const changeDue = Math.max(0, cashTendered - order.total);

  // Remaining Balance for Split mode
  const splitTotal = splitLegs.reduce((acc, leg) => acc + leg.amount, 0);
  const splitRemaining = order.total - splitTotal;

  const handleSettle = () => {
    let payments: BillPaymentLeg[] = [];

    if (activePaymentMethod === "CASH") {
      if (cashTendered < order.total) {
        alert("Tendered cash is less than total bill amount.");
        return;
      }
      payments = [{ method: "CASH", amount: order.total, tendered: cashTendered, change: changeDue }];
    } else if (activePaymentMethod === "UPI") {
      payments = [{ method: "UPI", amount: order.total, reference: upiRef || "UPI-PAY-OK" }];
    } else if (activePaymentMethod === "CARD") {
      payments = [{ method: "CARD", amount: order.total, reference: cardAuthCode || "CARD-AUTH-8821" }];
    } else if (activePaymentMethod === "SPLIT") {
      if (splitRemaining !== 0) {
        alert(`Split total does not match bill. Remaining balance: ₹${splitRemaining}`);
        return;
      }
      payments = splitLegs;
    }

    const res = settleBill(order.id, payments, splitMode);
    if (res.success && res.receipt) {
      setReceipt(res.receipt);
      setIsReceiptOpen(true);
    } else {
      alert(res.error || "Failed to settle bill.");
    }
  };

  return (
    <div className="min-h-screen bg-court-800 text-white flex flex-col">
      {/* Top Bar */}
      <div className="bg-court-700/80 border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => go("/bar")}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Floor View</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <h2 className="text-base font-bold font-heading text-white flex items-center gap-2">
            <span>Bill Presentation & Settlement</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-volt-400/20 text-volt-300 font-mono">
              {tableName} · #{order.orderNumber}
            </span>
          </h2>
        </div>
      </div>

      {/* Main Grid: Bill on Left (White Paper), Payment Controls on Right */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ─── LEFT: White Paper Bill Surface (5 cols) ─── */}
        <div className="md:col-span-5 flex flex-col justify-start">
          <div className="bg-white text-ink-950 p-6 rounded-2xl shadow-2xl border border-gray-200 font-sans text-xs space-y-3.5">
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-gray-300">
              <h3 className="font-heading font-black text-lg text-ink-950 tracking-wider uppercase">
                Champions Club
              </h3>
              <p className="text-[11px] text-gray-600 font-semibold">Bar & Clubhouse Dining</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Bill #{order.orderNumber} · Server: {order.waiterName}</p>
            </div>

            {/* Table & Member info */}
            <div className="flex justify-between items-center text-[11px] text-gray-700 py-1 bg-gray-50 px-2 rounded-lg">
              <div>
                <strong>Cover:</strong> {tableName}
              </div>
              <div>
                <strong>Time:</strong> {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {order.customer?.name && (
              <div className="flex justify-between items-center text-[11px] bg-volt-400/20 border border-volt-400/40 p-2 rounded-lg text-gray-900 font-medium">
                <div>
                  <span className="font-bold">{order.customer.name}</span>
                  {order.customer.tier && (
                    <span className="ml-1.5 px-1 py-0.2 rounded bg-volt-400 text-ink-950 font-bold text-[9px]">
                      {order.customer.tier}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-emerald-800 font-bold">
                  {order.customer.discountPercent}% Discount
                </span>
              </div>
            )}

            {/* Line items table */}
            <div className="border-t border-b border-dashed border-gray-300 py-2.5">
              <div className="flex justify-between font-bold text-[11px] text-gray-800 pb-1 mb-1 border-b border-gray-200">
                <span className="w-1/2">Item</span>
                <span className="w-10 text-center">Qty</span>
                <span className="w-14 text-right">Rate</span>
                <span className="w-16 text-right">Amount</span>
              </div>
              <div className="space-y-1.5">
                {order.items
                  .filter((i) => i.status !== "VOIDED")
                  .map((item) => (
                    <div key={item.lineId} className="flex justify-between text-[11px] text-gray-800">
                      <span className="w-1/2 font-medium truncate">{item.name}</span>
                      <span className="w-10 text-center font-mono">{item.quantity}</span>
                      <span className="w-14 text-right font-mono">₹{item.price}</span>
                      <span className="w-16 text-right font-bold font-mono">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Subtotal, Discount, Tax, Grand Total */}
            <div className="space-y-1 text-[11px] text-gray-700 pt-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{order.discountDescription || "Member Discount"}:</span>
                  <span className="font-mono">−₹{order.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>GST (F&B / Alcohol):</span>
                <span className="font-mono">₹{order.taxAmount.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center text-sm font-black text-ink-950 pt-2 border-t border-gray-300">
                <span>TOTAL DUE:</span>
                <span className="font-mono text-xl text-ink-950 font-black">
                  ₹{order.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Split Breakdown info if split active */}
            {splitMode === "EQUAL_GUESTS" && (
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] flex justify-between items-center">
                <span>Split Equal ({guestCount} guests):</span>
                <span className="font-bold font-mono text-sm">₹{perGuestAmount} / guest</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT: Settlement & Payment Panel (7 cols) ─── */}
        <div className="md:col-span-7 space-y-4">
          {/* Split Bill SegmentedControl */}
          <div className="bg-court-700/80 p-4 rounded-2xl border border-white/10 space-y-3">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
              Bill Splitting Option (BAR-08)
            </span>
            <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setSplitMode("WHOLE")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === "WHOLE"
                    ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Whole Bill
              </button>
              <button
                type="button"
                onClick={() => setSplitMode("BY_ITEM")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === "BY_ITEM"
                    ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                By Item
              </button>
              <button
                type="button"
                onClick={() => setSplitMode("EQUAL_GUESTS")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  splitMode === "EQUAL_GUESTS"
                    ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Equal (N Guests)
              </button>
            </div>

            {/* Guest count stepper when EQUAL_GUESTS */}
            {splitMode === "EQUAL_GUESTS" && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-court-600/60 border border-white/10 text-xs">
                <span className="text-white/80">Number of Guests:</span>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGuestCount(n)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                        guestCount === n
                          ? "bg-volt-400 text-ink-900"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="bg-court-700/80 p-4 rounded-2xl border border-white/10 space-y-4">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider block">
              Payment Method
            </span>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActivePaymentMethod("CASH")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === "CASH"
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePaymentMethod("UPI")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === "UPI"
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">UPI QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePaymentMethod("CARD")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === "CARD"
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Card</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePaymentMethod("SPLIT")}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  activePaymentMethod === "SPLIT"
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-md"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                }`}
              >
                <Divide className="w-5 h-5" />
                <span className="text-xs">Split Pay</span>
              </button>
            </div>

            {/* CASH: Numpad + Tendered + Change Due */}
            {activePaymentMethod === "CASH" && (
              <div className="space-y-3 p-3 bg-court-600/70 rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Bill Amount:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{order.total.toLocaleString("en-IN")}
                  </span>
                </div>

                <div>
                  <label className="text-xs text-white/70 mb-1 block">Tendered Cash (₹)</label>
                  <Input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    className="h-11 text-base font-mono font-bold text-volt-300"
                  />
                </div>

                {/* Quick denomination chips */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCashTendered(order.total)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                  >
                    Exact ₹{order.total}
                  </button>
                  {[500, 1000, 2000, 5000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashTendered(amt)}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Change Due Indicator */}
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-semibold">Change to Return:</span>
                  <span className="font-mono font-bold text-base text-emerald-400">
                    ₹{changeDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            {/* UPI: Dynamic QR Code + Reference Input */}
            {activePaymentMethod === "UPI" && (
              <div className="p-4 bg-court-600/70 rounded-xl border border-white/10 flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-white rounded-2xl shadow-lg">
                  <QRCodeSVG
                    value={`upi://pay?pa=championsbar@icici&pn=ChampionsClub&am=${order.total}&tr=ORD${order.orderNumber}`}
                    size={130}
                  />
                </div>
                <div className="text-center text-xs text-white/70">
                  <p className="font-semibold text-white">Scan with GPay, PhonePe, Paytm</p>
                  <p className="text-[11px] text-white/50">Amount: ₹{order.total.toLocaleString("en-IN")}</p>
                </div>
                <div className="w-full">
                  <label className="text-xs text-white/70 mb-1 block">UTR / Bank Reference (Optional)</label>
                  <Input
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    placeholder="e.g. 428190381029"
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* CARD: Auth / Terminal Code */}
            {activePaymentMethod === "CARD" && (
              <div className="space-y-3 p-3 bg-court-600/70 rounded-xl border border-white/10">
                <p className="text-xs text-white/70">
                  Swipe or tap card on POS EDC terminal. Enter authorization or transaction reference below:
                </p>
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Terminal Auth Reference</label>
                  <Input
                    value={cardAuthCode}
                    onChange={(e) => setCardAuthCode(e.target.value)}
                    placeholder="e.g. AUTH-994102"
                    className="h-10 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* SPLIT: Multi-Tender Table */}
            {activePaymentMethod === "SPLIT" && (
              <div className="space-y-3 p-3 bg-court-600/70 rounded-xl border border-white/10">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>Split Tender Legs:</span>
                  <span className={`font-mono font-bold ${splitRemaining === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    Remaining: ₹{splitRemaining}
                  </span>
                </div>

                <div className="space-y-2">
                  {splitLegs.map((leg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={leg.method}
                        onChange={(e) => {
                          const updated = [...splitLegs];
                          updated[idx].method = e.target.value as any;
                          setSplitLegs(updated);
                        }}
                        className="bg-white/10 border border-white/20 rounded-lg h-9 px-2 text-xs text-white"
                      >
                        <option value="CASH" className="bg-navy-900">Cash</option>
                        <option value="UPI" className="bg-navy-900">UPI</option>
                        <option value="CARD" className="bg-navy-900">Card</option>
                      </select>
                      <Input
                        type="number"
                        value={leg.amount}
                        onChange={(e) => {
                          const updated = [...splitLegs];
                          updated[idx].amount = Number(e.target.value);
                          setSplitLegs(updated);
                        }}
                        className="h-9 text-xs font-mono flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSplitLegs(splitLegs.filter((_, i) => i !== idx));
                        }}
                        className="text-white/40 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSplitLegs([
                      ...splitLegs,
                      { method: "CASH", amount: Math.max(0, splitRemaining) },
                    ]);
                  }}
                  className="w-full text-xs h-8 border-white/20"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  + Add Payment Row
                </Button>
              </div>
            )}

            {/* Settle Action Button */}
            <Button
              onClick={handleSettle}
              className="w-full bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold text-sm h-14 shadow-lg shadow-volt-400/20"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              SETTLE BILL & FREE TABLE (₹{order.total.toLocaleString("en-IN")})
            </Button>
          </div>
        </div>
      </div>

      {/* Bar Receipt Modal */}
      <BarReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          go("/bar");
        }}
        receipt={receipt}
      />
    </div>
  );
}
export default BarBillPage;
