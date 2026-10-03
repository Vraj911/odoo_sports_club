import { useState } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import { SAMPLE_PRODUCTS } from "../sampleData";
import type { PurchaseOrder, PurchaseOrderItem } from "../types";
import { Money } from "@/components/shared/Money";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Truck,
  Plus,
  CheckCircle2,
  FileText,
  Clock,
  Building,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";

const SUPPLIERS = [
  "Yonex Sunrise India Pvt Ltd",
  "Wilson Sports India",
  "Babolat South Asia",
  "Head India Racquets",
  "NOX Padel Distribution",
];

export default function ShopPurchaseOrdersPage() {
  const { user } = useAuth();
  const {
    purchaseOrders,
    createPurchaseOrder,
    receivePurchaseOrder,
    recordSupplierBill,
  } = useShopConsole();

  // Create PO Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [supplier, setSupplier] = useState(SUPPLIERS[0]);
  const [notes, setNotes] = useState("");
  const [poLines, setPoLines] = useState<PurchaseOrderItem[]>([
    {
      variantId: "V-001A",
      productId: "PRD-001",
      productName: "Yonex Astrox 99 Pro",
      variantLabel: "Grip Size G4",
      sku: "YNX-AX99P-G4",
      quantity: 10,
      unitCost: 10500,
      totalCost: 105000,
    },
  ]);

  const handleReceiveGoods = (po: PurchaseOrder) => {
    const staffName = user?.name || "Vikram Staff";
    receivePurchaseOrder(po.id, staffName);
    toast.success(`Goods received for ${po.poNumber}! On-hand stock updated in inventory ledger.`);
  };

  const handleRecordBill = (po: PurchaseOrder) => {
    recordSupplierBill(po.id);
    toast.success(`Supplier Bill for ${po.poNumber} created & sent to Accounts Payable (FIN-10).`);
  };

  const handleAddLine = () => {
    const prod = SAMPLE_PRODUCTS[0];
    const v = prod.variants[0];
    setPoLines((prev) => [
      ...prev,
      {
        variantId: v.id,
        productId: prod.id,
        productName: prod.name,
        variantLabel: "Standard",
        sku: v.sku,
        quantity: 5,
        unitCost: Math.round(v.price * 0.7),
        totalCost: 5 * Math.round(v.price * 0.7),
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    if (poLines.length <= 1) {
      toast.error("At least one line item is required.");
      return;
    }
    setPoLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleLineChange = (
    index: number,
    field: "qty" | "cost" | "product",
    value: string
  ) => {
    setPoLines((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === "qty") {
          const q = parseInt(value) || 1;
          return { ...item, quantity: q, totalCost: q * item.unitCost };
        }
        if (field === "cost") {
          const c = parseFloat(value) || 0;
          return { ...item, unitCost: c, totalCost: item.quantity * c };
        }
        return item;
      })
    );
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    createPurchaseOrder({
      supplier,
      items: poLines,
      notes,
    });
    toast.success(`Purchase Order created with supplier ${supplier}.`);
    setIsDrawerOpen(false);
  };

  const formSubtotal = poLines.reduce((s, i) => s + i.totalCost, 0);
  const formGst = Math.round(formSubtotal * 0.18);
  const formTotal = formSubtotal + formGst;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="purchase-orders" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-chalk/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="size-6 text-volt-400" />
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Purchase Orders & Suppliers
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              Procurement pipeline: Create PO → Receive Goods (stock-in) → Record Supplier Bill (FIN-10).
            </p>
          </div>

          <Button variant="primary" onClick={() => setIsDrawerOpen(true)} className="font-bold">
            <Plus className="size-4 mr-1.5" />
            <span>Create PO</span>
          </Button>
        </div>

        {/* PO Table */}
        <div className="flex-1 overflow-y-auto rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-chalk/12 text-chalk/50 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="pb-3 font-semibold">PO #</th>
                <th className="pb-3 font-semibold">Supplier</th>
                <th className="pb-3 font-semibold">Created Date</th>
                <th className="pb-3 font-semibold text-center">Lines</th>
                <th className="pb-3 font-semibold">PO Total</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 font-semibold text-center">Bill Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-chalk/6 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-volt-300">
                    {po.poNumber}
                  </td>

                  <td className="py-3.5">
                    <p className="font-semibold text-chalk text-sm">{po.supplier}</p>
                    <p className="text-[11px] text-chalk/50">Exp: {po.expectedDate}</p>
                  </td>

                  <td className="py-3.5 text-chalk/70">{po.createdAt}</td>

                  <td className="py-3.5 text-center font-bold text-chalk">
                    {po.items.length}
                  </td>

                  <td className="py-3.5 font-black text-chalk">
                    <Money amount={po.total} />
                  </td>

                  <td className="py-3.5 text-center">
                    <span
                      className={cn(
                        "rounded-pill px-2.5 py-0.5 text-[10px] font-bold uppercase",
                        po.status === "RECEIVED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : po.status === "SENT"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          : "bg-chalk/10 text-chalk/70 border border-chalk/14"
                      )}
                    >
                      {po.status}
                    </span>
                  </td>

                  <td className="py-3.5 text-center">
                    {po.billRecorded ? (
                      <span className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="size-3.5" />
                        <span>Bill Recorded</span>
                      </span>
                    ) : po.status === "RECEIVED" ? (
                      <span className="text-[10px] text-amber-400 font-bold">Bill Pending</span>
                    ) : (
                      <span className="text-chalk/30">—</span>
                    )}
                  </td>

                  <td className="py-3.5 text-right space-x-2 whitespace-nowrap">
                    {po.status === "SENT" && (
                      <Button
                        variant="primary"
                        onClick={() => handleReceiveGoods(po)}
                        className="h-8 text-xs font-bold bg-volt-400 text-ink-900"
                      >
                        <Package className="size-3 mr-1" />
                        <span>Receive Goods</span>
                      </Button>
                    )}

                    {po.status === "RECEIVED" && !po.billRecorded && (
                      <Button
                        variant="outline"
                        onClick={() => handleRecordBill(po)}
                        className="h-8 text-xs text-volt-300 border-volt-400/40 hover:bg-volt-400/10"
                      >
                        <FileText className="size-3 mr-1" />
                        <span>Record Supplier Bill</span>
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* ─── Create Purchase Order Drawer ─── */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create New Purchase Order"
        subtitle="Issue stock replenishment PO to manufacturer or distributor."
      >
        <form onSubmit={handleSavePO} className="flex flex-col gap-5 text-chalk pb-6">
          <div>
            <label className="text-[11px] font-semibold text-chalk/80 uppercase tracking-wider block mb-1.5">
              Select Supplier *
            </label>
            <select
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="h-10 w-full rounded-input border border-chalk/18 bg-court-700 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
            >
              {SUPPLIERS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-chalk/80 uppercase tracking-wider">
                PO Line Items ({poLines.length})
              </h4>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 rounded-pill bg-volt-400/20 px-2.5 py-1 text-[11px] font-bold text-volt-300 hover:bg-volt-400/30"
              >
                <Plus className="size-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {poLines.map((line, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-chalk/10 bg-court-700/60 p-3 grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-5">
                    <p className="font-semibold text-chalk truncate">{line.productName}</p>
                    <p className="font-mono text-[10px] text-chalk/50">{line.sku}</p>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] text-chalk/50 block">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, "qty", e.target.value)}
                      className="w-full h-7 rounded border border-chalk/16 bg-chalk/8 px-1.5 text-xs text-center font-bold text-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] text-chalk/50 block">Unit Cost</label>
                    <input
                      type="number"
                      value={line.unitCost}
                      onChange={(e) => handleLineChange(idx, "cost", e.target.value)}
                      className="w-full h-7 rounded border border-chalk/16 bg-chalk/8 px-1.5 text-xs text-right font-bold text-volt-300"
                    />
                  </div>

                  <div className="col-span-2 text-right">
                    <label className="text-[9px] text-chalk/50 block">Total</label>
                    <span className="font-bold text-chalk text-xs">
                      ₹{line.totalCost.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-chalk/40 hover:text-danger p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Totals */}
          <div className="space-y-1.5 rounded-xl bg-court-700/60 p-3.5 text-xs border border-chalk/10">
            <div className="flex justify-between text-chalk/70">
              <span>Subtotal</span>
              <span>₹{formSubtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-chalk/60 text-[11px]">
              <span>GST (18%)</span>
              <span>₹{formGst.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-chalk pt-1.5 border-t border-chalk/10">
              <span>Total PO Value</span>
              <span className="text-volt-400 text-base">₹{formTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <Input
            label="Internal Notes"
            placeholder="e.g. Expedited freight required for upcoming tournament..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-3 border-t border-chalk/12 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold px-6">
              Create PO
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
