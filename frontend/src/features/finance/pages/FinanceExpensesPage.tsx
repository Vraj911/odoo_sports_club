import { useState, useMemo, useRef } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  useFinanceStore,
  formatCurrency,
  recordExpense,
} from "../financeStore";
import type { ExpenseRecord, ExpenseCategory } from "../types";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { formatINR } from "@/components/shared/Money";
import { useGo } from "@/app/router/links";
import {
  Wallet,
  Plus,
  Upload,
  FileText,
  DollarSign,
  AlertTriangle,
  Building,
  CheckCircle2,
  PieChart as PieChartIcon,
  Tag,
  Paperclip,
  X,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { cn } from "@/lib/cn";

const CATEGORIES: ExpenseCategory[] = [
  "rent",
  "utilities",
  "maintenance",
  "supplies",
  "marketing",
  "other",
];

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: "#f87171",
  utilities: "#fbbf24",
  maintenance: "#60a5fa",
  supplies: "#34d399",
  marketing: "#c084fc",
  other: "#94a3b8",
};

export default function FinanceExpensesPage() {
  const go = useGo();
  const { expenses, vendorBills } = useFinanceStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("supplies");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0] || "");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PENDING">("PAID");
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER" | "UPI" | "CARD">("UPI");
  const [vendorName, setVendorName] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [filterCat, setFilterCat] = useState<string>("ALL");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filterCat !== "ALL" && e.category !== filterCat) return false;
      return true;
    });
  }, [expenses, filterCat]);

  // Category Breakdown for Chart
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([cat, amt]) => ({
      name: cat.toUpperCase(),
      amount: amt,
      color: CATEGORY_COLORS[cat as ExpenseCategory] || "#94a3b8",
    }));
  }, [expenses]);

  // "What the Club Owes" Calculations
  const whatTheClubOwes = useMemo(() => {
    const unpaidBillsTotal = vendorBills
      .filter((b) => b.status !== "PAID")
      .reduce((sum, b) => sum + (b.amount - b.paidAmount), 0);

    const salariesPayable = 340000; // Realistic staff & coach salaries accrued for month end
    const taxesPayableGst = 84500; // Net GST payable to CBIC
    const grandTotalOwed = unpaidBillsTotal + salariesPayable + taxesPayableGst;

    return {
      unpaidBillsTotal,
      salariesPayable,
      taxesPayableGst,
      grandTotalOwed,
      aging0to30: unpaidBillsTotal * 0.75,
      aging31Plus: unpaidBillsTotal * 0.25,
    };
  }, [vendorBills]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;
    if (!description.trim() || !vendorName.trim()) return;

    recordExpense({
      category,
      description: description.trim(),
      amount: parsedAmount,
      date,
      paymentStatus,
      method,
      vendorName: vendorName.trim(),
      billNumber: billNumber.trim() || undefined,
      receiptFileName: attachedFile || undefined,
      recordedBy: "Sunita Deshmukh (Finance Head)",
      notes: notes.trim() || undefined,
    });

    // Reset Form
    setIsFormOpen(false);
    setDescription("");
    setAmount("");
    setVendorName("");
    setBillNumber("");
    setAttachedFile(null);
    setNotes("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachedFile(e.dataTransfer.files[0].name);
    }
  };

  const columns: Column<ExpenseRecord>[] = [
    {
      key: "id",
      header: "Expense ID / Date",
      render: (e) => (
        <div>
          <span className="font-mono font-bold text-volt-400">{e.id}</span>
          <p className="text-[11px] text-chalk/60 font-mono">{e.date}</p>
        </div>
      ),
    },
    {
      key: "description",
      header: "Description / Vendor",
      render: (e) => (
        <div>
          <p className="font-semibold text-chalk">{e.description}</p>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-chalk/60">
            <span className="flex items-center gap-1">
              <Building className="size-3" /> {e.vendorName}
            </span>
            {e.billNumber && (
              <span className="font-mono text-chalk/50">Bill: {e.billNumber}</span>
            )}
            {e.receiptFileName && (
              <span className="text-volt-400 flex items-center gap-1 font-mono">
                <Paperclip className="size-3" /> {e.receiptFileName}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (e) => (
        <span
          className="inline-flex rounded-pill px-2.5 py-0.5 text-[11px] font-semibold capitalize border"
          style={{
            borderColor: `${CATEGORY_COLORS[e.category]}40`,
            backgroundColor: `${CATEGORY_COLORS[e.category]}18`,
            color: CATEGORY_COLORS[e.category],
          }}
        >
          {e.category}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (e) => (
        <span className="font-mono text-xs text-chalk/80">{e.method.replace("_", " ")}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (e) => (
        <span className="font-mono text-sm font-bold text-rose-300">
          {formatINR(e.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (e) => (
        <StatusPill tone={e.paymentStatus === "PAID" ? "success" : "warning"}>
          {e.paymentStatus}
        </StatusPill>
      ),
    },
    {
      key: "recordedBy",
      header: "Recorded By",
      render: (e) => <span className="text-xs text-chalk/60">{e.recordedBy}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operating Expenses"
        subtitle="Facility rent, utility outlays, court turf repairs, F&B supplies, and payables obligation tracking (FIN-09, BR-14)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/finance/vendor-bills")}
              className="gap-1.5"
            >
              <FileText className="size-3.5" /> Vendor Bills
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsFormOpen((s) => !s)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> {isFormOpen ? "Close Form" : "Record Expense"}
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* "What the Club Owes" Summary Cards */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-chalk/60 px-1">
          What the Club Owes (Liabilities & Payables)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-rose-500/20 bg-court-600">
            <p className="text-xs font-semibold text-chalk/70 uppercase">
              Total Payables (Grand Total)
            </p>
            <p className="mt-1 text-2xl font-bold font-mono text-rose-400">
              {formatCurrency(whatTheClubOwes.grandTotalOwed)}
            </p>
            <p className="text-[11px] text-chalk/60 mt-1">Aggregated across all obligations</p>
          </Card>

          <Card className="p-5 bg-court-600">
            <p className="text-xs font-semibold text-chalk/70 uppercase">Vendor Bills Payable</p>
            <p className="mt-1 text-xl font-bold font-mono text-chalk">
              {formatCurrency(whatTheClubOwes.unpaidBillsTotal)}
            </p>
            <p className="text-[11px] text-chalk/60 mt-1">
              0–30d: {formatINR(whatTheClubOwes.aging0to30)} • 31+d: {formatINR(whatTheClubOwes.aging31Plus)}
            </p>
          </Card>

          <Card className="p-5 bg-court-600">
            <p className="text-xs font-semibold text-chalk/70 uppercase">Salaries & Payroll Accrued</p>
            <p className="mt-1 text-xl font-bold font-mono text-chalk">
              {formatCurrency(whatTheClubOwes.salariesPayable)}
            </p>
            <p className="text-[11px] text-chalk/60 mt-1">Front desk, coaches & maintenance staff</p>
          </Card>

          <Card className="p-5 bg-court-600">
            <p className="text-xs font-semibold text-chalk/70 uppercase">Taxes Payable (GST Output)</p>
            <p className="mt-1 text-xl font-bold font-mono text-amber-300">
              {formatCurrency(whatTheClubOwes.taxesPayableGst)}
            </p>
            <p className="text-[11px] text-chalk/60 mt-1">Net payable to Government (GSTR-3B)</p>
          </Card>
        </div>
      </div>

      {/* Record Expense Collapsible Form */}
      {isFormOpen && (
        <Card className="p-6 border-volt-400/30 bg-court-600/90 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
            <h3 className="text-base font-bold text-chalk flex items-center gap-2">
              <Wallet className="size-4 text-volt-400" /> Record Operating Disbursement
            </h3>
            <span className="text-xs text-chalk/60 font-mono">FIN-09 Compliant</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-chalk/80 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full h-10 rounded-input border border-chalk/14 bg-court-700 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400 capitalize"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-chalk/80 mb-1">
                  Amount (INR) <span className="text-danger">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-chalk/80 mb-1">Disbursement Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-chalk/80 mb-1">
                  Description / Purpose <span className="text-danger">*</span>
                </label>
                <Input
                  placeholder="e.g. Floodlight bulbs replacement for Outdoor Tennis Courts"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-chalk/80 mb-1">
                  Vendor / Payee Name <span className="text-danger">*</span>
                </label>
                <Input
                  placeholder="e.g. ProTurf Technologies"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-chalk/80 mb-1">Payment Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full h-10 rounded-input border border-chalk/14 bg-court-700 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="CARD">Corporate Card</option>
                  <option value="CASH">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-chalk/80 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as any)}
                  className="w-full h-10 rounded-input border border-chalk/14 bg-court-700 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-chalk/80 mb-1">
                  Vendor Bill / Invoice #
                </label>
                <Input
                  placeholder="e.g. PT-INV-9921"
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                />
              </div>
            </div>

            {/* FileDropzone Bill Image Attachment */}
            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Attachment (Vendor Bill / Image Receipt)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-colors",
                  isDragging
                    ? "border-volt-400 bg-volt-400/10 text-volt-400"
                    : "border-chalk/20 bg-court-700/40 text-chalk/70 hover:border-volt-400/50 hover:bg-court-700"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachedFile(e.target.files[0].name);
                    }
                  }}
                />
                <Upload className="size-6 text-chalk/40 mb-1" />
                <p className="font-semibold text-xs text-chalk">
                  {attachedFile ? (
                    <span className="text-volt-400 font-mono flex items-center gap-1">
                      <Paperclip className="size-3.5" /> {attachedFile}
                    </span>
                  ) : (
                    "Drag & drop invoice PDF/image here, or browse files"
                  )}
                </p>
                <p className="text-[10px] text-chalk/50 mt-0.5">PNG, JPG, or PDF up to 10MB</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="gap-2">
                <CheckCircle2 className="size-4" /> Save Expense Record
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Category Chart & Table Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Breakdown Donut */}
        <Card className="p-6 lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-chalk">Expenses by Category</h3>
            <span className="text-xs text-chalk/60 font-mono">
              {formatINR(expenses.reduce((s, e) => s + e.amount, 0))}
            </span>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {categoryData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]?.payload as { name: string; amount: number } | undefined;
                      if (!data) return null;
                      return (
                        <div className="rounded-lg border border-chalk/14 bg-court-700 p-2.5 text-xs text-chalk shadow-lg">
                          <p className="font-bold text-volt-400">{data.name}</p>
                          <p className="font-mono">{formatCurrency(data.amount)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 border-t border-chalk/10 pt-3">
            {categoryData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-chalk/80">{item.name}</span>
                </div>
                <span className="font-mono font-medium text-chalk">
                  {formatINR(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Expenses Table */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-chalk/60 uppercase">Filter Category:</span>
              <button
                onClick={() => setFilterCat("ALL")}
                className={cn(
                  "rounded-pill px-3 py-1 text-xs font-medium border",
                  filterCat === "ALL"
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold"
                    : "bg-court-700/60 border-chalk/10 text-chalk/70"
                )}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className={cn(
                    "rounded-pill px-3 py-1 text-xs font-medium border capitalize",
                    filterCat === c
                      ? "bg-volt-400 text-ink-900 border-volt-400 font-bold"
                      : "bg-court-700/60 border-chalk/10 text-chalk/70"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/finance/vendor-bills")}
              className="gap-1.5 text-xs"
            >
              Vendor Bills <ArrowRight className="size-3" />
            </Button>
          </Card>

          <Table
            columns={columns}
            data={filteredExpenses}
            keyExtractor={(e) => e.id}
            emptyTitle="No expenses found"
            emptySubtitle="No expenses recorded under the selected category."
          />
        </div>
      </div>
    </div>
  );
}
