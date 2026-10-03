import { useState, useMemo } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import type { VariantStockInfo, PurchaseOrderItem } from "../types";
import { Money } from "@/components/shared/Money";
import { Button } from "@/components/ui/Button";
import { AppLink, useGo } from "@/app/router/links";
import {
  PackagePlus,
  AlertTriangle,
  CheckSquare,
  Square,
  Truck,
  Building,
  CheckCircle2,
  Boxes,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export default function ShopRestockPage() {
  const go = useGo();
  const { lowStockItems, createPurchaseOrder } = useShopConsole();

  // Multi-select state: Set of variantIds
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(
    () => new Set(lowStockItems.map((i) => i.variantId))
  );

  // Editable restock quantities: variantId -> qty
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    lowStockItems.forEach((i) => {
      map[i.variantId] = i.suggestedReorderQty || 10;
    });
    return map;
  });

  const allSelected =
    lowStockItems.length > 0 && selectedVariantIds.size === lowStockItems.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedVariantIds(new Set());
    } else {
      setSelectedVariantIds(new Set(lowStockItems.map((i) => i.variantId)));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleQtyChange = (variantId: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [variantId]: Math.max(1, qty),
    }));
  };

  // Group selected items by supplier
  const selectedItems = useMemo(() => {
    return lowStockItems.filter((item) => selectedVariantIds.has(item.variantId));
  }, [lowStockItems, selectedVariantIds]);

  const totalEstimatedCost = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const qty = quantities[item.variantId] || 10;
      const unitCost = Math.round(item.price * 0.7); // 70% cost estimate
      return sum + qty * unitCost;
    }, 0);
  }, [selectedItems, quantities]);

  const handleCreatePOs = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to reorder.");
      return;
    }

    // Group by supplier
    const bySupplier: Record<string, typeof selectedItems> = {};
    selectedItems.forEach((item) => {
      const s = item.supplier || "Club Distributor India";
      if (!bySupplier[s]) bySupplier[s] = [];
      bySupplier[s].push(item);
    });

    let count = 0;
    Object.entries(bySupplier).forEach(([supplier, items]) => {
      const poItems: PurchaseOrderItem[] = items.map((i) => {
        const qty = quantities[i.variantId] || 10;
        const unitCost = Math.round(i.price * 0.7);
        return {
          variantId: i.variantId,
          productId: i.productId,
          productName: i.productName,
          variantLabel: i.variantLabel,
          sku: i.sku,
          quantity: qty,
          unitCost,
          totalCost: qty * unitCost,
        };
      });

      createPurchaseOrder({
        supplier,
        items: poItems,
        notes: `Automated low-stock restock PO for ${poItems.length} line(s).`,
      });
      count++;
    });

    toast.success(`Generated ${count} Draft Purchase Order(s) for ${selectedItems.length} items!`);
    go("/shop-console/purchase-orders");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="restock" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-chalk/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <PackagePlus className="size-6 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Restock Recommended
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              Variants where available stock is below or at the reorder threshold (≤ 3 units).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <AppLink
              to="/shop-console/purchase-orders"
              className="flex items-center gap-1.5 rounded-pill border border-chalk/16 bg-chalk/8 px-3.5 py-1.5 text-xs font-semibold text-chalk hover:bg-chalk/14"
            >
              <Truck className="size-3.5" />
              <span>View Active POs</span>
            </AppLink>
          </div>
        </div>

        {/* Content Table or Empty State */}
        {lowStockItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-[24px] border border-chalk/12 bg-court-600/50 p-8 text-center">
            <CheckCircle2 className="size-12 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-chalk">Healthy Stock Levels!</h3>
            <p className="text-xs text-chalk/60 mt-1 max-w-md">
              All pro shop products currently have sufficient inventory above their reorder thresholds.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-chalk/12 text-chalk/50 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="pb-3 w-10">
                      <button
                        type="button"
                        onClick={handleToggleAll}
                        className="text-chalk hover:text-volt-300"
                      >
                        {allSelected ? (
                          <CheckSquare className="size-4 text-volt-400" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </button>
                    </th>
                    <th className="pb-3 font-semibold">Product & Variant</th>
                    <th className="pb-3 font-semibold">SKU</th>
                    <th className="pb-3 font-semibold text-center">Available</th>
                    <th className="pb-3 font-semibold text-center">Reorder Level</th>
                    <th className="pb-3 font-semibold">Supplier</th>
                    <th className="pb-3 font-semibold text-center">Suggested Qty</th>
                    <th className="pb-3 font-semibold text-right">Est. Unit Cost</th>
                    <th className="pb-3 font-semibold text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-chalk/8">
                  {lowStockItems.map((item) => {
                    const isSelected = selectedVariantIds.has(item.variantId);
                    const qty = quantities[item.variantId] || 10;
                    const unitCost = Math.round(item.price * 0.7);

                    return (
                      <tr
                        key={item.variantId}
                        className={cn(
                          "hover:bg-chalk/6 transition-colors",
                          isSelected && "bg-volt-400/5"
                        )}
                      >
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item.variantId)}
                            className="text-chalk hover:text-volt-300"
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4 text-volt-400" />
                            ) : (
                              <Square className="size-4 text-chalk/40" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 pr-2">
                          <p className="font-semibold text-chalk text-sm">{item.productName}</p>
                          <p className="text-[11px] text-chalk/50">{item.variantLabel}</p>
                        </td>

                        <td className="py-3 font-mono text-[11px] text-chalk/70">
                          {item.sku}
                        </td>

                        <td className="py-3 text-center">
                          <span className="inline-block rounded-pill bg-danger/20 border border-danger/40 px-2 py-0.5 text-xs font-black text-red-300">
                            {item.available}
                          </span>
                        </td>

                        <td className="py-3 text-center text-chalk/60 font-semibold">
                          {item.reorderLevel}
                        </td>

                        <td className="py-3 text-chalk/80 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Building className="size-3 text-chalk/40" />
                            <span>{item.supplier}</span>
                          </span>
                        </td>

                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={(e) =>
                              handleQtyChange(item.variantId, parseInt(e.target.value) || 1)
                            }
                            className="w-16 h-8 rounded-lg border border-chalk/20 bg-court-700 px-2 text-center text-xs font-bold text-volt-300 focus:border-volt-400 focus:outline-none"
                          />
                        </td>

                        <td className="py-3 text-right text-chalk/70">
                          <Money amount={unitCost} />
                        </td>

                        <td className="py-3 text-right font-bold text-chalk">
                          <Money amount={qty * unitCost} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Floating Bar */}
            <div className="mt-4 pt-3 border-t border-chalk/12 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-chalk/70">
                <span>Selected: </span>
                <span className="font-bold text-volt-300">{selectedItems.length} items</span>
                <span className="mx-2">·</span>
                <span>Estimated PO Value: </span>
                <span className="font-bold text-chalk"><Money amount={totalEstimatedCost} /></span>
              </div>

              <Button
                variant="primary"
                onClick={handleCreatePOs}
                disabled={selectedItems.length === 0}
                className="font-bold px-6"
              >
                <PackagePlus className="size-4 mr-2" />
                <span>Create Purchase Orders ({selectedItems.length})</span>
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
