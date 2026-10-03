import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useFinanceStore, formatCurrency, createInvoice, sendInvoiceReminder } from "../financeStore";
import type { InvoiceRecord, InvoiceStatus } from "../types";
import { ReceivablesAgingChart } from "../components/ReceivablesAgingChart";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { useGo } from "@/app/router/links";
import { formatINR } from "@/components/shared/Money";
import {
  Receipt,
  Search,
  Plus,
  ArrowRight,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileText,
  BarChart3,
  Building,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function FinanceInvoicesPage() {
  const go = useGo();
  const { invoices } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showAgingReport, setShowAgingReport] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // New Invoice Form State
  const [newCustName, setNewCustName] = useState("");
  const [newCustGstin, setNewCustGstin] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newDueDate, setNewDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || ""
  );
  const [newItemDesc, setNewItemDesc] = useState("Court Reservation / Club Facility Services");
  const [newItemRate, setNewItemRate] = useState("1200");
  const [newItemQty, setNewItemQty] = useState("1");
  const [newItemGstRate, setNewItemGstRate] = useState("18");
  const [formError, setFormError] = useState<string | null>(null);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (activeTab !== "ALL" && inv.status !== activeTab) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          (inv.customerGstin && inv.customerGstin.toLowerCase().includes(q)) ||
          (inv.customerEmail && inv.customerEmail.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, activeTab, search]);

  const tabs: TabItem[] = [
    { id: "ALL", label: `All (${invoices.length})` },
    {
      id: "DRAFT",
      label: `Draft (${invoices.filter((i) => i.status === "DRAFT").length})`,
    },
    {
      id: "SENT",
      label: `Sent (${invoices.filter((i) => i.status === "SENT").length})`,
    },
    {
      id: "PARTIAL",
      label: `Partial (${invoices.filter((i) => i.status === "PARTIAL").length})`,
    },
    {
      id: "PAID",
      label: `Paid (${invoices.filter((i) => i.status === "PAID").length})`,
    },
    {
      id: "OVERDUE",
      label: `Overdue (${invoices.filter((i) => i.status === "OVERDUE").length})`,
      badge: (
        <span className="flex size-2 rounded-full bg-rose-500 animate-pulse" />
      ),
    },
    {
      id: "VOID",
      label: `Void (${invoices.filter((i) => i.status === "VOID").length})`,
    },
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newCustName.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    const rate = parseFloat(newItemRate);
    const qty = parseInt(newItemQty, 10);
    const gstRate = parseFloat(newItemGstRate);

    if (!rate || rate <= 0 || !qty || qty <= 0) {
      setFormError("Item quantity and rate must be greater than zero.");
      return;
    }

    try {
      const created = createInvoice({
        customerName: newCustName.trim(),
        customerGstin: newCustGstin.trim() || undefined,
        customerEmail: newCustEmail.trim() || undefined,
        customerPhone: newCustPhone.trim() || undefined,
        customerAddress: newCustAddress.trim() || undefined,
        dueDate: newDueDate,
        items: [
          {
            description: newItemDesc.trim() || "Club Services",
            hsn: "999691",
            qty,
            rate,
            gstRate,
          },
        ],
      });

      setIsNewInvoiceOpen(false);
      // Reset
      setNewCustName("");
      setNewCustGstin("");
      setNewCustEmail("");
      setNewCustPhone("");
      setNewCustAddress("");
      // Navigate to detail
      go(`/finance/invoices/${created.id}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to create invoice.");
    }
  };

  const columns: Column<InvoiceRecord>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice No. / Date",
      render: (inv) => (
        <div>
          <span className="font-mono font-bold text-volt-400 text-sm">
            {inv.invoiceNumber}
          </span>
          <p className="text-[11px] text-chalk/60">{inv.date}</p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer / GSTIN",
      render: (inv) => (
        <div>
          <span className="font-semibold text-chalk">{inv.customerName}</span>
          {inv.customerGstin ? (
            <p className="text-[11px] font-mono text-amber-300">
              GSTIN: {inv.customerGstin}
            </p>
          ) : (
            <p className="text-[11px] text-chalk/50 italic">B2C Retail</p>
          )}
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (inv) => {
        const isPastDue =
          inv.status !== "PAID" &&
          inv.status !== "VOID" &&
          new Date(inv.dueDate).getTime() < Date.now();
        return (
          <span
            className={cn(
              "font-mono text-xs font-medium",
              isPastDue ? "text-rose-400 font-bold" : "text-chalk/80"
            )}
          >
            {inv.dueDate}
          </span>
        );
      },
    },
    {
      key: "totalAmount",
      header: "Total (inc. GST)",
      align: "right",
      render: (inv) => (
        <div>
          <span className="font-mono text-sm font-bold text-chalk">
            {formatINR(inv.totalAmount)}
          </span>
          <p className="text-[10px] text-chalk/50 font-mono">
            Tax: {formatINR(inv.cgstTotal + inv.sgstTotal + inv.igstTotal)}
          </p>
        </div>
      ),
    },
    {
      key: "balanceDue",
      header: "Balance Due",
      align: "right",
      render: (inv) => (
        <span
          className={cn(
            "font-mono text-sm font-bold",
            inv.balanceDue > 0 ? "text-rose-400" : "text-emerald-400"
          )}
        >
          {formatINR(inv.balanceDue)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (inv) => {
        let tone: "success" | "warning" | "danger" | "info" | "neutral" = "neutral";
        if (inv.status === "PAID") tone = "success";
        else if (inv.status === "OVERDUE") tone = "danger";
        else if (inv.status === "PARTIAL") tone = "warning";
        else if (inv.status === "SENT") tone = "info";
        else if (inv.status === "VOID") tone = "neutral";

        return (
          <div className="flex items-center gap-2">
            <StatusPill tone={tone} className="capitalize">
              {inv.status}
            </StatusPill>
            {inv.status === "OVERDUE" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sendInvoiceReminder(inv.id, "EMAIL");
                }}
                className="rounded-full bg-rose-500/20 p-1 text-rose-400 hover:bg-rose-500/30 transition-colors"
                title="Send Overdue Reminder"
              >
                <Send className="size-3" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (inv) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go(`/finance/invoices/${inv.id}`)}
          className="h-7 px-3 text-xs gap-1"
        >
          Details <ArrowRight className="size-3" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Invoices"
        subtitle="Gap-free sequential billing (INV-2026-XXXX), GST breakup, corporate receivables, and automated reminders."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowAgingReport((s) => !s)}
              className="gap-1.5"
            >
              <BarChart3 className="size-3.5" />
              {showAgingReport ? "Hide Aging Report" : "Receivables Aging (FIN-06)"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewInvoiceOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> New Invoice
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Receivables Aging Chart Section (collapsible / toggleable) */}
      {showAgingReport && <ReceivablesAgingChart invoices={invoices} />}

      {/* Top Filter and Search Strip */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name, GSTIN, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-input border border-chalk/14 bg-court-700/60 pl-9 pr-4 text-xs text-chalk placeholder:text-chalk/40 focus:outline-none focus:ring-2 focus:ring-volt-400"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-chalk/70">
            <span>
              Total Invoiced:{" "}
              <strong className="text-chalk">
                {formatINR(invoices.reduce((s, i) => s + (i.status !== "VOID" ? i.totalAmount : 0), 0))}
              </strong>
            </span>
            <span>•</span>
            <span>
              Total Due:{" "}
              <strong className="text-rose-400">
                {formatINR(invoices.reduce((s, i) => s + i.balanceDue, 0))}
              </strong>
            </span>
          </div>
        </div>

        {/* Status Tabs with Framer Motion indicator */}
        <div className="border-t border-chalk/10 pt-3">
          <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
        </div>
      </Card>

      {/* Invoices Data Table */}
      <Table
        columns={columns}
        data={filteredInvoices}
        keyExtractor={(inv) => inv.id}
        emptyTitle="No invoices found"
        emptySubtitle="There are no invoices matching the selected status or search filter."
      />

      {/* New Invoice Modal */}
      <Modal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <Receipt className="size-4" />
            </div>
            <span>Create Gap-Free Tax Invoice</span>
          </div>
        }
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="flex items-start gap-2 rounded-lg bg-danger/16 border border-danger/30 p-3 text-xs text-danger">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="rounded-lg bg-court-700/60 border border-chalk/10 p-3 text-chalk/70">
            <p className="font-semibold text-chalk">
              Sequential Gap-Free Numbering Rule (BR-12):
            </p>
            <p className="mt-0.5 text-[11px]">
              System will assign the next sequential invoice number in chronological audit sequence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Customer / Company Name <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="e.g. Reliance Foundation or Rohan Varma"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Customer GSTIN (Optional B2B)
              </label>
              <Input
                placeholder="e.g. 27AAACR1234A1Z5"
                value={newCustGstin}
                onChange={(e) => setNewCustGstin(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Email</label>
              <Input
                type="email"
                placeholder="customer@domain.com"
                value={newCustEmail}
                onChange={(e) => setNewCustEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Phone</label>
              <Input
                placeholder="+91 98200..."
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-chalk/80 mb-1">Billing Address</label>
            <Input
              placeholder="e.g. BKC Commercial Hub, Mumbai"
              value={newCustAddress}
              onChange={(e) => setNewCustAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block font-semibold text-chalk/80 mb-1">Payment Due Date</label>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              required
            />
          </div>

          {/* Line Item Section */}
          <div className="rounded-lg border border-chalk/14 bg-court-700/40 p-3 space-y-3">
            <p className="font-bold text-chalk uppercase text-[10px] tracking-wider">
              Primary Line Item
            </p>
            <div>
              <label className="block text-chalk/70 mb-1">Item Description</label>
              <Input
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-chalk/70 mb-1">Qty</label>
                <Input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-chalk/70 mb-1">Unit Rate (₹)</label>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  value={newItemRate}
                  onChange={(e) => setNewItemRate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-chalk/70 mb-1">GST %</label>
                <select
                  value={newItemGstRate}
                  onChange={(e) => setNewItemGstRate(e.target.value)}
                  className="w-full h-10 rounded-input border border-chalk/14 bg-court-600 px-2 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
                >
                  <option value="18">18% (Standard Services)</option>
                  <option value="12">12% (Sport Goods)</option>
                  <option value="5">5% (F&B Restaurant)</option>
                  <option value="0">0% (Exempt)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button type="button" variant="secondary" onClick={() => setIsNewInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="gap-2">
              <Receipt className="size-4" /> Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
