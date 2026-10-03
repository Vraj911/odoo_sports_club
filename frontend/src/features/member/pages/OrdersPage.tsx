import { useState } from "react";
import { Package, ShoppingBag, QrCode, ArrowRight, Clock, CheckCircle2, RotateCw } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Money } from "@/components/shared/Money";
import { useMember } from "@/features/member/memberStore";
import { useToast } from "@/components/ui/Toast";
import type { Order } from "@/features/member/types";

export default function OrdersPage() {
  const { orders } = useMember();
  const toast = useToast();

  const handleReorder = (order: Order, e: React.MouseEvent) => {
    e.preventDefault();
    toast.success("Items Added to Cart", `Reordered ${order.items.length} items from #${order.id}.`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-chalk/10 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Package className="size-6 text-volt-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              Pro Shop Orders
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Track equipment purchases, racket stringing jobs, balls, and apparel collection at the Pro Shop counter.
          </p>
        </div>

        <AppLink to="/app/shop">
          <Button variant="primary" leftIcon={<ShoppingBag className="size-4" />}>
            Visit Pro Shop
          </Button>
        </AppLink>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const isPickupReady = order.status === "READY_FOR_PICKUP";

          return (
            <div
              key={order.id}
              className="rounded-[24px] border border-chalk/14 bg-court-500 p-6 transition-all hover:border-chalk/28 hover:shadow-card space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-chalk/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-court-600 border border-chalk/10 text-volt-400">
                    <Package className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-chalk text-base font-mono">
                        #{order.id}
                      </span>
                      <StatusPill
                        variant={
                          isPickupReady
                            ? "volt"
                            : order.status === "COLLECTED" || order.status === "DELIVERED"
                            ? "success"
                            : "info"
                        }
                      >
                        {order.status.replace(/_/g, " ")}
                      </StatusPill>
                    </div>
                    <p className="text-[11px] text-chalk/50 font-mono mt-0.5">
                      Placed on {order.date} · {order.orderType === "PICKUP" ? "Click & Collect" : "Delivery"}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-base font-bold font-mono text-volt-400 block">
                    <Money amount={order.total} />
                  </span>
                  <span className="text-[11px] text-chalk/50 font-mono">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="space-y-2 text-xs">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-chalk/80">
                    <span>
                      {item.quantity}× {item.name}
                    </span>
                    <span className="font-mono text-chalk font-medium">
                      <Money amount={item.total} />
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-chalk/10 pt-4">
                {isPickupReady && (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-volt-400 font-mono">
                    <QrCode className="size-4" />
                    Pickup Code: {order.pickupCode}
                  </span>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleReorder(order, e)}
                    leftIcon={<RotateCw className="size-3.5" />}
                    className="text-xs h-8"
                  >
                    Reorder
                  </Button>

                  <AppLink to={`/app/orders/${order.id}`}>
                    <Button variant="secondary" size="sm" className="text-xs h-8">
                      View Details & QR
                    </Button>
                  </AppLink>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
