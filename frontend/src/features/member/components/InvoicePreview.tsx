import { Printer, Download, CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/shared/Money";
import type { Invoice, MemberProfile } from "@/features/member/types";
import { cn } from "@/lib/cn";

export interface InvoicePreviewProps {
  invoice: Invoice;
  member: MemberProfile;
  onPayNow?: (() => void) | undefined;
}

export function InvoicePreview({ invoice, member, onPayNow }: InvoicePreviewProps) {
  const isPaid = invoice.status === "PAID";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-chalk/70">
          <FileText className="size-4 text-volt-400" />
          <span>GST TAX INVOICE · #{invoice.number}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="size-3.5" />}
            className="text-xs h-8"
          >
            Print
          </Button>

          {!isPaid && onPayNow && (
            <Button
              variant="primary"
              size="sm"
              onClick={onPayNow}
              className="text-xs h-8"
            >
              Pay Now · <Money amount={invoice.total} />
            </Button>
          )}
        </div>
      </div>

      {/* White Paper Surface */}
      <div className="relative rounded-2xl bg-white p-6 sm:p-8 text-neutral-900 shadow-2xl font-sans text-xs border border-neutral-200">
        {/* Paid Stamp Watermark */}
        {isPaid && (
          <div className="absolute right-8 top-10 rotate-[-12deg] rounded-xl border-4 border-emerald-600 px-4 py-1.5 text-center text-emerald-600 font-extrabold text-xl tracking-widest uppercase opacity-85 select-none pointer-events-none">
            PAID
          </div>
        )}

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-b border-neutral-200 pb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight text-neutral-950 uppercase">
              Champions Club
            </h2>
            <p className="text-[11px] text-neutral-600 mt-1 leading-relaxed">
              Champions Club Management Pvt. Ltd.<br />
              Plot 42, Bandra-Kurla Complex (BKC), Bandra East<br />
              Mumbai, Maharashtra — 400051<br />
              <strong className="text-neutral-900">GSTIN:</strong> 27AABCC1234F1Z5 ·{" "}
              <strong className="text-neutral-900">PAN:</strong> AABCC1234F
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Tax Invoice
            </span>
            <div className="text-base font-bold font-mono text-neutral-950">{invoice.number}</div>
            <p className="text-[11px] text-neutral-600 font-mono">
              Date: {invoice.date}
            </p>
            <p className="text-[11px] text-neutral-600 font-mono">
              Due Date: {invoice.dueDate}
            </p>
            <div className="pt-1">
              <span
                className={cn(
                  "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase font-mono tracking-wider",
                  isPaid
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                )}
              >
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Billed To / Member Details */}
        <div className="my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-neutral-50 p-4 border border-neutral-150">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Billed To
            </span>
            <h4 className="font-bold text-neutral-900 text-sm">{member.name}</h4>
            <p className="text-neutral-600 text-[11px] mt-0.5 leading-relaxed">
              Member ID: <span className="font-mono font-semibold">{member.id}</span> ({member.tier} Member)<br />
              {member.address}<br />
              Phone: {member.phone} · Email: {member.email}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
              Payment & Place of Supply
            </span>
            <p className="text-neutral-600 text-[11px] leading-relaxed">
              Place of Supply: Maharashtra (27)<br />
              Reverse Charge: No<br />
              Category: {invoice.category.replace("_", " ")}<br />
              {invoice.paymentMethod && (
                <span className="font-semibold text-neutral-900 block mt-0.5">
                  Method: {invoice.paymentMethod}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-300 text-[11px] uppercase tracking-wider text-neutral-600 font-bold">
                <th className="py-2.5 pr-3">Item Description</th>
                <th className="py-2.5 px-3 text-center">HSN/SAC</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate</th>
                <th className="py-2.5 pl-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="text-neutral-800">
                  <td className="py-3 pr-3 font-medium">{item.description}</td>
                  <td className="py-3 px-3 text-center font-mono text-neutral-500">{item.hsn}</td>
                  <td className="py-3 px-3 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    <Money amount={item.unitPrice} />
                  </td>
                  <td className="py-3 pl-3 text-right font-mono font-semibold">
                    <Money amount={item.amount} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & GST Breakup */}
        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-6 border-t-2 border-neutral-300 pt-4">
          <div className="text-[11px] text-neutral-500 space-y-1 max-w-xs">
            <p className="font-semibold text-neutral-700">Tax Breakdown Notice:</p>
            <p>
              GST charged at standard rate: CGST (9%) + SGST (9%) for intra-state supply of sporting club services.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between text-neutral-600">
              <span>Taxable Value:</span>
              <span><Money amount={invoice.subtotal} /></span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>CGST @ 9%:</span>
              <span><Money amount={invoice.cgst} /></span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>SGST @ 9%:</span>
              <span><Money amount={invoice.sgst} /></span>
            </div>
            <div className="flex justify-between border-t border-neutral-300 pt-2 text-sm font-bold text-neutral-950">
              <span>Grand Total:</span>
              <span className="text-base text-emerald-700">
                <Money amount={invoice.total} />
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-neutral-200 pt-4 text-[10px] text-neutral-500 text-center">
          This is a computer-generated tax invoice issued in accordance with Section 31 of the CGST Act, 2017. No signature required.
        </div>
      </div>
    </div>
  );
}
