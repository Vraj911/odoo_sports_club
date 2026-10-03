import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useFinanceStore, recordPayment } from "../financeStore";
import type { PaymentSource, PaymentMethod } from "../types";
import { useAuth } from "@/app/providers/AuthProvider";
import { formatINR } from "@/components/shared/Money";
import { AlertCircle, CheckCircle, HandCoins, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedInvoiceId?: string;
}

const SOURCES: PaymentSource[] = ["COURT", "MEMBERSHIP", "SHOP", "BAR", "OTHER"];
const METHODS: PaymentMethod[] = ["UPI", "CARD", "CASH", "ONLINE"];

export function RecordPaymentModal({
  isOpen,
  onClose,
  preselectedInvoiceId,
}: RecordPaymentModalProps) {
  const { user } = useAuth();
  const { invoices } = useFinanceStore();

  const [source, setSource] = useState<PaymentSource>("COURT");
  const [method, setMethod] = useState<PaymentMethod>("UPI");
  const [amount, setAmount] = useState<string>("");
  const [ref, setRef] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [invoiceId, setInvoiceId] = useState<string>(preselectedInvoiceId || "");
  const [orderId, setOrderId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Filter open unpaid invoices for easy matching
  const openInvoices = invoices.filter((i) => i.status !== "PAID" && i.status !== "VOID");

  const handleInvoiceSelect = (invNum: string) => {
    setInvoiceId(invNum);
    if (!invNum) return;
    const inv = invoices.find((i) => i.invoiceNumber === invNum || i.id === invNum);
    if (inv) {
      setCustomerName(inv.customerName);
      setCustomerEmail(inv.customerEmail || "");
      setCustomerPhone(inv.customerPhone || "");
      setAmount(String(inv.balanceDue));
      setNotes(`Settlement for ${inv.invoiceNumber}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (!customerName.trim()) {
      setError("Customer name is required.");
      return;
    }

    // MANDATORY rule: reference number mandatory for UPI/card manual confirmations
    if ((method === "UPI" || method === "CARD") && !ref.trim()) {
      setError(`Transaction Reference / UTR / Auth Code is mandatory for ${method} manual confirmations.`);
      return;
    }

    const res = recordPayment({
      source,
      method,
      amount: parsedAmount,
      ref: ref.trim() || `CASH-${Date.now().toString().slice(-6)}`,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      invoiceId: invoiceId || undefined,
      orderId: orderId.trim() || undefined,
      receivedBy: user?.name || "Finance Desk Staff",
      notes: notes.trim() || undefined,
    });

    if (res.success) {
      // Reset form
      setAmount("");
      setRef("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setInvoiceId("");
      setOrderId("");
      setNotes("");
      onClose();
    } else if (res.error === "PERIOD_CLOSED") {
      setError("Current financial period is closed. Manual payments are locked.");
    } else {
      setError(res.error || "Failed to record payment.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
            <HandCoins className="size-4" />
          </div>
          <span>Record Manual Payment</span>
        </div>
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-danger/16 border border-danger/30 p-3 text-xs text-danger">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Source selector chips */}
        <div>
          <label className="block text-xs font-semibold text-chalk/70 uppercase tracking-wider mb-1.5">
            Payment Source
          </label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSource(s)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-xs font-medium transition-all border",
                  source === s
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-semibold shadow-volt"
                    : "bg-court-600 border-chalk/14 text-chalk/70 hover:text-chalk"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method chips */}
        <div>
          <label className="block text-xs font-semibold text-chalk/70 uppercase tracking-wider mb-1.5">
            Method
          </label>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-xs font-medium transition-all border",
                  method === m
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-semibold shadow-volt"
                    : "bg-court-600 border-chalk/14 text-chalk/70 hover:text-chalk"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Amount & Reference Number (Mandatory for UPI/Card) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-chalk/70 mb-1">
              Amount (INR) <span className="text-danger">*</span>
            </label>
            <Input
              type="number"
              min="1"
              step="any"
              placeholder="e.g. 2500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-chalk/70 mb-1">
              Reference / UTR / Txn No.{" "}
              {(method === "UPI" || method === "CARD") && (
                <span className="text-volt-400 font-bold">* Mandatory</span>
              )}
            </label>
            <Input
              placeholder={method === "UPI" ? "e.g. UPI/428190381029" : method === "CARD" ? "e.g. Auth-9921" : "Optional ref"}
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              required={method === "UPI" || method === "CARD"}
            />
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold text-chalk/70 mb-1">
              Customer Name <span className="text-danger">*</span>
            </label>
            <Input
              placeholder="Rohan Varma"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-chalk/70 mb-1">Phone</label>
            <Input
              placeholder="+91 98200..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-chalk/70 mb-1">Email</label>
            <Input
              type="email"
              placeholder="rohan@example.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Optional Link to Invoice */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-chalk/70 mb-1">
              Apply to Invoice (Optional)
            </label>
            <select
              value={invoiceId}
              onChange={(e) => handleInvoiceSelect(e.target.value)}
              className="w-full h-10 rounded-input border border-chalk/14 bg-court-600 px-3 text-sm text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
            >
              <option value="">-- No Invoice (Standalone Payment) --</option>
              {openInvoices.map((inv) => (
                <option key={inv.id} value={inv.invoiceNumber}>
                  {inv.invoiceNumber} - {inv.customerName} (Due: {formatINR(inv.balanceDue)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-chalk/70 mb-1">
              Order / Booking ID (Optional)
            </label>
            <Input
              placeholder="e.g. BKG-7712 or ORD-1081"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-chalk/70 mb-1">Notes</label>
          <Input
            placeholder="e.g. Received at desk during evening tennis slot"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="gap-2">
            <CheckCircle className="size-4" /> Confirm & Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
