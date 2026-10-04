import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Package,
  QrCode,
  ShieldCheck,
  Store,
  Truck,
  User,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { AppLink, useAppNavigate } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { Money, formatINR } from "@/components/shared/Money";
import { StatusPill } from "@/components/ui/StatusPill";
import { useShop, shopStore } from "../shopStore";
import { shopApi } from "@/services/api/shopApi";
import { useAuth } from "@/app/providers/AuthProvider";
import { useMember } from "@/features/member/memberStore";
import { useToast } from "@/components/ui/Toast";
import { SimulatedGatewayModal } from "../components/SimulatedGatewayModal";
import { formatCountdown } from "../useReservationTimer";
import { QRCodeSVG } from "qrcode.react";
import type { MemberTier, ConsoleOrder, PaymentMethod } from "../types";
import type { Order, OrderStatus } from "@/features/member/types";
import { cn } from "@/lib/cn";

type Step = 1 | 2 | 3 | 4;

export default function CheckoutPage() {
  const navigate = useAppNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { profile, addOrder } = useMember();
  const { cart, clearCart, getCartTotals } = useShop();

  const isMemberApp = typeof window !== "undefined" && window.location.pathname.startsWith("/app");
  const shopPath = isMemberApp ? "/app/shop" : "/shop";
  const cartPath = isMemberApp ? "/app/cart" : "/cart";

  const isMember = user?.primaryRole === "MEMBER";
  const tier: MemberTier = isMember ? (profile.tier as MemberTier) || "Gold" : "Guest";
  const totals = getCartTotals(tier);

  // Steps state
  const [step, setStep] = useState<Step>(1);

  // Customer details
  const [name, setName] = useState(isMember ? profile.name : "");
  const [phone, setPhone] = useState(isMember ? profile.phone : "");
  const [email, setEmail] = useState(isMember ? profile.email : "");

  // Fulfilment
  const [fulfilment, setFulfilment] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [addressLine1, setAddressLine1] = useState("Flat 402, Prestige Palms");
  const [addressLine2, setAddressLine2] = useState("Indiranagar 100ft Road");
  const [city, setCity] = useState("Bangalore");
  const [pincode, setPincode] = useState("560038");
  const [deliveryNote, setDeliveryNote] = useState("");

  // Delivery fee logic: ₹150 standard, free over ₹2500
  const deliveryFee = fulfilment === "DELIVERY" ? (totals.total > 2500 ? 0 : 150) : 0;
  const grandTotal = totals.total + deliveryFee;

  // Reservation countdown (lowest remaining)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600);

  useEffect(() => {
    if (cart.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      let minRem = 600;
      for (const item of cart) {
        const elapsed = Math.floor((now - item.reservedAt) / 1000);
        minRem = Math.min(minRem, Math.max(0, 600 - elapsed));
      }
      setSecondsRemaining(minRem);
    }, 1000);
    return () => clearInterval(interval);
  }, [cart]);

  // Payment Modal state
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  if (cart.length === 0 && !confirmedOrder) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-chalk">No items to checkout</h2>
        <p className="text-sm text-chalk/60">
          Your cart is currently empty. Please select equipment from the Pro Shop before checking out.
        </p>
        <AppLink to={shopPath}>
          <Button variant="primary">Visit Pro Shop</Button>
        </AppLink>
      </div>
    );
  }

  // Handle successful payment
  const handlePaymentSuccess = async (paymentMethod: string, transactionId: string) => {
    setIsGatewayOpen(false);

    let orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    let pickupCode = `CC-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = Date.now();

    // Call Spring Boot backend to record order and stock movement in PostgreSQL
    try {
      const validItems = cart.map((i) => ({
        productVariantId: i.variantId,
        quantity: i.quantity,
      }));

      const isMemberUuid =
        isMember &&
        profile.id &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id);

      const res = await shopApi.createOrder({
        memberId: isMemberUuid ? profile.id : undefined,
        guestName: isMember ? profile.name : (name || "Guest Customer"),
        guestPhone: isMember ? profile.phone : (phone || "+91 99999 00000"),
        fulfillmentMethod: fulfilment,
        deliveryAddress:
          fulfilment === "DELIVERY"
            ? `${addressLine1}, ${addressLine2}, ${city} - ${pincode}`
            : undefined,
        items: validItems,
      });

      if (res && res.id) {
        orderId = res.id;
        pickupCode = res.orderNumber;
      }
    } catch (err) {
      console.warn("Backend order creation warning (using local fallback):", err);
    }

    const newOrder: Order = {
      id: orderId,
      items: cart.map((i) => ({
        id: i.variantId,
        name: `${i.brand} ${i.name} (${i.variantLabel})`,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: Math.round(i.unitPrice * (totals.discountPercent / 100)),
        total: Math.round(i.unitPrice * i.quantity * (1 - totals.discountPercent / 100)),
        image: i.image,
      })),
      subtotal: totals.subtotal,
      discountTotal: totals.discount,
      tax: totals.tax,
      total: grandTotal,
      status: "PAID",
      orderType: fulfilment,
      date: new Date().toISOString().split("T")[0]!,
      createdAt: now,
      pickupCode,
      shippingAddress:
        fulfilment === "DELIVERY"
          ? `${addressLine1}, ${addressLine2}, ${city} - ${pincode}`
          : "Pro Shop Desk, Ground Floor Clubhouse",
      timeline: [
        { status: "PLACED", timestamp: now - 1000, note: "Order placed online and synchronized with database" },
        { status: "PAID", timestamp: now, note: `Paid via ${paymentMethod} (${transactionId})` },
      ],
    };

    // Save to memberStore if logged in
    if (isMember) {
      addOrder(newOrder);
    }

    // Also register in shopStore ConsoleOrders for staff visibility
    const consoleOrder: ConsoleOrder = {
      id: orderId,
      orderNumber: pickupCode,
      customerName: isMember ? profile.name : (name || "Guest Customer"),
      customerPhone: isMember ? profile.phone : (phone || "+91 99999 00000"),
      customerEmail: isMember ? profile.email : email,
      memberId: isMember ? profile.id : undefined,
      memberTier: tier,
      channel: "ONLINE",
      fulfillmentType: fulfilment,
      deliveryAddress:
        fulfilment === "DELIVERY"
          ? `${addressLine1}, ${addressLine2}, ${city} - ${pincode}`
          : undefined,
      slot: "Standard Online Pickup",
      items: [...cart],
      subtotal: totals.subtotal,
      discount: totals.discount,
      discountLabel: totals.discountLabel,
      tax: totals.tax,
      total: grandTotal,
      status: "PLACED",
      paymentMethod:
        paymentMethod === "UPI" || paymentMethod === "CARD" || paymentMethod === "CASH"
          ? (paymentMethod as PaymentMethod)
          : "UPI",
      paymentReference: transactionId,
      pickupCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        { status: "PLACED", timestamp: "Just now", note: "Order placed online" },
        { status: "PAID", timestamp: "Just now", note: `Paid via ${paymentMethod}` },
      ],
    };

    shopStore.addConsoleOrder(consoleOrder);
    setConfirmedOrder(newOrder);
    clearCart();
    toast.success("Order Confirmed!", `Order #${pickupCode} placed successfully.`);
  };

  // ─── Post-Payment Confirmation View ───
  if (confirmedOrder) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 space-y-8">
        {/* Success Header */}
        <div className="rounded-[28px] border border-volt-400/30 bg-gradient-to-b from-court-500 to-navy-900 p-8 text-center space-y-4 shadow-card">
          <div className="size-16 rounded-full bg-volt-400/20 text-volt-400 border border-volt-400/30 flex items-center justify-center mx-auto shadow-volt">
            <CheckCircle2 className="size-9" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-mono text-volt-400 font-bold uppercase tracking-wider">
              Payment Successful
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-chalk">
              Order Confirmed #{confirmedOrder.id}
            </h1>
            <p className="text-xs sm:text-sm text-chalk/70 max-w-md mx-auto">
              {confirmedOrder.orderType === "PICKUP"
                ? "Your gear is being prepped at the CCMS Pro Shop desk. Show your pickup QR when collecting."
                : `Your order has been routed to our sports courier. Delivery to ${confirmedOrder.shippingAddress}.`}
            </p>
          </div>

          <div className="inline-flex items-center gap-3 bg-navy-950/70 border border-chalk/14 px-4 py-2 rounded-2xl">
            <div className="text-left">
              <span className="text-[10px] text-chalk/50 uppercase font-mono">Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <StatusPill status={confirmedOrder.status} />
              </div>
            </div>
            <div className="w-px h-6 bg-chalk/10" />
            <div className="text-left">
              <span className="text-[10px] text-chalk/50 uppercase font-mono">Pickup Token</span>
              <div className="font-mono font-bold text-volt-400 text-sm">
                {confirmedOrder.pickupCode}
              </div>
            </div>
          </div>
        </div>

        {/* QR Code & Pickup Pass */}
        <div className="rounded-[24px] border border-chalk/14 bg-court-500/80 p-6 flex flex-col sm:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-volt-400">
              <QrCode className="size-5" />
              <h3 className="font-bold text-chalk text-base">Club Pickup Pass</h3>
            </div>
            <p className="text-xs text-chalk/70 max-w-xs">
              Present this pass at the Pro Shop front desk. Staff will scan to release your order and update collection status.
            </p>
            <div className="text-xs text-chalk/50 font-mono pt-1">
              Token ID: {confirmedOrder.pickupCode} · Total Paid: ₹{confirmedOrder.total.toLocaleString("en-IN")}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white shadow-md shrink-0">
            <QRCodeSVG
              value={`CCMS-ORDER:${confirmedOrder.id}:${confirmedOrder.pickupCode}`}
              size={120}
            />
          </div>
        </div>

        {/* Item Summary */}
        <div className="rounded-[24px] border border-chalk/14 bg-court-500/70 p-6 space-y-4">
          <h4 className="text-sm font-bold text-chalk uppercase tracking-wider border-b border-chalk/10 pb-3">
            Ordered Items ({confirmedOrder.items.length})
          </h4>
          <div className="space-y-3">
            {confirmedOrder.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-chalk">{item.name}</span>
                  <span className="text-chalk/50 font-mono ml-2">x{item.quantity}</span>
                </div>
                <span className="font-mono text-volt-400 font-bold">
                  {formatINR(item.total)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-chalk/10 flex justify-between items-center text-xs">
            <span className="font-bold text-chalk">Total Amount Paid</span>
            <span className="font-mono text-base font-bold text-volt-400">
              {formatINR(confirmedOrder.total)}
            </span>
          </div>
        </div>

        {/* Navigation CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {isMember ? (
            <AppLink to="/app/orders" className="flex-1">
              <Button variant="primary" className="w-full" leftIcon={<Package className="size-4" />}>
                View in My Orders
              </Button>
            </AppLink>
          ) : (
            <AppLink to={shopPath} className="flex-1">
              <Button variant="primary" className="w-full" leftIcon={<ShoppingBag className="size-4" />}>
                Continue Shopping
              </Button>
            </AppLink>
          )}

          <AppLink to={shopPath} className="flex-1">
            <Button variant="secondary" className="w-full">
              Back to Pro Shop
            </Button>
          </AppLink>
        </div>
      </div>
    );
  }

  // ─── Standard Multi-Step Checkout Flow ───
  return (
    <div className="max-w-5xl mx-auto pb-20 px-4 sm:px-6 space-y-8">
      {/* Header with Step Tracker */}
      <div className="border-b border-chalk/10 pb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <CreditCard className="size-6 text-volt-400" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
                Checkout
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-chalk/70 mt-1">
              Complete your Pro Shop order with verified member discounts and stock reservations.
            </p>
          </div>

          {/* Reservation Countdown Pill */}
          <div className="flex items-center gap-2 rounded-xl bg-volt-400/10 border border-volt-400/30 px-3 py-1.5 self-start sm:self-center">
            <Clock className="size-4 text-volt-400" />
            <span className="text-xs text-chalk/80">Stock held for:</span>
            <span className="font-mono font-bold text-volt-400 text-xs">
              {formatCountdown(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Stepper Indicator */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[
            { num: 1, label: "Details" },
            { num: 2, label: "Fulfilment" },
            { num: 3, label: "Review" },
            { num: 4, label: "Payment" },
          ].map((s) => (
            <div
              key={s.num}
              className={cn(
                "flex items-center gap-2 pb-2 border-b-2 transition-all",
                step >= s.num
                  ? "border-volt-400 text-volt-400"
                  : "border-chalk/10 text-chalk/40"
              )}
            >
              <div
                className={cn(
                  "size-6 rounded-full flex items-center justify-center text-xs font-bold",
                  step >= s.num ? "bg-volt-400 text-ink-900" : "bg-white/10 text-chalk/50"
                )}
              >
                {s.num}
              </div>
              <span className="text-xs font-semibold hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Form Steps (7 cols) + Sticky Summary (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Step Content */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="rounded-[24px] border border-chalk/14 bg-court-500/80 p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-chalk/10">
                <div className="flex items-center gap-2">
                  <User className="size-5 text-volt-400" />
                  <h3 className="font-bold text-chalk text-base">Customer Details</h3>
                </div>
                {isMember && (
                  <span className="rounded-pill bg-volt-400/20 text-volt-400 border border-volt-400/30 px-2.5 py-0.5 text-xs font-semibold">
                    {tier} Member
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-chalk/80">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk focus:outline-none focus:border-volt-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-chalk/80">Mobile Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk font-mono focus:outline-none focus:border-volt-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-chalk/80">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk focus:outline-none focus:border-volt-400"
                    />
                  </div>
                </div>

                {!isMember && (
                  <p className="text-[11px] text-chalk/50 pt-1">
                    Guest checkout enabled. Want member discounts?{" "}
                    <AppLink to="/login" className="text-volt-400 underline font-semibold">
                      Sign in here
                    </AppLink>
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  disabled={!name.trim() || !phone.trim() || !email.trim()}
                  onClick={() => setStep(2)}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Continue to Fulfilment
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Fulfilment */}
          {step === 2 && (
            <div className="rounded-[24px] border border-chalk/14 bg-court-500/80 p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-chalk/10">
                <Truck className="size-5 text-volt-400" />
                <h3 className="font-bold text-chalk text-base">Fulfilment Method</h3>
              </div>

              {/* Segmented Selector */}
              <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-white/5 border border-chalk/10">
                <button
                  type="button"
                  onClick={() => setFulfilment("PICKUP")}
                  className={cn(
                    "p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all",
                    fulfilment === "PICKUP"
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-chalk/70 hover:text-chalk hover:bg-white/5"
                  )}
                >
                  <Store className="size-4" />
                  <span>Pickup at Club (FREE)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfilment("DELIVERY")}
                  className={cn(
                    "p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all",
                    fulfilment === "DELIVERY"
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-chalk/70 hover:text-chalk hover:bg-white/5"
                  )}
                >
                  <Truck className="size-4" />
                  <span>Home Courier ({deliveryFee === 0 ? "FREE" : "₹150"})</span>
                </button>
              </div>

              {fulfilment === "PICKUP" ? (
                <div className="rounded-2xl bg-court-600/40 border border-chalk/10 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-volt-400 text-xs font-bold">
                    <Store className="size-4" />
                    <span>Club Pro Shop Pickup Desk</span>
                  </div>
                  <p className="text-xs text-chalk/70">
                    Champions Club Clubhouse, Ground Floor Pro Shop Counter.
                    Orders are packaged and ready within 2 hours during clubhouse operating hours (06:00 - 22:00 IST).
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-chalk/80">Street Address *</label>
                    <input
                      type="text"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="House / Flat / Building No."
                      className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk focus:outline-none focus:border-volt-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-chalk/80">Area / Locality</label>
                    <input
                      type="text"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      placeholder="Road / Landmark"
                      className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk focus:outline-none focus:border-volt-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-chalk/80">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk focus:outline-none focus:border-volt-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-chalk/80">Pincode *</label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-white/8 border border-chalk/18 text-sm text-chalk font-mono focus:outline-none focus:border-volt-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="size-4" />}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep(3)}
                  rightIcon={<ArrowRight className="size-4" />}
                >
                  Review Order
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <div className="rounded-[24px] border border-chalk/14 bg-court-500/80 p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-chalk/10">
                <ShieldCheck className="size-5 text-volt-400" />
                <h3 className="font-bold text-chalk text-base">Review Your Order</h3>
              </div>

              {/* Items summary */}
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex justify-between items-center p-3 rounded-xl bg-court-600/40 border border-chalk/8"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-chalk">{item.name}</h4>
                      <p className="text-[11px] text-chalk/50 font-mono">
                        {item.variantLabel} · Qty: {item.quantity}
                      </p>
                    </div>
                    <span className="font-mono text-volt-400 font-bold text-sm">
                      {formatINR(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fulfilment Review */}
              <div className="rounded-xl border border-chalk/10 bg-white/4 p-4 text-xs space-y-1">
                <span className="text-chalk/50 uppercase font-mono tracking-wider text-[10px]">
                  Delivering to:
                </span>
                <p className="text-chalk font-semibold">
                  {fulfilment === "PICKUP"
                    ? "Club Pro Shop Desk (Clubhouse Ground Floor)"
                    : `${addressLine1}, ${addressLine2}, ${city} - ${pincode}`}
                </p>
                <p className="text-chalk/60 font-mono">Recipient: {name} ({phone})</p>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <Button variant="ghost" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="size-4" />}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsGatewayOpen(true)}
                  className="shadow-volt"
                  rightIcon={<CreditCard className="size-4" />}
                >
                  Proceed to Payment ({formatINR(grandTotal)})
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Order Summary Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-[24px] border border-chalk/14 bg-court-500/90 p-6 space-y-5 sticky top-24 shadow-card">
            <h3 className="text-base font-bold text-chalk pb-3 border-b border-chalk/10">
              Payment Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center text-chalk/70">
                <span>Cart Subtotal</span>
                <span className="font-mono text-chalk font-medium">
                  {formatINR(totals.subtotal)}
                </span>
              </div>

              {totals.discount > 0 && (
                <div className="flex justify-between items-center text-volt-400 bg-volt-400/10 p-2.5 rounded-xl border border-volt-400/20">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="size-3.5" />
                    <span>{totals.discountLabel}</span>
                  </div>
                  <span className="font-mono font-bold">
                    - {formatINR(totals.discount)}
                  </span>
                </div>
              )}

              {/* Tax Breakup */}
              <div className="space-y-1.5 pt-2 border-t border-chalk/10">
                <div className="flex justify-between text-chalk/60 text-[11px]">
                  <span>GST (18% inclusive)</span>
                  <span className="font-mono">{formatINR(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-chalk/60 text-[11px]">
                  <span>Fulfilment Fee</span>
                  <span className="font-mono text-chalk font-semibold">
                    {deliveryFee === 0 ? "FREE" : formatINR(deliveryFee)}
                  </span>
                </div>
              </div>

              {/* Final Amount */}
              <div className="pt-3 border-t border-chalk/14 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-chalk">Total Payable</span>
                  <p className="text-[10px] text-chalk/40">Includes all GST & charges</p>
                </div>
                <div className="text-2xl font-extrabold text-volt-400 font-mono">
                  {formatINR(grandTotal)}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/4 border border-chalk/8 p-3 text-[11px] text-chalk/60 space-y-1">
              <div className="flex items-center gap-1 text-chalk/80 font-semibold">
                <ShieldCheck className="size-3.5 text-volt-400" />
                <span>CCMS Club Guarantee</span>
              </div>
              <p>
                Full warranty and authentic gear sourced directly from Wilson, Babolat, Yonex and Head distributors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Payment Gateway Modal */}
      <SimulatedGatewayModal
        isOpen={isGatewayOpen}
        onClose={() => setIsGatewayOpen(false)}
        amount={grandTotal}
        isPickup={fulfilment === "PICKUP"}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={(reason) => {
          setIsGatewayOpen(false);
          toast.error("Payment Not Completed", reason);
        }}
      />
    </div>
  );
}
