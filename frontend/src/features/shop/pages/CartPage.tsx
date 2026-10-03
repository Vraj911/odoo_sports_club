import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Package,
} from "lucide-react";
import { AppLink, useAppNavigate } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { Money, formatINR } from "@/components/shared/Money";
import { useShop } from "../shopStore";
import { useAuth } from "@/app/providers/AuthProvider";
import { useMember } from "@/features/member/memberStore";
import { useToast } from "@/components/ui/Toast";
import { formatCountdown } from "../useReservationTimer";
import type { MemberTier } from "../types";
import { CATEGORY_EMOJI } from "../types";
import { cn } from "@/lib/cn";

export default function CartPage() {
  const navigate = useAppNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { profile } = useMember();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
    pruneExpired,
  } = useShop();

  const isMemberApp = typeof window !== "undefined" && window.location.pathname.startsWith("/app");
  const shopPath = isMemberApp ? "/app/shop" : "/shop";
  const checkoutPath = isMemberApp ? "/app/checkout" : "/checkout";

  // Tier calculations
  const isMember = user?.primaryRole === "MEMBER";
  const tier: MemberTier = isMember ? (profile.tier as MemberTier) || "Gold" : "Guest";
  const totals = getCartTotals(tier);

  // Lowest remaining reservation time across cart items
  const [earliestRemainingSec, setEarliestRemainingSec] = useState<number>(600);

  useEffect(() => {
    if (cart.length === 0) return;

    const tick = () => {
      const now = Date.now();
      let minRemaining = 600;

      for (const item of cart) {
        const elapsed = Math.floor((now - item.reservedAt) / 1000);
        const rem = Math.max(0, 600 - elapsed);
        if (rem < minRemaining) minRemaining = rem;
      }

      setEarliestRemainingSec(minRemaining);

      if (minRemaining <= 0) {
        pruneExpired();
        toast.error(
          "Reservation Expired",
          "Items held in your cart for over 10 minutes were returned to stock."
        );
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [cart, pruneExpired, toast]);

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="size-20 rounded-full bg-court-600/60 border border-chalk/14 flex items-center justify-center mx-auto text-chalk/40">
          <ShoppingCart className="size-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-chalk">Your Cart is Empty</h2>
          <p className="text-sm text-chalk/60 max-w-sm mx-auto">
            You haven't added any racket sports gear, footwear, or accessories to your cart yet.
          </p>
        </div>
        <AppLink to={shopPath}>
          <Button variant="primary" leftIcon={<Package className="size-4" />}>
            Explore Pro Shop
          </Button>
        </AppLink>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-chalk/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <ShoppingCart className="size-6 text-volt-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              Shopping Cart
            </h1>
            <span className="rounded-pill bg-white/10 px-2.5 py-0.5 text-xs font-mono text-chalk font-semibold">
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Review selected equipment, verify member savings, and proceed to checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            clearCart();
            toast.info("Cart Cleared", "All reserved inventory has been released.");
          }}
          className="text-xs text-danger/80 hover:text-danger hover:underline self-start sm:self-center flex items-center gap-1.5"
        >
          <Trash2 className="size-3.5" />
          <span>Clear All Items</span>
        </button>
      </div>

      {/* Stock Reservation Banner */}
      <div className="rounded-2xl border border-volt-400/30 bg-volt-400/10 p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-volt-400 text-ink-900 flex items-center justify-center shrink-0 font-bold">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-chalk">
                Live Stock Reserved for You
              </span>
              <span className="font-mono text-xs font-bold text-volt-400 bg-navy-950 px-2 py-0.5 rounded-md border border-volt-400/40">
                {formatCountdown(earliestRemainingSec)}
              </span>
            </div>
            <p className="text-[11px] text-chalk/70 mt-0.5">
              Held exclusively for your session. Complete checkout before the countdown ends to guarantee availability.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Cart Items (8 cols) + Order Summary (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => {
            const savings = Math.max(0, item.mrp - item.unitPrice);

            return (
              <div
                key={item.variantId}
                className="rounded-[20px] border border-chalk/14 bg-court-500/80 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-chalk/24"
              >
                {/* Left: Thumbnail & details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="size-18 sm:size-20 rounded-2xl bg-navy-800 border border-chalk/10 flex items-center justify-center text-3xl shrink-0">
                    🏸
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-chalk/50 font-mono">
                      {item.brand}
                    </p>
                    <h3 className="text-sm sm:text-base font-semibold text-chalk truncate">
                      {item.name}
                    </h3>
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-white/6 px-2 py-0.5 text-xs text-chalk/70 font-mono">
                      <span>Variant:</span>
                      <strong className="text-chalk">{item.variantLabel}</strong>
                    </div>

                    <div className="flex items-center gap-2 pt-1 sm:hidden">
                      <span className="font-mono font-bold text-volt-400 text-sm">
                        {formatINR(item.unitPrice)}
                      </span>
                      {savings > 0 && (
                        <span className="text-xs text-chalk/40 line-through font-mono">
                          {formatINR(item.mrp)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quantity Stepper, Price & Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t border-chalk/10 sm:border-t-0">
                  {/* Quantity Stepper */}
                  <div className="flex items-center rounded-xl border border-chalk/18 bg-white/5 p-1 h-10">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="size-7 rounded-lg flex items-center justify-center text-chalk/80 hover:bg-white/10"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-chalk text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="size-7 rounded-lg flex items-center justify-center text-chalk/80 hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right hidden sm:block min-w-24">
                    <div className="text-base font-bold text-volt-400 font-mono">
                      {formatINR(item.unitPrice * item.quantity)}
                    </div>
                    <div className="text-[11px] text-chalk/40 font-mono">
                      {formatINR(item.unitPrice)} each
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => {
                      removeFromCart(item.variantId);
                      toast.info("Item Removed", `${item.name} removed and stock restored.`);
                    }}
                    className="p-2 rounded-xl text-chalk/40 hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <AppLink
              to={shopPath}
              className="inline-flex items-center gap-2 text-xs font-semibold text-volt-400 hover:underline"
            >
              <ArrowLeft className="size-3.5" />
              <span>Continue Shopping</span>
            </AppLink>
          </div>
        </div>

        {/* Right: Order Summary Card (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-[24px] border border-chalk/14 bg-court-500/90 p-6 space-y-5 sticky top-24 shadow-card">
            <h3 className="text-base font-bold text-chalk pb-3 border-b border-chalk/10">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              {/* Items Subtotal */}
              <div className="flex justify-between items-center text-chalk/70">
                <span>Items Subtotal</span>
                <span className="font-mono text-chalk font-medium">
                  {formatINR(totals.subtotal)}
                </span>
              </div>

              {/* Member Discount line */}
              {totals.discount > 0 ? (
                <div className="flex justify-between items-center text-volt-400 bg-volt-400/10 p-2.5 rounded-xl border border-volt-400/20">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="size-3.5" />
                    <span>{totals.discountLabel}</span>
                  </div>
                  <span className="font-mono font-bold">
                    - {formatINR(totals.discount)}
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-chalk/50 p-2.5 rounded-xl bg-white/4 border border-chalk/8 flex items-center justify-between">
                  <span>Guest rate applied</span>
                  <AppLink to="/login" className="text-volt-400 hover:underline font-semibold">
                    Sign in to save 15%
                  </AppLink>
                </div>
              )}

              {/* Tax Breakup (18% GST) */}
              <div className="space-y-1.5 pt-2 border-t border-chalk/10">
                <div className="flex justify-between text-chalk/60">
                  <span>Taxable Value</span>
                  <span className="font-mono">{formatINR(totals.afterDiscount)}</span>
                </div>
                <div className="flex justify-between text-chalk/60 text-[11px]">
                  <span>CGST (9%)</span>
                  <span className="font-mono">{formatINR(Math.round(totals.tax / 2))}</span>
                </div>
                <div className="flex justify-between text-chalk/60 text-[11px]">
                  <span>SGST (9%)</span>
                  <span className="font-mono">{formatINR(totals.tax - Math.round(totals.tax / 2))}</span>
                </div>
              </div>

              {/* Fulfilment estimate */}
              <div className="flex justify-between items-center text-chalk/70 pt-2 border-t border-chalk/10">
                <span className="flex items-center gap-1">
                  <span>Club Pickup</span>
                  <span className="text-[10px] text-volt-400 font-bold bg-volt-400/15 px-1.5 py-0.2 rounded">
                    PRO SHOP
                  </span>
                </span>
                <span className="font-mono text-success font-bold">FREE</span>
              </div>

              {/* Total Payable */}
              <div className="pt-3 border-t border-chalk/14 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-chalk">Total Payable</span>
                  <p className="text-[10px] text-chalk/40">Includes all GST & taxes</p>
                </div>
                <div className="text-2xl font-extrabold text-volt-400 font-mono">
                  {formatINR(totals.total)}
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(checkoutPath)}
              className="w-full shadow-volt"
              rightIcon={<ArrowRight className="size-4" />}
            >
              Proceed to Checkout
            </Button>

            <div className="text-[11px] text-chalk/50 flex items-center justify-center gap-1.5 text-center">
              <ShieldCheck className="size-3.5 text-volt-400" />
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
