import { useState } from "react";
import { Receipt, FileText, Download, CreditCard, ChevronRight, CheckCircle2 } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Money } from "@/components/shared/Money";
import { useMember } from "@/features/member/memberStore";
import { useToast } from "@/components/ui/Toast";
import type { Invoice } from "@/features/member/types";

export default function InvoicesPage() {
  const { invoices, payInvoice } = useMember();
  const toast = useToast();

  const handlePayNow = (inv: Invoice, e: React.MouseEvent) => {
    e.preventDefault();
    payInvoice(inv.id);
    toast.success("Payment Received", `Invoice #${inv.number} was paid online. Receipt updated.`);
  };

  const handleDownloadPDF = (inv: Invoice, e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Invoice Downloaded", `Saved PDF for ${inv.number}.`);
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
            Official GST tax invoices for memberships, court bookings, bar tabs, and gear purchases.
          </p>
        </div>
      </div>

      {/* Invoices Table */}
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
    </div>
  );
}
