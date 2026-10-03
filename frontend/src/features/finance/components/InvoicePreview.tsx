import { useMemo } from "react";
import type { InvoiceRecord } from "../types";
import { formatCurrency } from "../financeStore";
import { formatINR } from "@/components/shared/Money";
import { Building2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";

// Convert number to Indian currency words
function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n] ?? "";
    if (n < 100) return (b[Math.floor(n / 10)] ?? "") + (n % 10 !== 0 ? " " + (a[n % 10] ?? "") : "");
    if (n < 1000)
      return (
        (a[Math.floor(n / 100)] ?? "") + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  }

  const integerPart = Math.floor(num);
  return `INR ${inWords(integerPart)} Only`;
}

export interface InvoicePreviewProps {
  invoice: InvoiceRecord;
  className?: string;
  showPrintButton?: boolean;
}

export function InvoicePreview({ invoice, className }: InvoicePreviewProps) {
  const wordsTotal = useMemo(() => numberToWords(invoice.totalAmount), [invoice.totalAmount]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-3xl rounded-xl bg-white p-8 sm:p-10 font-sans text-neutral-900 shadow-2xl transition-all duration-200 border border-neutral-200 print:border-none print:shadow-none",
        className
      )}
      id="printable-tax-invoice"
    >
      {/* VOID or PAID Watermark Stamp */}
      {invoice.status === "VOID" && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden">
          <div className="rotate-[-25deg] rounded-3xl border-8 border-red-600/40 px-12 py-3 text-6xl font-black uppercase tracking-widest text-red-600/40 select-none">
            VOID
          </div>
        </div>
      )}
      {invoice.status === "PAID" && (
        <div className="pointer-events-none absolute right-12 top-28 z-20 overflow-hidden">
          <div className="rotate-[-12deg] rounded-xl border-4 border-emerald-600/60 px-6 py-1.5 text-2xl font-black uppercase tracking-wider text-emerald-700/70 select-none">
            PAID IN FULL
          </div>
        </div>
      )}

      {/* Club Header & Brand */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between border-b-2 border-neutral-800 pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-900 text-white font-bold">
              <Building2 className="size-5 text-volt-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900">
                CHAMPIONS SPORTS CLUB
              </h2>
              <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Champions Recreational & Sports Facilities Pvt. Ltd.
              </p>
            </div>
          </div>
          <div className="mt-3 text-xs text-neutral-600 space-y-0.5">
            <p>Plot 42, Bandra-Kurla Complex, Bandra East</p>
            <p>Mumbai, Maharashtra 400051, India</p>
            <p className="font-semibold text-neutral-800">
              GSTIN: <span className="font-mono">27AAAAA0000A1Z5</span> · PAN: <span className="font-mono">AAAAA0000A</span>
            </p>
            <p>Email: accounts@championsclub.in · Tel: +91 22 6123 4500</p>
          </div>
        </div>

        <div className="sm:text-right">
          <span className="inline-block rounded bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            TAX INVOICE
          </span>
          <div className="mt-2 text-xs">
            <p className="text-neutral-500">Invoice No.</p>
            <p className="text-base font-bold font-mono text-neutral-900">{invoice.invoiceNumber}</p>
          </div>
          <div className="mt-2 text-xs space-y-0.5">
            <p>
              <span className="text-neutral-500">Invoice Date: </span>
              <span className="font-medium text-neutral-800">{invoice.date}</span>
            </p>
            <p>
              <span className="text-neutral-500">Due Date: </span>
              <span className="font-medium text-neutral-800">{invoice.dueDate}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bill To / Customer Details */}
      <div className="mt-6 rounded-lg bg-neutral-50 p-4 border border-neutral-200/80">
        <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Billed To</p>
        <div className="mt-1 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div>
            <p className="text-sm font-bold text-neutral-900">{invoice.customerName}</p>
            {invoice.customerAddress && (
              <p className="text-xs text-neutral-600 max-w-sm mt-0.5">{invoice.customerAddress}</p>
            )}
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-600">
              {invoice.customerEmail && <span>Email: {invoice.customerEmail}</span>}
              {invoice.customerPhone && <span>Phone: {invoice.customerPhone}</span>}
            </div>
          </div>
          {invoice.customerGstin && (
            <div className="sm:text-right mt-1 sm:mt-0">
              <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                <ShieldCheck className="size-3" /> B2B GST Registered
              </span>
              <p className="mt-1 text-xs font-mono font-medium text-neutral-800">
                GSTIN: {invoice.customerGstin}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-100 text-neutral-700 font-semibold uppercase text-[10px] tracking-wider border-b border-neutral-200">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-2 text-center">HSN/SAC</th>
              <th className="py-2.5 px-2 text-right">Qty</th>
              <th className="py-2.5 px-3 text-right">Rate</th>
              <th className="py-2.5 px-3 text-right">Taxable</th>
              <th className="py-2.5 px-2 text-right">GST %</th>
              <th className="py-2.5 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-neutral-800">
            {invoice.items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-neutral-50/50">
                <td className="py-2.5 px-3 text-neutral-400 font-mono">{idx + 1}</td>
                <td className="py-2.5 px-3 font-medium text-neutral-900">
                  {item.description}
                </td>
                <td className="py-2.5 px-2 text-center font-mono text-neutral-600">{item.hsn}</td>
                <td className="py-2.5 px-2 text-right font-mono">{item.qty}</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatINR(item.rate)}</td>
                <td className="py-2.5 px-3 text-right font-mono">{formatINR(item.taxableAmount)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{item.gstRate}%</td>
                <td className="py-2.5 px-3 text-right font-mono font-semibold">
                  {formatINR(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calculation & Tax Breakup Summary */}
      <div className="mt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
        {/* Left: Total in words & Bank info */}
        <div className="w-full sm:w-1/2 space-y-3">
          <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Total Amount in Words
            </p>
            <p className="text-xs font-semibold text-neutral-900 mt-0.5">{wordsTotal}</p>
          </div>

          <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/60 text-[11px] text-neutral-600 space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Bank Details for Remittance
            </p>
            <p className="font-medium text-neutral-800">Bank: HDFC Bank Ltd. (BKC Branch, Mumbai)</p>
            <p>A/C Name: CHAMPIONS RECREATIONAL AND SPORTS FACILITIES PVT LTD</p>
            <p>
              A/C No: <span className="font-mono font-semibold text-neutral-800">50200038910245</span>
            </p>
            <p>
              IFSC: <span className="font-mono font-semibold text-neutral-800">HDFC0000128</span>
            </p>
          </div>
        </div>

        {/* Right: Subtotal, CGST, SGST, Total, Balance */}
        <div className="w-full sm:w-5/12 rounded-lg bg-neutral-50 p-4 border border-neutral-200 space-y-2 text-xs">
          <div className="flex justify-between text-neutral-600">
            <span>Taxable Subtotal:</span>
            <span className="font-mono font-medium">{formatINR(invoice.subtotal)}</span>
          </div>
          {invoice.cgstTotal > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>CGST (9%):</span>
              <span className="font-mono font-medium">{formatINR(invoice.cgstTotal)}</span>
            </div>
          )}
          {invoice.sgstTotal > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>SGST (9%):</span>
              <span className="font-mono font-medium">{formatINR(invoice.sgstTotal)}</span>
            </div>
          )}
          {invoice.igstTotal > 0 && (
            <div className="flex justify-between text-neutral-600">
              <span>IGST (18%):</span>
              <span className="font-mono font-medium">{formatINR(invoice.igstTotal)}</span>
            </div>
          )}
          <div className="border-t border-neutral-200 pt-2 flex justify-between text-sm font-bold text-neutral-900">
            <span>Grand Total:</span>
            <span className="font-mono text-base">{formatCurrency(invoice.totalAmount)}</span>
          </div>

          {invoice.paymentsApplied.length > 0 && (
            <div className="border-t border-neutral-200/80 pt-1.5 space-y-1">
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Payments Applied:</span>
                <span className="font-mono">
                  -
                  {formatINR(
                    invoice.paymentsApplied.reduce((s, p) => s + p.amount, 0)
                  )}
                </span>
              </div>
            </div>
          )}

          {invoice.creditNotes.length > 0 && (
            <div className="flex justify-between text-purple-700 font-medium">
              <span>Credit Notes:</span>
              <span className="font-mono">
                -
                {formatINR(invoice.creditNotes.reduce((s, cn) => s + cn.amount, 0))}
              </span>
            </div>
          )}

          <div className="border-t-2 border-neutral-900 pt-2 flex justify-between text-sm font-bold text-neutral-900">
            <span>Balance Due:</span>
            <span
              className={cn(
                "font-mono text-base",
                invoice.balanceDue > 0 ? "text-red-700" : "text-emerald-700"
              )}
            >
              {formatCurrency(invoice.balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Terms & Authorised Signature */}
      <div className="mt-8 border-t border-neutral-200 pt-6 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-neutral-500">
        <div className="max-w-md">
          <p className="font-bold text-neutral-700 uppercase text-[10px] tracking-wider mb-1">
            Terms & Conditions
          </p>
          <p className="text-[11px] leading-relaxed">
            {invoice.terms ||
              "All bookings and services are subject to Champions Club general rules and court etiquette. Payments not received within due date are subject to 1.5% late interest per month."}
          </p>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <div className="h-12 flex items-center justify-end">
            <span className="italic font-serif text-neutral-400 text-sm">Digitally Signed</span>
          </div>
          <p className="text-[11px] font-bold text-neutral-900 uppercase tracking-wider">
            For Champions Sports Club Ltd.
          </p>
          <p className="text-[10px] text-neutral-500">Authorised Signatory</p>
        </div>
      </div>
    </div>
  );
}
