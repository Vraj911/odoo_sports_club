import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import { useFinanceStore, formatCurrency } from "../financeStore";
import type { PaymentRecord, PaymentSource, PaymentMethod, PaymentStatus } from "../types";
import { PaymentDrawer } from "../components/PaymentDrawer";
import { RecordPaymentModal } from "../components/RecordPaymentModal";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { formatINR } from "@/components/shared/Money";
import {
  HandCoins,
  Search,
  Filter,
  Plus,
  Download,
  Receipt,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  CreditCard,
  Building,
} from "lucide-react";
import { cn } from "@/lib/cn";

const SOURCES: (PaymentSource | "ALL")[] = [
  "ALL",
  "COURT",
  "MEMBERSHIP",
  "SHOP",
  "BAR",
  "OTHER",
];
const METHODS: (PaymentMethod | "ALL")[] = ["ALL", "CASH", "CARD", "UPI", "ONLINE"];

export default function FinancePaymentsPage() {
  const { payments } = useFinanceStore();

  const [search, setSearch] = useState("");
  const [selectedSource, setSelectedSource] = useState<PaymentSource | "ALL">("ALL");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | "ALL">("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (selectedSource !== "ALL" && p.source !== selectedSource) return false;
      if (selectedMethod !== "ALL" && p.method !== selectedMethod) return false;
      if (selectedStatus !== "ALL" && p.status !== selectedStatus) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          p.id.toLowerCase().includes(q) ||
          p.ref.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          (p.invoiceId && p.invoiceId.toLowerCase().includes(q)) ||
          (p.orderId && p.orderId.toLowerCase().includes(q)) ||
          (p.gatewayTxnId && p.gatewayTxnId.toLowerCase().includes(q)) ||
          p.receivedBy.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [payments, selectedSource, selectedMethod, selectedStatus, search]);

  // Summary strip metrics
  const summary = useMemo(() => {
    const totalCollected = filteredPayments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = filteredPayments.reduce(
      (sum, p) => sum + (p.refundedAmount || 0),
      0
    );

    // By source
    const bySource: Record<string, number> = {};
    // By method
    const byMethod: Record<string, number> = {};

    filteredPayments.forEach((p) => {
      if (p.status === "COMPLETED") {
        bySource[p.source] = (bySource[p.source] || 0) + p.amount;
        byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
      }
    });

    return {
      totalCollected,
      totalRefunded,
      bySource,
      byMethod,
      count: filteredPayments.length,
    };
  }, [filteredPayments]);

  const columns: Column<PaymentRecord>[] = [
    {
      key: "time",
      header: "Timestamp / ID",
      render: (p) => (
        <div>
          <span className="font-mono font-bold text-volt-400">{p.id}</span>
          <p className="text-[11px] text-chalk/60">
            {new Date(p.timestamp).toLocaleString("en-IN", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ),
    },
    {
      key: "ref",
      header: "Reference / Gateway ID",
      render: (p) => (
        <div>
          <span className="font-mono text-xs font-semibold text-chalk">{p.ref}</span>
          {p.gatewayTxnId && (
            <p className="text-[11px] font-mono text-chalk/50">{p.gatewayTxnId}</p>
          )}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (p) => (
        <div>
          <span className="font-medium text-chalk">{p.customerName}</span>
          {p.customerPhone && (
            <p className="text-[11px] text-chalk/60 font-mono">{p.customerPhone}</p>
          )}
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (p) => (
        <span className="inline-flex rounded bg-court-700 px-2 py-0.5 text-[11px] font-semibold text-chalk/90 border border-chalk/10">
          {p.source}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (p) => (
        <span className="font-mono text-xs font-medium text-chalk/80">{p.method}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (p) => (
        <div>
          <span className="font-mono text-sm font-bold text-chalk">
            {formatINR(p.amount)}
          </span>
          {p.refundedAmount && p.refundedAmount > 0 && (
            <p className="text-[10px] font-mono text-warning">
              - {formatINR(p.refundedAmount)} ref
            </p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => {
        const tone =
          p.status === "COMPLETED"
            ? "success"
            : p.status === "FAILED"
            ? "danger"
            : p.status === "FAILED_RETRIED"
            ? "info"
            : "warning";
        return (
          <StatusPill tone={tone} className="capitalize">
            {p.status === "FAILED_RETRIED" ? "Failed → Retried" : p.status.replace("_", " ")}
          </StatusPill>
        );
      },
    },
    {
      key: "links",
      header: "Linked Order",
      render: (p) => (
        <div className="text-xs">
          {p.invoiceId && (
            <span className="font-mono font-semibold text-volt-400 block">{p.invoiceId}</span>
          )}
          {p.orderId && <span className="font-mono text-chalk/60 block">{p.orderId}</span>}
          {!p.invoiceId && !p.orderId && <span className="text-chalk/40 italic">—</span>}
        </div>
      ),
    },
    {
      key: "receivedBy",
      header: "Received By",
      render: (p) => (
        <span className="text-xs text-chalk/70 truncate max-w-[140px] block">
          {p.receivedBy}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (p) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedPayment(p)}
          className="h-7 px-2.5 text-xs gap-1"
        >
          <Eye className="size-3" /> View
        </Button>
      ),
    },
  ];

  const handleExportCSV = () => {
    const headers = [
      "Payment ID",
      "Timestamp",
      "Ref",
      "Customer",
      "Source",
      "Method",
      "Amount",
      "Status",
      "Invoice ID",
      "Order ID",
      "Received By",
    ];
    const rows = filteredPayments.map((p) => [
      p.id,
      p.timestamp,
      `"${p.ref}"`,
      `"${p.customerName}"`,
      p.source,
      p.method,
      p.amount,
      p.status,
      p.invoiceId || "",
      p.orderId || "",
      `"${p.receivedBy}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CCMS_Payments_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments Ledger"
        subtitle="Unified multi-channel receipt ledger tagged by origin (courts, membership, pro shop, bar) and gateway references."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="size-3.5" /> Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsRecordModalOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-3.5" /> Record Manual Payment
            </Button>
          </div>
        }
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-chalk/14 bg-court-600 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-chalk/60">
            Total Net Receipts
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-volt-400">
            {formatCurrency(summary.totalCollected)}
          </p>
          <p className="mt-1 text-[11px] text-chalk/60">
            Across {summary.count} filtered transactions
          </p>
        </div>

        <div className="rounded-2xl border border-chalk/14 bg-court-600 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-chalk/60">
            Total Refunded
          </p>
          <p className="mt-1 text-2xl font-bold font-mono text-warning">
            {formatCurrency(summary.totalRefunded)}
          </p>
          <p className="mt-1 text-[11px] text-chalk/60">Audited cancellations / weather refunds</p>
        </div>

        {/* By Source Summary */}
        <div className="rounded-2xl border border-chalk/14 bg-court-600 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-chalk/60 mb-1.5">
            Top Sources
          </p>
          <div className="space-y-1 text-xs">
            {Object.entries(summary.bySource).map(([src, amt]) => (
              <div key={src} className="flex justify-between items-center">
                <span className="text-chalk/70">{src}:</span>
                <span className="font-mono font-medium text-chalk">{formatINR(amt)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Method Summary */}
        <div className="rounded-2xl border border-chalk/14 bg-court-600 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-chalk/60 mb-1.5">
            Top Methods
          </p>
          <div className="space-y-1 text-xs">
            {Object.entries(summary.byMethod).map(([mth, amt]) => (
              <div key={mth} className="flex justify-between items-center">
                <span className="text-chalk/70">{mth}:</span>
                <span className="font-mono font-medium text-chalk">{formatINR(amt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Controls Card */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
            <input
              type="text"
              placeholder="Search by ID, ref, customer name, order, gateway txn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-input border border-chalk/14 bg-court-700/60 pl-9 pr-4 text-xs text-chalk placeholder:text-chalk/40 focus:outline-none focus:ring-2 focus:ring-volt-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-10 rounded-input border border-chalk/14 bg-court-700/60 px-3 text-xs text-chalk focus:outline-none focus:ring-2 focus:ring-volt-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="FAILED_RETRIED">Failed → Retried</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Chips for Source and Method */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t border-chalk/10 pt-3">
          {/* Source Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase text-chalk/50 mr-1">Source:</span>
            {SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSource(s)}
                className={cn(
                  "rounded-pill px-3 py-1 text-xs font-medium transition-all border",
                  selectedSource === s
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-semibold shadow-volt"
                    : "bg-court-700/50 border-chalk/10 text-chalk/70 hover:text-chalk"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Method Chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold uppercase text-chalk/50 mr-1">Method:</span>
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMethod(m)}
                className={cn(
                  "rounded-pill px-3 py-1 text-xs font-medium transition-all border",
                  selectedMethod === m
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-semibold shadow-volt"
                    : "bg-court-700/50 border-chalk/10 text-chalk/70 hover:text-chalk"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Ledger Table */}
      <Table
        columns={columns}
        data={filteredPayments}
        keyExtractor={(p) => p.id}
        emptyTitle="No payments found"
        emptySubtitle="Try adjusting the search query, source, or payment method filters."
      />

      {/* Slide-out Drawer for Selected Payment */}
      <PaymentDrawer
        payment={selectedPayment}
        isOpen={Boolean(selectedPayment)}
        onClose={() => setSelectedPayment(null)}
      />

      {/* Record Manual Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />
    </div>
  );
}
