import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import {
  Wallet,
  Search,
  Download,
  Filter,
  CheckCircle2,
  DollarSign,
  Printer,
  ShieldCheck,
  Plus,
  RotateCcw,
  Ban,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { MemberSearch } from "../components/MemberSearch";
import { SAMPLE_DESK_PAYMENTS, DESK_MEMBERS } from "../sampleData";
import type { DeskPaymentRecord, DeskMember } from "../types";

export default function DeskPayments() {
  const navigate = useGo();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selected payment for detail drawer
  const [selectedPayment, setSelectedPayment] = useState<DeskPaymentRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Refund / Void ReasonDialog
  const [refundAction, setRefundAction] = useState<"REFUND" | "VOID" | null>(null);

  // Quick Take Payment Modal
  const [isTakePaymentOpen, setIsTakePaymentOpen] = useState(false);
  const [takePayMember, setTakePayMember] = useState<DeskMember | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payCategory, setPayCategory] = useState<"MEMBERSHIP" | "COURT" | "BAR" | "SHOP">("BAR");
  const [payMethod, setPayMethod] = useState<"Cash" | "UPI" | "Card">("UPI");
  const [payRef, setPayRef] = useState("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered dataset
  const filteredPayments = useMemo(() => {
    return SAMPLE_DESK_PAYMENTS.filter((p) => {
      if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
      if (methodFilter !== "ALL" && p.method !== methodFilter) return false;
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.memberName.toLowerCase().includes(q);
        const matchInvoice = p.invoiceNumber.toLowerCase().includes(q);
        const matchId = p.id.toLowerCase().includes(q);
        const matchMemId = p.memberId.toLowerCase().includes(q);
        if (!matchName && !matchInvoice && !matchId && !matchMemId) return false;
      }
      return true;
    });
  }, [searchQuery, categoryFilter, methodFilter, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Txn ID",
      "Invoice Number",
      "Date",
      "Member Name",
      "Member ID",
      "Category",
      "Amount",
      "Method",
      "Status",
      "Channel",
    ];

    const rows = filteredPayments.map((p) => [
      p.id,
      `"${p.invoiceNumber}"`,
      p.date,
      `"${p.memberName}"`,
      p.memberId,
      p.category,
      p.amount,
      p.method,
      p.status,
      p.source,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CCMS_Payments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (pay: DeskPaymentRecord) => {
    setSelectedPayment(pay);
    setIsDrawerOpen(true);
  };

  const handleConfirmRefund = (reason: string) => {
    if (!selectedPayment) return;
    selectedPayment.status = refundAction === "REFUND" ? "REFUNDED" : "VOID";
    setToastMessage(`Payment #${selectedPayment.id} marked as ${selectedPayment.status}. Reason audited.`);
    setRefundAction(null);
    setIsDrawerOpen(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRecordNewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const newRecord: DeskPaymentRecord = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceNumber: `CCMS/26-27/${Math.floor(1000 + Math.random() * 9000)}`,
      date: "2026-10-03",
      timestamp: Date.now(),
      memberId: takePayMember ? takePayMember.id : "GUEST",
      memberName: takePayMember ? takePayMember.name : "Walk-in Guest",
      category: payCategory,
      amount: amt,
      method: payMethod,
      status: "COMPLETED",
      source: "walk-in",
      reference: payRef || undefined,
    };

    SAMPLE_DESK_PAYMENTS.unshift(newRecord);

    // If clearing dues on member
    if (takePayMember && takePayMember.dues > 0) {
      takePayMember.dues = Math.max(0, takePayMember.dues - amt);
    }

    setIsTakePaymentOpen(false);
    setToastMessage(`Collected ₹${amt.toLocaleString("en-IN")} successfully. Invoice #${newRecord.invoiceNumber} generated.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const columns: Column<DeskPaymentRecord>[] = [
    {
      key: "invoice",
      header: "Invoice #",
      render: (p) => (
        <button
          type="button"
          onClick={() => handleRowClick(p)}
          className="font-mono text-xs text-volt-400 hover:underline font-semibold text-left"
        >
          {p.invoiceNumber}
          <span className="block text-[10px] text-white/50">{p.id}</span>
        </button>
      ),
    },
    {
      key: "member",
      header: "Member / Payer",
      render: (p) => (
        <div className="cursor-pointer" onClick={() => handleRowClick(p)}>
          <p className="font-semibold text-white">{p.memberName}</p>
          <p className="text-[11px] text-white/50 font-mono">{p.memberId}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      render: (p) => (
        <div>
          <p className="text-white text-xs">{p.date}</p>
          <p className="text-[10px] text-white/50">
            {new Date(p.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (p) => (
        <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-[11px] text-white/80 border border-white/10 uppercase font-mono">
          {p.category}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (p) => (
        <span className="font-mono font-bold text-volt-400">
          ₹{p.amount.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      render: (p) => (
        <span className="text-xs text-white/80">{p.method}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusPill variant={p.status === "COMPLETED" ? "success" : "danger"}>
          {p.status}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-pill bg-navy-800 border-l-4 border-volt-400 px-5 py-3 shadow-2xl text-sm font-medium text-white flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="size-4 text-volt-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="size-6 text-volt-400" />
            <span>Payments &amp; Collections Ledger</span>
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            Real-time front desk collection journal (Cash, UPI, POS Card, Tabs) with audited refund control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-xs"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => setIsTakePaymentOpen(true)}
            className="flex items-center gap-2 text-xs"
          >
            <Plus className="size-3.5" />
            <span>Take Payment / Settle Tab</span>
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 bg-court-600/70 border-white/10 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by payer name, invoice #, or transaction ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="size-4 text-white/40" />}
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
        >
          <option value="ALL" className="bg-navy-900 text-white">All Categories</option>
          <option value="MEMBERSHIP" className="bg-navy-900 text-white">Membership</option>
          <option value="COURT" className="bg-navy-900 text-white">Court Booking</option>
          <option value="BAR" className="bg-navy-900 text-white">Bar &amp; Cafe</option>
          <option value="SHOP" className="bg-navy-900 text-white">Pro Shop</option>
        </select>

        {/* Method Dropdown */}
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
        >
          <option value="ALL" className="bg-navy-900 text-white">All Methods</option>
          <option value="Cash" className="bg-navy-900 text-white">Cash</option>
          <option value="UPI" className="bg-navy-900 text-white">UPI QR</option>
          <option value="Card" className="bg-navy-900 text-white">Card POS</option>
          <option value="Member Tab" className="bg-navy-900 text-white">Member Tab</option>
        </select>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
        >
          <option value="ALL" className="bg-navy-900 text-white">All Statuses</option>
          <option value="COMPLETED" className="bg-navy-900 text-white">Completed</option>
          <option value="REFUNDED" className="bg-navy-900 text-white">Refunded</option>
          <option value="VOID" className="bg-navy-900 text-white">Void</option>
        </select>
      </Card>

      {/* Payments DataTable */}
      <Table
        columns={columns}
        data={filteredPayments}
        keyExtractor={(p) => p.id}
        emptyTitle="No payments found"
        emptySubtitle="Try adjusting the filter criteria or search query."
      />

      {/* Payment Detail Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span>Invoice #{selectedPayment?.invoiceNumber}</span>
            {selectedPayment && (
              <StatusPill variant={selectedPayment.status === "COMPLETED" ? "success" : "danger"}>
                {selectedPayment.status}
              </StatusPill>
            )}
          </div>
        }
        subtitle="GST invoice receipt &amp; settlement breakdown"
      >
        {selectedPayment && (
          <div className="flex flex-col gap-5">
            {/* Amount Banner */}
            <div className="p-5 rounded-2xl bg-volt-400/10 border border-volt-400/30 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-white/60">Amount Settled</p>
                <h3 className="text-2xl font-bold font-mono text-volt-400 mt-0.5">
                  ₹{selectedPayment.amount.toLocaleString("en-IN")}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-pill bg-white/10 text-white text-xs font-semibold">
                via {selectedPayment.method}
              </span>
            </div>

            {/* Payer Information */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div>
                <p className="text-white/60">Payer Name / ID</p>
                <p className="font-semibold text-white mt-0.5">{selectedPayment.memberName}</p>
                <p className="text-white/40 font-mono">{selectedPayment.memberId}</p>
              </div>
              {selectedPayment.memberId.startsWith("CC-") && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-volt-400"
                  onClick={() => navigate(`/desk/members/${selectedPayment.memberId}`)}
                >
                  Profile
                </Button>
              )}
            </div>

            {/* Tax & GST Breakdown */}
            <div className="p-4 rounded-xl bg-navy-950/60 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-white/70">
                <span>Base Taxable Value</span>
                <span className="font-mono">
                  ₹{Math.round(selectedPayment.amount / 1.18).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>CGST @ 9%</span>
                <span className="font-mono">
                  ₹{Math.round((selectedPayment.amount / 1.18) * 0.09).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-white/70">
                <span>SGST @ 9%</span>
                <span className="font-mono">
                  ₹{Math.round((selectedPayment.amount / 1.18) * 0.09).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2">
                <span>Total Invoice Value</span>
                <span className="font-mono text-volt-400">
                  ₹{selectedPayment.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => window.print()}
              >
                <Printer className="size-4 mr-2" />
                Print GST Tax Invoice Receipt
              </Button>

              {selectedPayment.status === "COMPLETED" && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    type="button"
                    variant="danger"
                    className="text-xs"
                    onClick={() => setRefundAction("REFUND")}
                  >
                    <RotateCcw className="size-3.5 mr-1" />
                    Refund (Audited)
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    className="text-xs"
                    onClick={() => setRefundAction("VOID")}
                  >
                    <Ban className="size-3.5 mr-1" />
                    Void Invoice
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Take Payment Modal */}
      <Modal
        isOpen={isTakePaymentOpen}
        onClose={() => setIsTakePaymentOpen(false)}
        title="Collect Payment at Desk"
        subtitle="Settle bar tabs, accept membership fees, or collect equipment charges"
      >
        <form onSubmit={handleRecordNewPayment} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-white/80 block mb-1">
              Select Member (or leave blank for guest)
            </label>
            <MemberSearch
              placeholder="Search member..."
              onSelectMember={(m) => setTakePayMember(m)}
            />
            {takePayMember && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 mt-2 flex justify-between text-xs">
                <span>Selected: {takePayMember.name} ({takePayMember.id})</span>
                <span className="text-warning font-mono">Dues: ₹{takePayMember.dues}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-white/80 block mb-1">Category</label>
              <select
                value={payCategory}
                onChange={(e) => setPayCategory(e.target.value as any)}
                className="w-full h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white"
              >
                <option value="BAR" className="bg-navy-900">Bar &amp; Cafe Tab</option>
                <option value="MEMBERSHIP" className="bg-navy-900">Membership Fee</option>
                <option value="COURT" className="bg-navy-900">Court Hire</option>
                <option value="SHOP" className="bg-navy-900">Pro Shop</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-white/80 block mb-1">Payment Method</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white"
              >
                <option value="Cash" className="bg-navy-900">Cash</option>
                <option value="UPI" className="bg-navy-900">UPI QR</option>
                <option value="Card" className="bg-navy-900">Card POS</option>
              </select>
            </div>
          </div>

          <Input
            label="Amount (INR) *"
            type="number"
            placeholder="e.g. 640"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            leftIcon={<DollarSign className="size-4" />}
            required
          />

          <Input
            label="Transaction Reference / Note (Optional)"
            placeholder="e.g. UPI-998822 or Handed Cash"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsTakePaymentOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Record &amp; Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Audited Refund / Void Dialog */}
      <ReasonDialog
        isOpen={Boolean(refundAction)}
        onClose={() => setRefundAction(null)}
        onConfirm={handleConfirmRefund}
        title={refundAction === "REFUND" ? "Audited Payment Refund" : "Void Invoice & Reverse Journal"}
        description="This action marks the invoice reversed. Mandatory audit justification required."
        actionLabel={refundAction === "REFUND" ? "Authorize Refund" : "Confirm Void"}
        variant="danger"
      />
    </div>
  );
}
