import { useState, useMemo } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import type { ConsoleOrder, OrderStatus } from "../types";
import { Money } from "@/components/shared/Money";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
  Search,
  Scan,
  ChevronRight,
  X,
  Kanban,
  List,
  BellRing,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export default function ShopOrdersPage() {
  const {
    orders,
    advanceOrderStatus,
    verifyPickupCode,
    cancelOrder,
  } = useShopConsole();

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ConsoleOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pickup Verification Scanner state
  const [pickupCodeInput, setPickupCodeInput] = useState("");
  const [verifiedOrder, setVerifiedOrder] = useState<ConsoleOrder | null>(null);

  // Cancel dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.pickupCode.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }
    return list;
  }, [orders, searchQuery]);

  // Group into Kanban columns
  const placedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "PLACED"),
    [filteredOrders]
  );
  const packedOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "PACKED"),
    [filteredOrders]
  );
  const readyOrders = useMemo(
    () =>
      filteredOrders.filter(
        (o) => o.status === "READY_FOR_PICKUP" || o.status === "OUT_FOR_DELIVERY"
      ),
    [filteredOrders]
  );
  const completedOrders = useMemo(
    () =>
      filteredOrders.filter(
        (o) => o.status === "COLLECTED" || o.status === "DELIVERED"
      ),
    [filteredOrders]
  );

  // Status transitions
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case "PLACED":
        return "PACKED";
      case "PACKED":
        return "READY_FOR_PICKUP";
      case "READY_FOR_PICKUP":
        return "COLLECTED";
      case "OUT_FOR_DELIVERY":
        return "DELIVERED";
      default:
        return null;
    }
  };

  const handleAdvance = (order: ConsoleOrder) => {
    const next = getNextStatus(order.status);
    if (!next) return;

    advanceOrderStatus(order.id, next);
    toast.success(`Order #${order.orderNumber} advanced to ${next}. Member notified.`);

    // If drawer is open on this order, refresh local selection
    if (selectedOrder?.id === order.id) {
      setSelectedOrder({
        ...order,
        status: next,
      });
    }
  };

  // Quick pickup verify
  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupCodeInput.trim()) return;

    const matched = verifyPickupCode(pickupCodeInput);
    if (matched) {
      setVerifiedOrder(matched);
      toast.success(`Match verified: #${matched.orderNumber} (${matched.customerName})`);
    } else {
      setVerifiedOrder(null);
      toast.error(`No order found for code "${pickupCodeInput}".`);
    }
  };

  const handleMarkCollectedFromScanner = (order: ConsoleOrder) => {
    advanceOrderStatus(order.id, "COLLECTED", "Verified via counter QR scan");
    toast.success(`Order #${order.orderNumber} marked as COLLECTED. Member notified.`);
    setVerifiedOrder(null);
    setPickupCodeInput("");
  };

  const handleCancelConfirm = (reason: string) => {
    if (!selectedOrder) return;
    cancelOrder(selectedOrder.id, reason);
    toast.warning(`Order #${selectedOrder.orderNumber} cancelled. Online reservation released.`);
    setIsDrawerOpen(false);
    setSelectedOrder(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="orders" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* ─── Header: Stats + Scanner + View Toggle ─── */}
        <div className="mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-chalk/12 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <Package className="size-6 text-volt-400" />
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Online Orders Queue
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              Live Click & Collect queue. Realtime reservations automatically hold inventory.
            </p>
          </div>

          {/* Quick Pickup Code Scanner & Search */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <form onSubmit={handleVerifySubmit} className="relative flex-1 sm:w-72">
              <Scan className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-volt-400" />
              <input
                type="text"
                value={pickupCodeInput}
                onChange={(e) => setPickupCodeInput(e.target.value)}
                placeholder="Scan Pickup QR or enter code..."
                className="h-10 w-full rounded-pill border border-volt-400/40 bg-volt-400/10 pl-9 pr-3 text-xs text-chalk placeholder:text-chalk/50 focus:border-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400/20"
              />
            </form>

            {/* View Mode Toggle: Kanban vs List */}
            <div className="flex items-center rounded-pill bg-chalk/8 p-1 border border-chalk/12">
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all",
                  viewMode === "kanban"
                    ? "bg-volt-400 text-ink-900 shadow-sm"
                    : "text-chalk/60 hover:text-chalk"
                )}
              >
                <Kanban className="size-3.5" />
                <span>Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all",
                  viewMode === "list"
                    ? "bg-volt-400 text-ink-900 shadow-sm"
                    : "text-chalk/60 hover:text-chalk"
                )}
              >
                <List className="size-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── Verified Pickup Match Banner (if QR code scanned) ─── */}
        {verifiedOrder && (
          <div className="mb-5 rounded-[18px] border-2 border-emerald-400/60 bg-emerald-500/15 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-pill bg-emerald-400 text-ink-900 font-bold shrink-0">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-black text-emerald-300">
                    MATCH CONFIRMED: #{verifiedOrder.orderNumber}
                  </span>
                  <span className="rounded-pill bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Code: {verifiedOrder.pickupCode}
                  </span>
                </div>
                <p className="text-xs text-white/90 font-medium mt-0.5">
                  Customer: <span className="font-bold">{verifiedOrder.customerName}</span> ({verifiedOrder.customerPhone}) · {verifiedOrder.items.length} item(s) · ₹{verifiedOrder.total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setVerifiedOrder(null)}
                className="h-9 text-xs"
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                onClick={() => handleMarkCollectedFromScanner(verifiedOrder)}
                className="h-9 text-xs font-bold bg-emerald-400 text-ink-900 hover:bg-emerald-300"
              >
                <CheckCircle2 className="size-4 mr-1.5" />
                <span>Mark Collected & Deliver</span>
              </Button>
            </div>
          </div>
        )}

        {/* ─── Kanban Board View ─── */}
        {viewMode === "kanban" ? (
          <div className="grid flex-1 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
            {/* Column 1: Placed / Paid */}
            <KanbanColumn
              title="1. PLACED / PAID"
              badgeColor="bg-blue-400/20 text-blue-300 border-blue-400/30"
              orders={placedOrders}
              onSelectOrder={(o) => {
                setSelectedOrder(o);
                setIsDrawerOpen(true);
              }}
              onAdvance={handleAdvance}
              advanceLabel="Pack Items"
            />

            {/* Column 2: Packed */}
            <KanbanColumn
              title="2. PACKED"
              badgeColor="bg-amber-400/20 text-amber-300 border-amber-400/30"
              orders={packedOrders}
              onSelectOrder={(o) => {
                setSelectedOrder(o);
                setIsDrawerOpen(true);
              }}
              onAdvance={handleAdvance}
              advanceLabel="Ready for Pickup"
            />

            {/* Column 3: Ready / Out for delivery */}
            <KanbanColumn
              title="3. READY FOR PICKUP"
              badgeColor="bg-volt-400/20 text-volt-300 border-volt-400/30"
              orders={readyOrders}
              onSelectOrder={(o) => {
                setSelectedOrder(o);
                setIsDrawerOpen(true);
              }}
              onAdvance={handleAdvance}
              advanceLabel="Mark Collected"
            />

            {/* Column 4: Collected / Completed */}
            <KanbanColumn
              title="4. COLLECTED / DELIVERED"
              badgeColor="bg-emerald-400/20 text-emerald-300 border-emerald-400/30"
              orders={completedOrders}
              onSelectOrder={(o) => {
                setSelectedOrder(o);
                setIsDrawerOpen(true);
              }}
            />
          </div>
        ) : (
          /* ─── List View ─── */
          <div className="flex-1 overflow-y-auto rounded-[20px] border border-chalk/14 bg-court-600/70 p-4">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-chalk/12 text-chalk/50 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="pb-3 font-semibold">Order #</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Fulfilment</th>
                  <th className="pb-3 font-semibold">Items</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chalk/8">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => {
                      setSelectedOrder(o);
                      setIsDrawerOpen(true);
                    }}
                    className="hover:bg-chalk/6 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-mono font-bold text-volt-300">
                      #{o.orderNumber}
                    </td>
                    <td className="py-3">
                      <p className="font-semibold text-chalk">{o.customerName}</p>
                      <p className="text-[11px] text-chalk/50">{o.customerPhone}</p>
                    </td>
                    <td className="py-3">
                      <span className="rounded-pill bg-chalk/10 border border-chalk/14 px-2 py-0.5 text-[10px] font-bold text-chalk">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1 text-[11px] text-chalk/80">
                        {o.fulfillmentType === "DELIVERY" ? (
                          <Truck className="size-3 text-volt-400" />
                        ) : (
                          <ShoppingBag className="size-3 text-volt-400" />
                        )}
                        <span>{o.fulfillmentType}</span>
                      </span>
                    </td>
                    <td className="py-3 text-chalk/80">
                      {o.items.length} item(s)
                    </td>
                    <td className="py-3 font-bold text-chalk">
                      <Money amount={o.total} />
                    </td>
                    <td className="py-3 text-right">
                      {getNextStatus(o.status) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdvance(o);
                          }}
                          className="rounded-pill bg-volt-400 px-3 py-1 text-[11px] font-bold text-ink-900 hover:bg-volt-500"
                        >
                          Advance &gt;
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ─── Order Detail Drawer ─── */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedOrder ? `Order #${selectedOrder.orderNumber}` : "Order Details"}
        subtitle={selectedOrder ? `${selectedOrder.customerName} (${selectedOrder.customerPhone})` : ""}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-6 text-chalk">
            {/* Status Header Badge */}
            <div className="flex items-center justify-between rounded-xl bg-court-700/60 p-3.5 border border-chalk/12">
              <div>
                <span className="text-[10px] uppercase font-bold text-chalk/50 tracking-wider block">
                  Current Status
                </span>
                <span className="text-sm font-black text-volt-300">{selectedOrder.status}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-chalk/50 tracking-wider block">
                  Pickup / Delivery Code
                </span>
                <span className="font-mono text-sm font-bold text-chalk">
                  {selectedOrder.pickupCode}
                </span>
              </div>
            </div>

            {/* Fulfilment & Address Details */}
            <div className="space-y-1.5 rounded-xl border border-chalk/10 bg-chalk/6 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-chalk/60">Fulfilment Type:</span>
                <span className="font-semibold">{selectedOrder.fulfillmentType}</span>
              </div>
              {selectedOrder.slot && (
                <div className="flex justify-between">
                  <span className="text-chalk/60">Selected Slot:</span>
                  <span>{selectedOrder.slot}</span>
                </div>
              )}
              {selectedOrder.deliveryAddress && (
                <div className="pt-1 border-t border-chalk/8 text-[11px]">
                  <span className="text-chalk/60 block">Delivery Address:</span>
                  <span className="text-chalk/90">{selectedOrder.deliveryAddress}</span>
                </div>
              )}
            </div>

            {/* Line Items List */}
            <div>
              <h4 className="text-xs font-bold text-chalk/70 uppercase tracking-wider mb-2">
                Order Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-chalk/8 rounded-xl border border-chalk/10 bg-court-700/50 p-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <p className="font-semibold text-chalk">{item.name}</p>
                      <p className="text-[11px] text-chalk/50">{item.variantLabel}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-chalk">
                        {item.quantity} × ₹{item.unitPrice}
                      </p>
                      <p className="text-[11px] text-volt-300 font-semibold">
                        ₹{item.quantity * item.unitPrice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="space-y-1 rounded-xl bg-court-700/60 p-3 text-xs border border-chalk/10">
              <div className="flex justify-between text-chalk/70">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Discount ({selectedOrder.discountLabel})</span>
                  <span>−₹{selectedOrder.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-chalk/60 text-[11px]">
                <span>GST (18%)</span>
                <span>₹{selectedOrder.tax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-chalk pt-1 border-t border-chalk/10">
                <span>Total Paid</span>
                <span className="text-volt-400 text-base font-black">
                  ₹{selectedOrder.total.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-xs font-bold text-chalk/70 uppercase tracking-wider mb-2">
                Audit Timeline
              </h4>
              <div className="space-y-2 text-xs">
                {selectedOrder.timeline.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="size-2 rounded-full bg-volt-400 mt-1 shrink-0" />
                    <div>
                      <span className="font-bold text-chalk">{step.status}</span>
                      <span className="text-[10px] text-chalk/50 ml-2">{step.timestamp}</span>
                      <p className="text-[11px] text-chalk/70">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="mt-auto pt-4 border-t border-chalk/12 flex items-center justify-between gap-3">
              {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COLLECTED" && (
                <Button
                  variant="ghost"
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="text-danger hover:bg-danger/10 text-xs"
                >
                  Cancel Order
                </Button>
              )}

              {getNextStatus(selectedOrder.status) && (
                <Button
                  variant="primary"
                  onClick={() => handleAdvance(selectedOrder)}
                  className="ml-auto font-bold"
                >
                  <span>Advance to {getNextStatus(selectedOrder.status)}</span>
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Cancel Reason Dialog (Mandatory reason) ─── */}
      <ReasonDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
        title={`Cancel Order #${selectedOrder?.orderNumber}`}
        description="Cancelling will release the online reserved inventory back to available stock. Mandatory audit reason required."
        actionLabel="Confirm Order Cancellation"
      />
    </div>
  );
}

// ─── Sub-Component: Kanban Column ───────────────────────────────────────
function KanbanColumn({
  title,
  badgeColor,
  orders,
  onSelectOrder,
  onAdvance,
  advanceLabel,
}: {
  title: string;
  badgeColor: string;
  orders: ConsoleOrder[];
  onSelectOrder: (order: ConsoleOrder) => void;
  onAdvance?: (order: ConsoleOrder) => void;
  advanceLabel?: string;
}) {
  return (
    <div className="flex flex-col rounded-[20px] border border-chalk/12 bg-court-600/50 p-3.5 backdrop-blur-md min-h-[450px]">
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between pb-2 border-b border-chalk/8">
        <span className={cn("rounded-pill px-2.5 py-0.5 text-xs font-bold border", badgeColor)}>
          {title}
        </span>
        <span className="text-xs font-mono font-bold text-chalk/50">{orders.length}</span>
      </div>

      {/* Column Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {orders.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-center text-xs text-chalk/40">
            No orders in this stage
          </div>
        ) : (
          orders.map((o) => (
            <div
              key={o.id}
              onClick={() => onSelectOrder(o)}
              className="group relative rounded-[16px] border border-chalk/12 bg-court-700/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-volt-400/40 hover:shadow-md cursor-pointer"
            >
              {/* Top row: Order Number + Fulfilment */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-black text-volt-300">
                  #{o.orderNumber}
                </span>
                <span className="flex items-center gap-1 rounded-pill bg-chalk/8 px-2 py-0.5 text-[10px] font-semibold text-chalk/80">
                  {o.fulfillmentType === "DELIVERY" ? (
                    <Truck className="size-2.5 text-volt-400" />
                  ) : (
                    <ShoppingBag className="size-2.5 text-volt-400" />
                  )}
                  <span>{o.fulfillmentType}</span>
                </span>
              </div>

              {/* Customer Name & Tier */}
              <div className="mb-2">
                <p className="text-xs font-bold text-chalk group-hover:text-volt-300 transition-colors">
                  {o.customerName}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-chalk/60 mt-0.5">
                  <span>{o.customerPhone}</span>
                  {o.memberTier !== "Guest" && (
                    <span className="text-amber-400 font-semibold">· {o.memberTier}</span>
                  )}
                </div>
              </div>

              {/* Items summary */}
              <div className="mb-3 text-[11px] text-chalk/70 border-t border-chalk/8 pt-2">
                <p className="truncate">
                  {o.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                </p>
              </div>

              {/* Bottom: Age timer + Total + Advance button */}
              <div className="flex items-center justify-between pt-1 border-t border-chalk/8">
                <div>
                  <span className="text-[10px] text-chalk/50 flex items-center gap-1">
                    <Clock className="size-2.5" />
                    <span>25m ago</span>
                  </span>
                  <span className="text-xs font-bold text-volt-400 block mt-0.5">
                    <Money amount={o.total} />
                  </span>
                </div>

                {onAdvance && advanceLabel && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdvance(o);
                    }}
                    className="flex h-7 items-center gap-1 rounded-pill bg-volt-400 px-2.5 text-[11px] font-bold text-ink-900 hover:bg-volt-500 active:scale-95 transition-all shadow-sm"
                  >
                    <span>{advanceLabel}</span>
                    <ChevronRight className="size-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
