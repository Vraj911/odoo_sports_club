import { useState } from "react";
import { Receipt, FileText, Download, CreditCard, ChevronRight, CheckCircle2, Wallet, ArrowDownLeft } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Money } from "@/components/shared/Money";
import { useMember } from "@/features/member/memberStore";
import { useToast } from "@/components/ui/Toast";
import type { Invoice } from "@/features/member/types";

interface MemberPaymentRecord {
  id: string;
  receiptNumber: string;
  date: string;
  invoiceNumber: string;
  method: string;
  amount: number;
  status: "Success" | "Processing";
}

const SAMPLE_PAYMENTS: MemberPaymentRecord[] = [
  {
    id: "pay-1",
    receiptNumber: "RCP-2026-8891",
    date: "15 Oct 2026 · 11:20",
    invoiceNumber: "INV-2026-001",
    method: "UPI (Google Pay / HDFC)",
    amount: 14750,
    status: "Success",
  },
  {
    id: "pay-2",
    receiptNumber: "RCP-2026-8714",
    date: "08 Oct 2026 · 17:45",
    invoiceNumber: "INV-2026-003",
    method: "Credit Card (Visa •••• 4012)",
    amount: 4720,
    status: "Success",
  },
  {
    id: "pay-3",
    receiptNumber: "RCP-2026-8602",
    date: "01 Oct 2026 · 09:15",
    invoiceNumber: "INV-2026-004",
    method: "Desk Cash Receipt",
    amount: 1800,
    status: "Success",
  },
];

export default function InvoicesPage() {
  const { invoices, payInvoice } = useMember();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");

  const handlePayNow = (inv: Invoice, e: React.MouseEvent) => {
    e.preventDefault();
    payInvoice(inv.id);
    toast.success("Payment Received", `Invoice #${inv.number} was paid online. Receipt updated.`);
  };

  const handleDownloadPDF = (inv: Invoice, e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Invoice Downloaded", `Saved PDF for ${inv.number}.`);
  };

  const handleDownloadReceipt = (receiptNumber: string) => {
    toast.info("Payment Receipt", `Saved receipt document ${receiptNumber}.`);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border-b border-chalk/10 pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <Receipt className="size-6 text-volt-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              Invoices & Billing History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Official GST tax invoices for memberships, court bookings, bar tabs, and payment transactions.
          </p>
        </div>
      </div>

      {/* Tabs: [ Invoices | Payments ] */}
      <div className="flex items-center gap-2 border-b border-chalk/10 pb-4">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex items-center gap-2 rounded-pill px-5 py-2 text-xs font-semibold transition-all ${
            activeTab === "invoices"
              ? "bg-volt-400 text-ink-900 shadow-md"
              : "border border-chalk/14 bg-chalk/6 text-chalk/70 hover:text-chalk hover:bg-chalk/10"
          }`}
        >
          <Receipt className="size-4" />
          <span>Invoices</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "invoices" ? "bg-ink-900 text-volt-400" : "bg-volt-400/20 text-volt-300"
            }`}
          >
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 rounded-pill px-5 py-2 text-xs font-semibold transition-all ${
            activeTab === "payments"
              ? "bg-volt-400 text-ink-900 shadow-md"
              : "border border-chalk/14 bg-chalk/6 text-chalk/70 hover:text-chalk hover:bg-chalk/10"
          }`}
        >
          <Wallet className="size-4" />
          <span>Payments</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
              activeTab === "payments" ? "bg-ink-900 text-volt-400" : "bg-volt-400/20 text-volt-300"
            }`}
          >
            {SAMPLE_PAYMENTS.length}
          </span>
        </button>
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === "invoices" && (
        <div className="rounded-[24px] border border-chalk/14 bg-court-500 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-court-700/60 border-b border-chalk/10 text-[11px] font-semibold uppercase tracking-wider text-chalk/60">
                  <th className="py-4 px-6">Invoice Number</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chalk/8">
                {invoices.map((inv) => {
                  const isPaid = inv.status === "PAID";

                  return (
                    <tr key={inv.id} className="hover:bg-white/4 transition-colors">
                      <td className="py-4 px-6 font-mono font-semibold text-chalk">
                        <AppLink
                          to={`/app/invoices/${inv.id}`}
                          className="hover:text-volt-400 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="size-3.5 text-volt-400 shrink-0" />
                          <span>{inv.number}</span>
                        </AppLink>
                      </td>

                      <td className="py-4 px-4 font-mono text-chalk/70">
                        {inv.date}
                      </td>

                      <td className="py-4 px-4">
                        <span className="rounded-md bg-chalk/8 px-2 py-0.5 text-[10px] font-mono text-chalk/80">
                          {inv.category.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <StatusPill
                          variant={
                            isPaid
                              ? "success"
                              : inv.status === "SENT"
                              ? "warning"
                              : inv.status === "OVERDUE"
                              ? "danger"
                              : "neutral"
                          }
                          className="text-[10px]"
                        >
                          {inv.status}
                        </StatusPill>
                      </td>

                      <td className="py-4 px-4 text-right font-mono font-bold text-chalk text-sm">
                        <Money amount={inv.total} />
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => handlePayNow(inv, e)}
                              className="text-xs h-7 px-2.5"
                            >
                              Pay Now
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDownloadPDF(inv, e)}
                            leftIcon={<Download className="size-3" />}
                            className="text-xs h-7 px-2"
                          >
                            PDF
                          </Button>

                          <AppLink to={`/app/invoices/${inv.id}`}>
                            <Button variant="secondary" size="sm" className="text-xs h-7 px-2.5">
                              View
                            </Button>
                          </AppLink>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS HISTORY TABLE */}
      {activeTab === "payments" && (
        <div className="rounded-[24px] border border-chalk/14 bg-court-500 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-chalk/10">
            <h3 className="text-base font-semibold text-chalk">Payment Transaction History</h3>
            <p className="text-xs text-chalk/60">
              Receipt of all settled digital and in-person payments credited to your club account.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-court-700/60 border-b border-chalk/10 text-[11px] font-semibold uppercase tracking-wider text-chalk/60">
                  <th className="py-4 px-6">Receipt #</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Reference Invoice</th>
                  <th className="py-4 px-4">Payment Method</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Amount Paid</th>
                  <th className="py-4 px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chalk/8">
                {SAMPLE_PAYMENTS.map((pay) => (
                  <tr key={pay.id} className="hover:bg-chalk/4 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-volt-400">
                      {pay.receiptNumber}
                    </td>
                    <td className="py-4 px-4 text-chalk/80">{pay.date}</td>
                    <td className="py-4 px-4 font-mono text-chalk font-medium">
                      {pay.invoiceNumber}
                    </td>
                    <td className="py-4 px-4">
                      <span className="rounded-pill bg-chalk/8 px-2.5 py-1 text-[11px] text-chalk/80">
                        {pay.method}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusPill variant="success" showDot className="text-[10px]">
                        {pay.status}
                      </StatusPill>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold text-chalk text-sm">
                      <Money amount={pay.amount} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownloadReceipt(pay.receiptNumber)}
                        leftIcon={<Download className="size-3" />}
                        className="text-xs h-7 px-2"
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
