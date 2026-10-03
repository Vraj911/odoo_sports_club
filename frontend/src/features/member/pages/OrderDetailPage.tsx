import { useState } from "react";
import {
  ArrowLeft,
  Package,
  QrCode,
  RotateCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Store,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Money } from "@/components/shared/Money";
import { useMember } from "@/features/member/memberStore";
import { useToast } from "@/components/ui/Toast";
import { QRCodeSVG } from "qrcode.react";
import type { OrderStatus } from "@/features/member/types";
import { cn } from "@/lib/cn";

const ORDER_STEPS: { key: OrderStatus; label: string; desc: string }[] = [
  { key: "PLACED", label: "Order Placed", desc: "Order details received online" },
  { key: "PAID", label: "Payment Confirmed", desc: "GST invoice issued" },
  { key: "PACKED", label: "Packed at Shop", desc: "Items boxed & labeled" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup", desc: "Waiting at Pro Shop counter" },
  { key: "COLLECTED", label: "Collected", desc: "Handed over to member" },
];

export default function OrderDetailPage({ params }: { params?: Record<string, string> | undefined }) {
  const { orders, profile } = useMember();
  const toast = useToast();

  const orderId =
    params?.["id"] ??
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop() ?? ""
      : "");

  const order = orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());

  if (!order) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-chalk">Order #{orderId} Not Found</h2>
        <AppLink to="/app/orders">
          <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />}>
            Back to Orders
          </Button>
        </AppLink>
      </div>
    );
  }

  const handleReorder = () => {
    toast.success("Items Added to Cart", `Reordered ${order.items.length} items from #${order.id}.`);
  };

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case "PLACED":
        return 0;
      case "PAID":
        return 1;
      case "PACKED":
        return 2;
      case "READY_FOR_PICKUP":
      case "OUT_FOR_DELIVERY":
        return 3;
      case "COLLECTED":
      case "DELIVERED":
        return 4;
      default:
        return 2;
    }
  };

  const currentIndex = getStepIndex(order.status);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-chalk/10 pb-6">
        <div className="flex items-center gap-3">
          <AppLink
            to="/app/orders"
            className="flex size-10 items-center justify-center rounded-2xl border border-chalk/14 bg-court-600 text-chalk hover:text-volt-400"
          >
            <ArrowLeft className="size-5" />
          </AppLink>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-chalk font-mono">#{order.id}</h1>
              <StatusPill
                variant={
                  order.status === "READY_FOR_PICKUP"
                    ? "volt"
                    : order.status === "COLLECTED"
                    ? "success"
                    : "info"
                }
              >
                {order.status.replace(/_/g, " ")}
              </StatusPill>
            </div>
            <p className="text-xs text-chalk/60 font-mono mt-0.5">
              Date: {order.date} · Click & Collect at Pro Shop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleReorder}
            leftIcon={<RotateCw className="size-3.5" />}
          >
            Reorder All
          </Button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Order Lifecycle Timeline */}
        <div className="lg:col-span-4 rounded-[24px] border border-chalk/14 bg-court-500 p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-chalk">
              Order Fulfillment Timeline
            </h3>
            <Store className="size-4 text-volt-400" />
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-chalk/14 text-xs">
            {ORDER_STEPS.map((step, idx) => {
              const isDone = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const timelineEntry = order.timeline.find((t) => t.status === step.key);

              return (
                <div key={step.key} className="relative">
                  <div
                    className={cn(
                      "absolute -left-6 top-0 flex size-5 items-center justify-center rounded-full border text-[10px]",
                      isDone
                        ? "bg-volt-400 border-volt-400 text-ink-900 shadow-volt"
                        : isCurrent
                        ? "bg-court-600 border-volt-400 text-volt-400 ring-2 ring-volt-400/20"
                        : "bg-court-700 border-chalk/20 text-chalk/40"
                    )}
                  >
                    {isDone ? <CheckCircle2 className="size-3.5 stroke-[2.5]" /> : <Clock className="size-3" />}
                  </div>

                  <div>
                    <span className={cn("font-semibold block", isDone ? "text-chalk" : "text-chalk/40")}>
                      {step.label}
                    </span>
                    <span className="text-[11px] text-chalk/50">{step.desc}</span>
                    {timelineEntry?.note && (
                      <p className="mt-1 text-[11px] text-volt-400 bg-court-600/70 p-1.5 px-2 rounded-md font-mono border border-chalk/8">
                        {timelineEntry.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER: Order Items & Pricing Breakdown */}
        <div className="lg:col-span-5 rounded-[24px] border border-chalk/14 bg-court-500 p-6 space-y-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-chalk border-b border-chalk/10 pb-3">
            Purchased Items ({order.items.length})
          </h3>

          <div className="divide-y divide-chalk/8 text-xs">
            {order.items.map((item) => (
              <div key={item.id} className="py-3.5 space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-chalk text-sm">{item.name}</h4>
                    <span className="text-chalk/50 text-[11px] font-mono">
                      Qty: {item.quantity} · Unit Price: <Money amount={item.unitPrice} />
                    </span>
                  </div>
                  <span className="font-bold font-mono text-chalk text-sm">
                    <Money amount={item.total} />
                  </span>
                </div>
                {item.discount > 0 && (
                  <span className="text-[11px] text-emerald-400 font-mono block">
                    Saved <Money amount={item.discount} /> with {profile.tier} Member Discount
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-chalk/10 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-chalk/70">
              <span>Items Subtotal:</span>
              <span className="font-mono text-chalk"><Money amount={order.subtotal} /></span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Member Discount:</span>
              <span className="font-mono font-semibold">- <Money amount={order.discountTotal} /></span>
            </div>
            <div className="flex justify-between text-chalk/70">
              <span>GST (18%):</span>
              <span className="font-mono text-chalk"><Money amount={order.tax} /></span>
            </div>
            <div className="border-t border-chalk/10 pt-2 flex justify-between font-bold text-sm">
              <span className="text-chalk">Total Paid:</span>
              <span className="text-volt-400 font-mono text-base"><Money amount={order.total} /></span>
            </div>
          </div>
        </div>

        {/* RIGHT: Pickup QR & Counter PIN */}
        <div className="lg:col-span-3 rounded-[24px] border border-chalk/14 bg-court-500 p-6 flex flex-col items-center text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-volt-400 flex items-center gap-1.5">
            <QrCode className="size-4" /> Pro Shop Pickup QR
          </span>

          <div className="rounded-2xl bg-white p-4 shadow-xl ring-4 ring-volt-400/20">
            <QRCodeSVG
              value={JSON.stringify({ orderId: order.id, code: order.pickupCode })}
              size={150}
              level="H"
            />
          </div>

          <div className="w-full rounded-xl bg-court-600/80 p-2.5 border border-chalk/8">
            <span className="text-[10px] text-chalk/50 uppercase tracking-widest block font-mono">
              Counter PIN
            </span>
            <span className="text-lg font-bold font-mono tracking-widest text-volt-400">
              {order.pickupCode}
            </span>
          </div>

          <p className="text-[11px] text-chalk/60 leading-relaxed">
            Show this QR code at the Pro Shop service desk to collect your gear.
          </p>
        </div>
      </div>
    </div>
  );
}
