import { useState, useMemo } from "react";
import type { POSCustomer, PaymentMethod, POSSplitItem } from "../types";
import { useShopConsole } from "../shopStore";
import { Money } from "@/components/shared/Money";
import { MemberSearch } from "@/features/desk/components/MemberSearch";
import type { DeskMember } from "@/features/desk/types";
import { QRCodeSVG } from "qrcode.react";
import {
  User,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";
import { toast } from "sonner";

interface POSCartProps {
  onChargeSuccess: () => void;
}

export function POSCart({ onChargeSuccess }: POSCartProps) {
  const { user } = useAuth();
  const {
    activeSession,
    posSessions,
    posTotals,
    posItemCount,
    switchPOSSession,
    setPOSCustomer,
    posUpdateQty,
    posRemoveItem,
    posClearCart,
    chargePOSCart,
  } = useShopConsole();

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [tenderedCash, setTenderedCash] = useState<string>("");
  const [upiRef, setUpiRef] = useState<string>("");
  const [cardRef, setCardRef] = useState<string>("");

  // Split payment state
  const [splitItems, setSplitItems] = useState<POSSplitItem[]>([
    { id: "sp-1", method: "CASH", amount: 0 },
    { id: "sp-2", method: "UPI", amount: 0 },
  ]);

  // Member search modal state
  const [isMemberSearchOpen, setIsMemberSearchOpen] = useState(false);

  // Cash calculation
  const totalAmount = posTotals.total;
  const cashGiven = parseFloat(tenderedCash) || 0;
  const changeDue = Math.max(0, cashGiven - totalAmount);

  // Split remaining calculation
  const splitTotal = useMemo(
    () => splitItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
    [splitItems]
  );
  const splitRemaining = totalAmount - splitTotal;

  // Handle member selected from MemberSearch
  const handleSelectMember = (member: DeskMember) => {
    setPOSCustomer({
      isWalkIn: false,
      memberId: member.id,
      name: member.name,
      phone: member.phone,
      email: member.email,
      tier: (member.tier as any) || "Gold",
    });
    setIsMemberSearchOpen(false);
    toast.success(`Member identified: ${member.name} (${member.tier} tier discount applied)`);
  };

  const handleSetWalkIn = () => {
    setPOSCustomer({
      isWalkIn: true,
      name: "Walk-in Customer",
      tier: "Guest",
    });
  };

  const handleCharge = () => {
    if (activeSession.items.length === 0) {
      toast.error("Cart is empty. Add items from the catalog.");
      return;
    }

    if (paymentMethod === "CASH" && cashGiven < totalAmount && cashGiven > 0) {
      toast.error(`Cash tendered is less than total (₹${totalAmount.toLocaleString("en-IN")})`);
      return;
    }

    if (paymentMethod === "SPLIT" && splitRemaining !== 0) {
      toast.error(`Split payment incomplete. ₹${Math.abs(splitRemaining).toLocaleString("en-IN")} ${splitRemaining > 0 ? "remaining" : "overpaid"}.`);
      return;
    }

    const staffName = user?.name || "Vikram Staff";

    chargePOSCart({
      paymentMethod,
      tenderedCash: paymentMethod === "CASH" ? cashGiven || totalAmount : undefined,
      splitDetails: paymentMethod === "SPLIT" ? splitItems : undefined,
      upiRef: paymentMethod === "UPI" ? upiRef || "UPI-MUMBAI-PROSHOP" : undefined,
      cardRef: paymentMethod === "CARD" ? cardRef || "HDFC-EDC-TXN" : undefined,
      staffName,
    });

    // Reset local inputs
    setTenderedCash("");
    setUpiRef("");
    setCardRef("");
    onChargeSuccess();
  };

  return (
    <div className="flex h-full flex-col justify-between rounded-[22px] border border-chalk/14 bg-court-600/95 p-4 sm:p-5 text-chalk shadow-xl backdrop-blur-md">
      {/* ─── Top: Parked Carts Tabs (Cart 1, Cart 2, Cart 3) ─── */}
      <div>
        <div className="mb-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-pill bg-navy-950/60 p-1 border border-chalk/10">
            {posSessions.map((session) => {
              const isActive = session.id === activeSession.id;
              const count = session.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <button
                  key={session.id}
                  onClick={() => switchPOSSession(session.id)}
                  className={cn(
                    "flex h-7 items-center gap-1.5 rounded-pill px-3 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-volt-400 text-ink-900 shadow-sm font-bold"
                      : "text-chalk/60 hover:text-chalk hover:bg-chalk/6"
                  )}
                >
                  <span>{session.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[9px] font-extrabold",
                        isActive ? "bg-ink-900 text-volt-400" : "bg-chalk/20 text-chalk"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeSession.items.length > 0 && (
            <button
              onClick={posClearCart}
              title="Void / Clear current cart"
              className="rounded-pill p-1.5 text-chalk/50 hover:bg-danger/20 hover:text-danger transition-colors text-xs flex items-center gap-1"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Void</span>
            </button>
          )}
        </div>

        {/* ─── Customer Header & Tier Discount Indicator ─── */}
        <div className="mb-4 rounded-[16px] border border-chalk/12 bg-court-700/60 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-pill bg-chalk/10 text-volt-300">
                <User className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-chalk truncate max-w-[150px]">
                  {activeSession.customer.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-chalk/60">
                    Tier:{" "}
                    <span className="font-semibold text-volt-300">
                      {activeSession.customer.tier}
                    </span>
                  </span>
                  {activeSession.customer.tier !== "Guest" && (
                    <span className="rounded-pill bg-volt-400/20 px-1.5 py-0.2 text-[9px] font-bold text-volt-300">
                      {posTotals.discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {!activeSession.customer.isWalkIn ? (
                <button
                  onClick={handleSetWalkIn}
                  className="rounded-pill border border-chalk/16 bg-chalk/8 px-2.5 py-1 text-[11px] font-medium text-chalk/70 hover:bg-chalk/14"
                >
                  Walk-in
                </button>
              ) : (
                <button
                  onClick={() => setIsMemberSearchOpen(true)}
                  className="flex items-center gap-1 rounded-pill border border-volt-400/40 bg-volt-400/10 px-2.5 py-1 text-[11px] font-bold text-volt-300 hover:bg-volt-400/20 transition-colors"
                >
                  <Search className="size-3" />
                  <span>Find Member</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Cart Items List ─── */}
        <div className="h-[220px] lg:h-[250px] overflow-y-auto space-y-2 pr-1 divide-y divide-chalk/6">
          {activeSession.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-chalk/40">
              <Layers className="size-8 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[11px] text-chalk/30 mt-0.5">Tap products on the left or scan SKU</p>
            </div>
          ) : (
            activeSession.items.map((item) => (
              <div key={item.variantId} className="pt-2 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-chalk truncate">{item.name}</p>
                  <p className="text-[10px] text-chalk/50 truncate">
                    {item.variantLabel} · ₹{item.unitPrice}
                  </p>
                </div>

                {/* Stepper + Total + Remove */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center rounded-pill border border-chalk/16 bg-chalk/6">
                    <button
                      onClick={() => posUpdateQty(item.variantId, item.quantity - 1)}
                      className="flex size-6 items-center justify-center text-chalk/70 hover:text-chalk"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-chalk">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => posUpdateQty(item.variantId, item.quantity + 1)}
                      className="flex size-6 items-center justify-center text-chalk/70 hover:text-chalk"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  <span className="w-14 text-right text-xs font-bold text-chalk">
                    <Money amount={item.unitPrice * item.quantity} />
                  </span>

                  <button
                    onClick={() => posRemoveItem(item.variantId)}
                    className="p-1 text-chalk/40 hover:text-danger transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Bottom: Totals Breakdown + Payment Selection + Charge CTA ─── */}
      <div className="mt-4 pt-3 border-t border-chalk/12 space-y-3">
        {/* Pricing Subtotal / Discount / GST / Total */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-chalk/70">
            <span>Subtotal</span>
            <span><Money amount={posTotals.subtotal} /></span>
          </div>

          {posTotals.discount > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="size-3" />
                <span>Member Discount ({posTotals.discountLabel})</span>
              </span>
              <span>−<Money amount={posTotals.discount} /></span>
            </div>
          )}

          <div className="flex justify-between text-chalk/60 text-[11px]">
            <span>GST (18% inclusive)</span>
            <span><Money amount={posTotals.tax} /></span>
          </div>

          <div className="flex justify-between text-base font-extrabold text-chalk pt-1 border-t border-chalk/10">
            <span>TOTAL</span>
            <span className="text-volt-400 text-lg font-black">
              <Money amount={posTotals.total} />
            </span>
          </div>
        </div>

        {/* Payment Method Selector Pills: [Cash | UPI | Card | Split] */}
        <div>
          <label className="text-[10px] font-bold text-chalk/60 uppercase tracking-wider block mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { key: "CASH", label: "Cash", icon: Banknote },
              { key: "UPI", label: "UPI", icon: QrCode },
              { key: "CARD", label: "Card", icon: CreditCard },
              { key: "SPLIT", label: "Split", icon: Layers },
            ].map((m) => {
              const Icon = m.icon;
              const isSel = paymentMethod === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key as PaymentMethod)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-[12px] border p-1.5 py-2 text-xs font-semibold transition-all",
                    isSel
                      ? "border-volt-400 bg-volt-400/20 text-volt-300 shadow-sm"
                      : "border-chalk/10 bg-chalk/6 text-chalk/70 hover:bg-chalk/10 hover:text-chalk"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="text-[11px]">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Payment Sheet Details */}
        {paymentMethod === "CASH" && (
          <div className="rounded-[14px] bg-court-700/60 p-2.5 border border-chalk/10 space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  label="Tendered Cash (₹)"
                  placeholder={`Exact ₹${totalAmount}`}
                  type="number"
                  value={tenderedCash}
                  onChange={(e) => setTenderedCash(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="w-28 text-right">
                <span className="text-[10px] text-chalk/60 block">Change Due</span>
                <span
                  className={cn(
                    "text-sm font-bold block",
                    changeDue > 0 ? "text-emerald-400" : "text-chalk/40"
                  )}
                >
                  <Money amount={changeDue} />
                </span>
              </div>
            </div>

            {/* Quick cash denomination chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
              {[500, 1000, 2000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setTenderedCash(val.toString())}
                  className="rounded-pill border border-chalk/14 bg-chalk/8 px-2 py-0.5 text-[10px] font-semibold text-chalk/80 hover:bg-chalk/16"
                >
                  ₹{val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setTenderedCash(totalAmount.toString())}
                className="rounded-pill border border-volt-400/30 bg-volt-400/10 px-2 py-0.5 text-[10px] font-bold text-volt-300 hover:bg-volt-400/20"
              >
                Exact
              </button>
            </div>
          </div>
        )}

        {paymentMethod === "UPI" && (
          <div className="flex items-center gap-3 rounded-[14px] bg-court-700/60 p-2.5 border border-chalk/10">
            <div className="size-16 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center">
              <QRCodeSVG
                value={`upi://pay?pa=championsclub@icici&pn=ChampionsClub&am=${totalAmount}&cu=INR`}
                size={58}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-volt-300">Scan Club Dynamic UPI</p>
              <p className="text-[10px] text-chalk/60">UPI ID: championsclub@icici</p>
              <Input
                placeholder="UPI Ref / UTR (optional)"
                value={upiRef}
                onChange={(e) => setUpiRef(e.target.value)}
                className="h-7 text-[10px] mt-1"
              />
            </div>
          </div>
        )}

        {paymentMethod === "CARD" && (
          <div className="rounded-[14px] bg-court-700/60 p-2.5 border border-chalk/10 space-y-1.5">
            <p className="text-[11px] text-chalk/80">Swipe or tap card on HDFC EDC terminal #3</p>
            <Input
              placeholder="Card Approval / RRN code (e.g. 489201)"
              value={cardRef}
              onChange={(e) => setCardRef(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        )}

        {paymentMethod === "SPLIT" && (
          <div className="rounded-[14px] bg-court-700/60 p-2.5 border border-chalk/10 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-chalk/70">Split Breakdown</span>
              <span
                className={cn(
                  "font-bold",
                  splitRemaining === 0
                    ? "text-emerald-400"
                    : splitRemaining > 0
                    ? "text-amber-400"
                    : "text-red-400"
                )}
              >
                {splitRemaining === 0 ? "Balanced ✓" : `₹${Math.abs(splitRemaining)} ${splitRemaining > 0 ? "left" : "over"}`}
              </span>
            </div>

            <div className="space-y-1.5">
              {splitItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2">
                  <span className="w-12 text-[11px] font-semibold text-chalk/80">{item.method}</span>
                  <input
                    type="number"
                    value={item.amount || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setSplitItems((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, amount: val } : p))
                      );
                    }}
                    placeholder="₹ Amount"
                    className="flex-1 h-7 rounded-lg border border-chalk/16 bg-chalk/8 px-2 text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── 64px Tall Volt [CHARGE ₹xxx] CTA ─── */}
        <button
          type="button"
          onClick={handleCharge}
          disabled={activeSession.items.length === 0}
          className={cn(
            "w-full h-16 rounded-pill bg-volt-400 text-ink-900 text-lg font-black tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-xl hover:bg-volt-500 hover:shadow-volt-400/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          )}
        >
          <span>CHARGE</span>
          <span>₹{totalAmount.toLocaleString("en-IN")}</span>
        </button>
      </div>

      {/* ─── Modal: Find Member (reuses MemberSearch) ─── */}
      <Modal
        isOpen={isMemberSearchOpen}
        onClose={() => setIsMemberSearchOpen(false)}
        title="Find Club Member for POS"
        subtitle="Search by name, phone (+91), or member ID to apply tier discounts automatically."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <MemberSearch
            onSelectMember={handleSelectMember}
            placeholder="Type name, phone, or CC-xxxxxx..."
            autoFocus
          />
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsMemberSearchOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
