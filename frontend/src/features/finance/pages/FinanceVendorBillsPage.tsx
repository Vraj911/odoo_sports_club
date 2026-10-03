import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import {
  useFinanceStore,
  formatCurrency,
  recordVendorBill,
  recordVendorBillPayment,
} from "../financeStore";
import type { VendorBill, BillStatus, ExpenseCategory } from "../types";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { formatINR } from "@/components/shared/Money";
import { useGo } from "@/app/router/links";
import {
  FileText,
  Plus,
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function FinanceVendorBillsPage() {
  const go = useGo();
  const { vendorBills, vendors } = useFinanceStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // New Bill Modal
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [billNum, setBillNum] = useState("");
  const [vendorId, setVendorId] = useState(vendors[0]?.id || "");
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().split("T")[0] || "");
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || ""
  );
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("supplies");
  const [itemsDesc, setItemsDesc] = useState("");

  // Record Payment Modal
  const [payingBill, setPayingBill] = useState<VendorBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");

  const filteredBills = useMemo(() => {
    return vendorBills.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          b.billNumber.toLowerCase().includes(q) ||
          b.vendorName.toLowerCase().includes(q) ||
          b.itemsDescription.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [vendorBills, statusFilter, search]);

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!billNum.trim()) return;

    recordVendorBill({
      billNumber: billNum.trim(),
      vendorId: vendorId || "VEN-001",
      date: billDate,
      dueDate,
      amount: parsedAmount,
      taxAmount: parsedAmount * 0.18, // 18% standard input tax
      category,
      itemsDescription: itemsDesc.trim() || "Procurement items",
    });

    setIsNewBillOpen(false);
    setBillNum("");
    setAmount("");
    setItemsDesc("");
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;
    const parsedAmt = parseFloat(paymentAmount);
    if (!parsedAmt || parsedAmt <= 0) return;

    recordVendorBillPayment(
      payingBill.id,
      parsedAmt,
      paymentMethod,
      paymentRef.trim() || `NEFT-${Date.now().toString().slice(-6)}`
    );

    setPayingBill(null);
    setPaymentAmount("");
    setPaymentRef("");
  };

  const columns: Column<VendorBill>[] = [
    {
      key: "billNumber",
      header: "Bill Number / Date",
      render: (b) => (
        <div>
          <span className="font-mono font-bold text-volt-400">{b.billNumber}</span>
          <p className="text-[11px] text-chalk/60 font-mono">{b.date}</p>
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Vendor & Items",
      render: (b) => (
        <div>
          <span className="font-semibold text-chalk text-xs flex items-center gap-1.5">
            <Building className="size-3 text-chalk/60" /> {b.vendorName}
          </span>
          <p className="text-[11px] text-chalk/60 truncate max-w-xs">{b.itemsDescription}</p>
        </div>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      render: (b) => {
        const isPastDue =
          b.status !== "PAID" && new Date(b.dueDate).getTime() < Date.now();
        return (
          <span
            className={cn(
              "font-mono text-xs",
              isPastDue ? "text-rose-400 font-bold" : "text-chalk/80"
            )}
          >
            {b.dueDate}
          </span>
        );
      },
    },
    {
      key: "amount",
      header: "Bill Amount",
      align: "right",
      render: (b) => (
        <div>
          <span className="font-mono text-sm font-bold text-chalk">
            {formatINR(b.amount)}
          </span>
          <p className="text-[10px] text-chalk/50 font-mono">
            Paid: {formatINR(b.paidAmount)}
          </p>
        </div>
      ),
    },
    {
      key: "balance",
      header: "Balance Due",
      align: "right",
      render: (b) => {
        const balance = b.amount - b.paidAmount;
        return (
          <span
            className={cn(
              "font-mono text-sm font-bold",
              balance > 0 ? "text-rose-400" : "text-emerald-400"
            )}
          >
            {formatINR(balance)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (b) => {
        const tone =
          b.status === "PAID"
            ? "success"
            : b.status === "OVERDUE"
            ? "danger"
            : b.status === "PARTIAL"
            ? "warning"
            : "neutral";
        return (
          <StatusPill tone={tone} className="capitalize">
            {b.status}
          </StatusPill>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (b) => {
        const isFullyPaid = b.paidAmount >= b.amount;
        return (
          <Button
            variant={isFullyPaid ? "secondary" : "primary"}
            size="sm"
            disabled={isFullyPaid}
            onClick={() => {
              setPayingBill(b);
              setPaymentAmount(String(b.amount - b.paidAmount));
            }}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <CreditCard className="size-3" />
            {isFullyPaid ? "Settled" : "Record Pay"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Bills"
        subtitle="Accounts payable ledger, supplier invoices, payment disbursement tracking, and credit terms (FIN-10)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/finance/vendors")}
              className="gap-1.5"
            >
              <Building className="size-3.5" /> Vendors Directory
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewBillOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> New Vendor Bill
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Filter Card */}
      <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
          <input
            type="text"
            placeholder="Search by bill #, vendor name, or items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-input border border-chalk/14 bg-court-700/60 pl-9 pr-4 text-xs text-chalk placeholder:text-chalk/40 focus:outline-none focus:ring-2 focus:ring-volt-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-input border border-chalk/14 bg-court-700/60 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </Card>

      <Table
        columns={columns}
        data={filteredBills}
        keyExtractor={(b) => b.id}
        emptyTitle="No vendor bills found"
        emptySubtitle="Try adjusting the search query or status filter."
      />

      {/* Record Vendor Bill Payment Modal */}
      {payingBill && (
        <Modal
          isOpen={Boolean(payingBill)}
          onClose={() => setPayingBill(null)}
          title={
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-volt-400" />
              <span>Record Payment for Bill {payingBill.billNumber}</span>
            </div>
          }
          maxWidth="md"
        >
          <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
            <div className="rounded-lg bg-court-700/60 p-3 border border-chalk/10 space-y-1">
              <p className="font-semibold text-chalk">{payingBill.vendorName}</p>
              <div className="flex justify-between text-chalk/70">
                <span>Bill Total:</span>
                <span className="font-mono">{formatCurrency(payingBill.amount)}</span>
              </div>
              <div className="flex justify-between text-rose-400 font-bold">
                <span>Balance Due:</span>
                <span className="font-mono">
                  {formatCurrency(payingBill.amount - payingBill.paidAmount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Disbursement Amount (INR) <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="any"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full h-10 rounded-input border border-chalk/14 bg-court-600 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
              >
                <option value="BANK_TRANSFER">Bank NEFT/RTGS</option>
                <option value="UPI">Company UPI</option>
                <option value="CARD">Corporate Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Bank UTR / Cheque / Ref Number
              </label>
              <Input
                placeholder="e.g. UTR-9921008129"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
              <Button type="button" variant="secondary" onClick={() => setPayingBill(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Disbursement
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* New Vendor Bill Modal */}
      <Modal
        isOpen={isNewBillOpen}
        onClose={() => setIsNewBillOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-volt-400" />
            <span>Enter Vendor Bill</span>
          </div>
        }
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-chalk/80 mb-1">Select Vendor</label>
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="w-full h-10 rounded-input border border-chalk/14 bg-court-600 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.gstin || "Unregistered"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Vendor Bill Number <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="e.g. INV-99120"
                value={billNum}
                onChange={(e) => setBillNum(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Bill Total Amount (inc. Tax) <span className="text-danger">*</span>
              </label>
              <Input
                type="number"
                min="1"
                step="any"
                placeholder="e.g. 45000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Bill Date</label>
              <Input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-chalk/80 mb-1">
              Procured Items / Services Description
            </label>
            <Input
              placeholder="e.g. Consignment of 50x badminton shuttlecock tubes & court grips"
              value={itemsDesc}
              onChange={(e) => setItemsDesc(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button type="button" variant="secondary" onClick={() => setIsNewBillOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Vendor Bill
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
