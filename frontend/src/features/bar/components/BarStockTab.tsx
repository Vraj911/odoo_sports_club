import { useState } from "react";
import { useBarStore } from "../barStore";
import { MenuItem } from "../types";
import { Wine, ChefHat, AlertTriangle, CheckCircle, Search, Edit3 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ReasonDialog } from "@/components/shared/ReasonDialog";

export function BarStockTab() {
  const { menuItems, toggleMenuItemAvailability, adjustBarStock } = useBarStore();
  const [search, setSearch] = useState("");
  const [stationFilter, setStationFilter] = useState<"ALL" | "BAR" | "KITCHEN">("ALL");

  // Stock Adjust ReasonDialog state
  const [adjustItem, setAdjustItem] = useState<MenuItem | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    const matchesStation = stationFilter === "ALL" || item.station === stationFilter;
    return matchesSearch && matchesStation;
  });

  const handleOpenAdjust = (item: MenuItem) => {
    setAdjustItem(item);
    setNewQty(item.stockQty || 0);
    setIsReasonDialogOpen(true);
  };

  const handleConfirmAdjust = (reason: string) => {
    if (adjustItem) {
      adjustBarStock(adjustItem.id, newQty, reason);
    }
    setIsReasonDialogOpen(false);
    setAdjustItem(null);
  };

  const lowStockCount = menuItems.filter(
    (i) => (i.stockQty || 0) <= (i.reorderLevel || 10)
  ).length;

  return (
    <div className="space-y-4">
      {/* Top Controls Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-court-600/50 p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bar & kitchen stock..."
              className="pl-9 h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setStationFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                stationFilter === "ALL" ? "bg-volt-400 text-ink-900 font-bold" : "text-white/60 hover:text-white"
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setStationFilter("BAR")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                stationFilter === "BAR" ? "bg-volt-400 text-ink-900 font-bold" : "text-white/60 hover:text-white"
              }`}
            >
              Bar Only
            </button>
            <button
              onClick={() => setStationFilter("KITCHEN")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                stationFilter === "KITCHEN" ? "bg-volt-400 text-ink-900 font-bold" : "text-white/60 hover:text-white"
              }`}
            >
              Kitchen
            </button>
          </div>
        </div>

        {/* Low Stock Counter Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/60">Stock Health:</span>
          {lowStockCount > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowStockCount} items at or below reorder level
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              All stock healthy
            </span>
          )}
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden bg-court-700/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-court-800/80 text-white/70 uppercase tracking-wider text-[10px] border-b border-white/10">
            <tr>
              <th className="py-3 px-4">Item & Category</th>
              <th className="py-3 px-3">Station</th>
              <th className="py-3 px-3">Price</th>
              <th className="py-3 px-3">On Hand Qty</th>
              <th className="py-3 px-3">Reorder Point</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredItems.map((item) => {
              const isLow = (item.stockQty || 0) <= (item.reorderLevel || 10);
              const isAvailable = item.isAvailable;

              return (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-[11px] text-white/50">{item.category}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.station === "KITCHEN"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                      }`}
                    >
                      {item.station === "KITCHEN" ? <ChefHat className="w-3 h-3" /> : <Wine className="w-3 h-3" />}
                      {item.station}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-volt-300">
                    ₹{item.price.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${isLow ? "text-amber-400" : "text-white"}`}>
                        {item.stockQty ?? "--"}
                      </span>
                      {isLow && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Low
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-white/60">
                    {item.reorderLevel ?? 10}
                  </td>
                  <td className="py-3 px-3">
                    {isAvailable ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        Available
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        86'd (Unavailable)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* 86 toggle button */}
                      <button
                        onClick={() => toggleMenuItemAvailability(item.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                          isAvailable
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {isAvailable ? "86 Item" : "Restore"}
                      </button>

                      {/* Stock Adjustment button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAdjust(item)}
                        className="h-7 text-xs px-2 text-white/70 hover:text-white"
                        title="Adjust on-hand inventory"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Adjust
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Reason Dialog */}
      {adjustItem && (
        <ReasonDialog
          isOpen={isReasonDialogOpen}
          onClose={() => {
            setIsReasonDialogOpen(false);
            setAdjustItem(null);
          }}
          title={`Adjust Stock: ${adjustItem.name}`}
          actionLabel="Commit Adjustment"
          confirmVariant="primary"
          onConfirm={handleConfirmAdjust}
        >
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-white/80">
              <span>Current On-Hand:</span>
              <strong className="text-white font-mono">{adjustItem.stockQty || 0} units</strong>
            </div>
            <div>
              <label className="text-xs text-white/70 mb-1 block">New Verified Count</label>
              <Input
                type="number"
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
                min="0"
                className="h-10 text-xs font-mono"
              />
            </div>
          </div>
        </ReasonDialog>
      )}
    </div>
  );
}
