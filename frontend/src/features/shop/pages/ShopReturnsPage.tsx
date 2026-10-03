import { useState } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import type { ReturnRecord, ConsoleOrder, ReturnItem } from "../types";
import { Money } from "@/components/shared/Money";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Undo2,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";

export default function ShopReturnsPage() {
  const { user } = useAuth();
  const { orders, returns, processReturn } = useShopConsole();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orderQuery, setOrderQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ConsoleOrder | null>(null);

  // Return form state
  const [returnItems, setReturnItems] = useState<{
    variantId: string;
    productName: string;
    variantLabel: string;
    quantity: number;
    unitPrice: number;
    selected: boolean;
    condition: "RESTOCK" | "WRITE_OFF";
  }[]>([]);
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<"ORIGINAL_PAYMENT" | "CREDIT_NOTE" | "CASH">("ORIGINAL_PAYMENT");

  // Search orders for return
  const handleSearchOrder = () => {
    if (!orderQuery.trim()) return;
    const clean = orderQuery.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === clean ||
        o.customerPhone.includes(clean) ||
        o.customerName.toLowerCase().includes(clean)
    );

    if (found) {
      setSelectedOrder(found);
      setReturnItems(
        found.items.map((i) => ({
          variantId: i.variantId,
          productName: i.name,
          variantLabel: i.variantLabel,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          selected: true,
          condition: "RESTOCK",
        }))
      );
      toast.success(`Loaded order #${found.orderNumber} (${found.customerName})`);
    } else {
      toast.error(`No order found matching "${orderQuery}".`);
    }
  };

  const handleToggleItem = (idx: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleConditionChange = (idx: number, condition: "RESTOCK" | "WRITE_OFF") => {
    setReturnItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, condition } : item))
    );
  };

  const activeReturnLines = returnItems.filter((i) => i.selected);
  const totalRefundAmount = activeReturnLines.reduce(
    (sum, i) => sum + i.quantity * i.unitPrice,
    0
  );

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (activeReturnLines.length === 0) {
      toast.error("Please select at least one item to return.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Mandatory return reason is required.");
      return;
    }

    const staffName = user?.name || "Vikram Staff";

    const record = processReturn({
      orderNumber: selectedOrder.orderNumber,
      customerName: selectedOrder.customerName,
      customerPhone: selectedOrder.customerPhone,
      items: activeReturnLines.map((i) => ({
        variantId: i.variantId,
        productName: i.productName,
        variantLabel: i.variantLabel,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        refundAmount: i.quantity * i.unitPrice,
        condition: i.condition,
      })),
      totalRefund: totalRefundAmount,
      refundMethod,
      reason,
      staffName,
    });

    toast.success(
      `Return #${record.returnNumber} processed! ${
        record.creditNoteNumber ? `Credit note generated: #${record.creditNoteNumber}` : ""
      }`
    );
    setIsModalOpen(false);
    setSelectedOrder(null);
    setReason("");
    setOrderQuery("");
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="returns" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-chalk/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Undo2 className="size-6 text-volt-400" />
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Returns & Credit Notes
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              Audit-compliant returns: restock undamaged units or write-off defective goods.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="font-bold bg-volt-400 text-ink-900"
          >
            <Plus className="size-4 mr-1.5" />
            <span>Process Return</span>
          </Button>
        </div>

        {/* Returns Table */}
        <div className="flex-1 overflow-y-auto rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-chalk/12 text-chalk/50 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="pb-3 font-semibold">Return #</th>
                <th className="pb-3 font-semibold">Order Ref</th>
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold">Processed Date</th>
                <th className="pb-3 font-semibold">Refund Amount</th>
                <th className="pb-3 font-semibold">Method</th>
                <th className="pb-3 font-semibold">Reason</th>
                <th className="pb-3 font-semibold text-right">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-chalk/6 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-volt-300">
                    {ret.returnNumber}
                  </td>

                  <td className="py-3.5 font-mono text-[11px] text-chalk/80">
                    #{ret.orderNumber}
                  </td>

                  <td className="py-3.5">
                    <p className="font-semibold text-chalk">{ret.customerName}</p>
                    <p className="text-[10px] text-chalk/50">{ret.customerPhone}</p>
                  </td>

                  <td className="py-3.5 text-chalk/70">{ret.createdAt}</td>

                  <td className="py-3.5 font-bold text-emerald-400">
                    <Money amount={ret.totalRefund} />
                  </td>

                  <td className="py-3.5">
                    <span className="rounded-pill bg-chalk/8 px-2 py-0.5 text-[10px] font-semibold text-chalk/80">
                      {ret.refundMethod}
                    </span>
                    {ret.creditNoteNumber && (
                      <span className="block font-mono text-[9px] text-volt-300 mt-0.5">
                        #{ret.creditNoteNumber}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 text-chalk/80 italic max-w-xs truncate">
                    "{ret.reason}"
                  </td>

                  <td className="py-3.5 text-right font-medium text-chalk/60">
                    {ret.processedBy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* ─── Process Return Modal ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Undo2 className="size-5 text-volt-400" />
            <span>Process Return & Credit Note</span>
          </div>
        }
        subtitle="Lookup order, select lines, inspect condition, and issue refund."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitReturn} className="flex flex-col gap-5 text-chalk">
          {/* Step 1: Find Order */}
          {!selectedOrder ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-chalk/80 uppercase tracking-wider block">
                Find Order by Number or Customer Phone
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. SO-1040, SO-1042, or +91 99222..."
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  autoFocus
                />
                <Button type="button" variant="primary" onClick={handleSearchOrder}>
                  <Search className="size-4" />
                </Button>
              </div>

              {/* Quick suggestions */}
              <div className="pt-2">
                <span className="text-[11px] text-chalk/50 block mb-1">Recent orders available for return:</span>
                <div className="flex flex-wrap gap-1.5">
                  {orders.slice(0, 3).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setOrderQuery(o.orderNumber);
                        setSelectedOrder(o);
                        setReturnItems(
                          o.items.map((i) => ({
                            variantId: i.variantId,
                            productName: i.name,
                            variantLabel: i.variantLabel,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            selected: true,
                            condition: "RESTOCK",
                          }))
                        );
                      }}
                      className="rounded-pill border border-chalk/14 bg-chalk/6 px-2.5 py-1 text-[11px] text-chalk/70 hover:bg-chalk/12"
                    >
                      #{o.orderNumber} ({o.customerName})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Line items + Condition + Reason */
            <div className="space-y-4">
              <div className="rounded-xl border border-chalk/12 bg-court-700/60 p-3 text-xs flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-volt-300">#{selectedOrder.orderNumber}</span>
                  <span className="text-chalk/60 ml-2">({selectedOrder.customerName})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="text-xs text-chalk/50 hover:text-chalk underline"
                >
                  Change Order
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-chalk/80 uppercase tracking-wider block mb-1.5">
                  Select Lines to Return
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {returnItems.map((item, idx) => (
                    <div
                      key={item.variantId}
                      className={cn(
                        "rounded-xl border p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs",
                        item.selected
                          ? "border-volt-400/40 bg-volt-400/5"
                          : "border-chalk/10 bg-court-700/40 opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleToggleItem(idx)}
                          className="size-4 rounded accent-volt-400"
                        />
                        <div>
                          <p className="font-semibold text-chalk">{item.productName}</p>
                          <p className="text-[10px] text-chalk/50">{item.variantLabel}</p>
                        </div>
                      </div>

                      {item.selected && (
                        <div className="flex items-center gap-3 ml-auto">
                          {/* Condition toggle */}
                          <div className="flex rounded-pill bg-chalk/8 p-0.5 border border-chalk/14 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleConditionChange(idx, "RESTOCK")}
                              className={cn(
                                "px-2 py-0.5 rounded-pill font-semibold transition-all",
                                item.condition === "RESTOCK"
                                  ? "bg-emerald-400 text-ink-900 font-bold"
                                  : "text-chalk/60"
                              )}
                            >
                              Restock +1
                            </button>
                            <button
                              type="button"
                              onClick={() => handleConditionChange(idx, "WRITE_OFF")}
                              className={cn(
                                "px-2 py-0.5 rounded-pill font-semibold transition-all",
                                item.condition === "WRITE_OFF"
                                  ? "bg-danger text-white font-bold"
                                  : "text-chalk/60"
                              )}
                            >
                              Write-off
                            </button>
                          </div>

                          <span className="font-bold text-volt-300">
                            ₹{item.quantity * item.unitPrice}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund Method & Mandatory Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-chalk/80 uppercase tracking-wider block mb-1.5">
                    Refund Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="h-9 w-full rounded-input border border-chalk/18 bg-court-700 px-2.5 text-xs text-white"
                  >
                    <option value="ORIGINAL_PAYMENT">Original Payment Method</option>
                    <option value="CREDIT_NOTE">Store Credit Note (CN-xxxx)</option>
                    <option value="CASH">Counter Cash</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-chalk/80 uppercase tracking-wider block mb-1.5">
                    Total Refund
                  </label>
                  <div className="h-9 rounded-input border border-chalk/14 bg-court-700/60 px-3 flex items-center font-bold text-volt-400 text-sm">
                    <Money amount={totalRefundAmount} />
                  </div>
                </div>
              </div>

              <Input
                label="Mandatory Return Reason *"
                placeholder="e.g. Unopened packaging, wrong size ordered..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />

              <div className="pt-2 border-t border-chalk/12 flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="font-bold px-6">
                  Complete Return
                </Button>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
