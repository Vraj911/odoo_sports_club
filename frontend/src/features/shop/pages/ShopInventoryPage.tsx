import { useState, useMemo } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import type { VariantStockInfo, InventoryMovement } from "../types";
import { Money } from "@/components/shared/Money";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { AppLink } from "@/app/router/links";
import {
  Boxes,
  AlertTriangle,
  Lock,
  Search,
  Plus,
  Minus,
  History,
  TrendingDown,
  Package,
  Layers,
  Sparkles,
  ShieldCheck,
  PackagePlus,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";

export default function ShopInventoryPage() {
  const { user } = useAuth();
  const {
    inventoryList,
    lowStockCount,
    lowStockItems,
    pendingOrdersCount,
    movements,
    adjustStock,
  } = useShopConsole();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Adjust Stock Dialog state
  const [adjustTarget, setAdjustTarget] = useState<VariantStockInfo | null>(null);
  const [adjustType, setAdjustType] = useState<"receipt" | "adjustment" | "damage">("adjustment");
  const [adjustQty, setAdjustQty] = useState<string>("1");
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);

  // Movements Ledger Drawer state
  const [ledgerTarget, setLedgerTarget] = useState<VariantStockInfo | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);

  // Total stock valuation
  const totalStockValuation = useMemo(() => {
    return inventoryList.reduce((sum, item) => sum + item.onHand * item.price, 0);
  }, [inventoryList]);

  // Filtered inventory list
  const filteredList = useMemo(() => {
    let list = [...inventoryList];
    if (filterLowStockOnly) {
      list = list.filter((i) => i.available <= i.reorderLevel);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q)
      );
    }
    return list;
  }, [inventoryList, filterLowStockOnly, searchQuery]);

  // Movements for active ledger target
  const targetMovements = useMemo(() => {
    if (!ledgerTarget) return [];
    return movements.filter(
      (m) => m.variantId === ledgerTarget.variantId || m.sku === ledgerTarget.sku
    );
  }, [movements, ledgerTarget]);

  // Open adjustment workflow
  const handleOpenAdjust = (item: VariantStockInfo) => {
    setAdjustTarget(item);
    setAdjustQty("1");
    setAdjustType("adjustment");
    setIsReasonDialogOpen(true);
  };

  const handleConfirmAdjust = (reason: string) => {
    if (!adjustTarget) return;
    const qty = parseInt(adjustQty) || 1;
    const delta = adjustType === "damage" ? -Math.abs(qty) : adjustType === "receipt" ? Math.abs(qty) : qty;

    const staffName = user?.name || "Vikram Staff";

    adjustStock({
      variantId: adjustTarget.variantId,
      productId: adjustTarget.productId,
      productName: `${adjustTarget.productName} (${adjustTarget.variantLabel})`,
      sku: adjustTarget.sku,
      type: adjustType,
      qtyDelta: delta,
      reason,
      staffName,
    });

    toast.success(`Stock adjusted by ${delta > 0 ? `+${delta}` : delta} for ${adjustTarget.sku}. Recorded in audit ledger.`);
    setIsReasonDialogOpen(false);
    setAdjustTarget(null);
  };

  const handleOpenLedger = (item: VariantStockInfo) => {
    setLedgerTarget(item);
    setIsLedgerOpen(true);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="inventory" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* ─── Header KPI Strip ─── */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Low Stock Alert */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-chalk/60 uppercase tracking-wider">
                Low Stock Alerts
              </p>
              <p className="text-2xl font-black text-amber-400 mt-1">
                {lowStockCount} <span className="text-xs font-normal text-chalk/50">SKUs</span>
              </p>
              <p className="text-[11px] text-chalk/50 mt-0.5">Below threshold (≤ 3)</p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-pill bg-amber-500/20 text-amber-400">
              <AlertTriangle className="size-5" />
            </div>
          </div>

          {/* KPI 2: Total Inventory Value */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-chalk/60 uppercase tracking-wider">
                Total Stock Valuation
              </p>
              <p className="text-2xl font-black text-volt-400 mt-1">
                <Money amount={totalStockValuation} />
              </p>
              <p className="text-[11px] text-chalk/50 mt-0.5">Physical goods on hand</p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-pill bg-volt-400/20 text-volt-300">
              <Boxes className="size-5" />
            </div>
          </div>

          {/* KPI 3: Pending Online Reservations */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-chalk/60 uppercase tracking-wider">
                Online Holds / Reserved
              </p>
              <p className="text-2xl font-black text-blue-400 mt-1">
                {pendingOrdersCount} <span className="text-xs font-normal text-chalk/50">orders</span>
              </p>
              <p className="text-[11px] text-chalk/50 mt-0.5">Locked from counter sale</p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-pill bg-blue-500/20 text-blue-400">
              <Lock className="size-5" />
            </div>
          </div>

          {/* KPI 4: Restock Quick Link */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-chalk/60 uppercase tracking-wider">
                Restock Recommended
              </p>
              <p className="text-2xl font-black text-chalk mt-1">
                {lowStockCount} <span className="text-xs font-normal text-chalk/50">items</span>
              </p>
              <AppLink
                to="/shop-console/restock"
                className="text-[11px] text-volt-300 hover:underline font-bold mt-0.5 inline-flex items-center gap-1"
              >
                <span>Generate POs &gt;</span>
              </AppLink>
            </div>
            <div className="flex size-11 items-center justify-center rounded-pill bg-chalk/10 text-chalk">
              <PackagePlus className="size-5" />
            </div>
          </div>
        </div>

        {/* ─── Search & Low Stock Toggle Bar ─── */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-chalk/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product, brand, or SKU..."
              className="h-10 w-full rounded-pill border border-chalk/16 bg-white/8 pl-10 pr-4 text-xs text-chalk placeholder:text-chalk/45 focus:border-volt-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterLowStockOnly((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 rounded-pill border px-3 py-2 text-xs font-semibold transition-all",
                filterLowStockOnly
                  ? "border-amber-400 bg-amber-400/20 text-amber-300 font-bold"
                  : "border-chalk/14 bg-chalk/8 text-chalk/70 hover:bg-chalk/14"
              )}
            >
              <AlertTriangle className="size-3.5" />
              <span>Low Stock Only ({lowStockCount})</span>
            </button>
          </div>
        </div>

        {/* ─── Inventory DataTable ─── */}
        <div className="flex-1 overflow-y-auto rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-chalk/12 text-chalk/50 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="pb-3 font-semibold">Product & Variant</th>
                <th className="pb-3 font-semibold">SKU</th>
                <th className="pb-3 font-semibold text-center">On Hand</th>
                <th className="pb-3 font-semibold text-center">Reserved</th>
                <th className="pb-3 font-semibold text-center">Available</th>
                <th className="pb-3 font-semibold text-center">Reorder Level</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8">
              {filteredList.map((item) => {
                const isCritical = item.available <= 1;
                const isWarning = item.available <= item.reorderLevel && item.available > 1;

                return (
                  <tr key={item.variantId} className="hover:bg-chalk/6 transition-colors">
                    <td className="py-3.5 pr-2">
                      <p className="font-semibold text-chalk text-sm">{item.productName}</p>
                      <p className="text-[11px] text-chalk/50">
                        {item.brand} · <span className="text-volt-300/80">{item.variantLabel}</span>
                      </p>
                    </td>

                    <td className="py-3.5 font-mono text-[11px] text-chalk/70">
                      {item.sku}
                    </td>

                    <td className="py-3.5 text-center font-bold text-chalk">
                      {item.onHand}
                    </td>

                    <td className="py-3.5 text-center">
                      {item.reserved > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[11px] font-bold text-blue-300">
                          <Lock className="size-2.5" />
                          <span>{item.reserved}</span>
                        </span>
                      ) : (
                        <span className="text-chalk/30">0</span>
                      )}
                    </td>

                    <td className="py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-block rounded-pill px-2.5 py-0.5 text-xs font-black shadow-sm",
                          isCritical
                            ? "bg-danger text-white animate-pulse"
                            : isWarning
                            ? "bg-amber-400 text-ink-900"
                            : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300"
                        )}
                      >
                        {item.available}
                      </span>
                    </td>

                    <td className="py-3.5 text-center text-chalk/60 font-medium">
                      {item.reorderLevel}
                    </td>

                    <td className="py-3.5 font-bold text-chalk">
                      <Money amount={item.price} />
                    </td>

                    <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenAdjust(item)}
                        className="rounded-pill border border-chalk/18 bg-chalk/8 px-2.5 py-1 text-[11px] font-semibold text-chalk hover:bg-chalk/16 transition-colors"
                      >
                        Adjust Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLedger(item)}
                        title="View stock movement audit ledger"
                        className="rounded-pill p-1 text-chalk/50 hover:bg-chalk/14 hover:text-chalk transition-colors inline-flex items-center"
                      >
                        <History className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {/* ─── Adjust Stock ReasonDialog ─── */}
      <ReasonDialog
        isOpen={isReasonDialogOpen}
        onClose={() => setIsReasonDialogOpen(false)}
        onConfirm={handleConfirmAdjust}
        title={adjustTarget ? `Adjust Stock: ${adjustTarget.sku}` : "Stock Adjustment"}
        description={`Current on-hand: ${adjustTarget?.onHand ?? 0} units. Adjusting inventory requires a mandatory audit explanation.`}
        actionLabel="Apply Adjustment"
      />

      {/* ─── Movements Ledger Drawer ─── */}
      <Drawer
        isOpen={isLedgerOpen}
        onClose={() => setIsLedgerOpen(false)}
        title={ledgerTarget ? `Ledger: ${ledgerTarget.productName}` : "Movement Ledger"}
        subtitle={ledgerTarget ? `SKU: ${ledgerTarget.sku} · Variant: ${ledgerTarget.variantLabel}` : ""}
      >
        <div className="flex flex-col gap-4 text-chalk">
          <div className="rounded-xl border border-chalk/12 bg-court-700/60 p-3 text-xs flex justify-between">
            <div>
              <span className="text-[10px] uppercase text-chalk/50 font-bold block">On Hand</span>
              <span className="text-base font-black text-chalk">{ledgerTarget?.onHand}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-chalk/50 font-bold block">Reserved</span>
              <span className="text-base font-black text-blue-300">{ledgerTarget?.reserved}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-chalk/50 font-bold block">Available</span>
              <span className="text-base font-black text-volt-400">{ledgerTarget?.available}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-chalk/70 uppercase tracking-wider mb-2">
              Transaction History ({targetMovements.length})
            </h4>

            {targetMovements.length === 0 ? (
              <p className="text-xs text-chalk/50 text-center py-6">No recorded stock movements yet.</p>
            ) : (
              <div className="divide-y divide-chalk/8 rounded-xl border border-chalk/10 bg-court-700/40 p-2 space-y-1">
                {targetMovements.map((m) => (
                  <div key={m.id} className="py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-chalk capitalize flex items-center gap-1.5">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            m.quantity > 0 ? "bg-emerald-400" : "bg-danger"
                          )}
                        />
                        {m.type} ({m.reference})
                      </span>
                      <span
                        className={cn(
                          "font-mono font-bold text-sm",
                          m.quantity > 0 ? "text-emerald-400" : "text-red-400"
                        )}
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>

                    <p className="text-[11px] text-chalk/80 mt-1 italic">
                      "{m.reason || "Manual system update"}"
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-chalk/50">
                      <span>User: {m.user}</span>
                      <span>{m.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
