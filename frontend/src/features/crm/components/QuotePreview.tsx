import { ShieldCheck, Calendar, Receipt } from "lucide-react";
import type { QuoteItem, Lead } from "../types";

interface QuotePreviewProps {
  quoteNumber: string;
  quoteType: string;
  items: QuoteItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  validUntil: string;
  terms: string;
  lead: Lead | null;
}

export function QuotePreview({
  quoteNumber,
  items,
  subtotal,
  gstTotal,
  grandTotal,
  validUntil,
  terms,
  lead,
}: QuotePreviewProps) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white text-navy-950 rounded-2xl shadow-2xl p-6 sm:p-8 border border-navy-200/80 max-w-full overflow-hidden text-xs print:p-0 print:border-none print:shadow-none">
      {/* Club Header & Brand */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-navy-900">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-navy-950 flex items-center justify-center text-volt-400 font-black text-sm">
              CC
            </div>
            <div>
              <h2 className="text-base font-black tracking-wider text-navy-950 uppercase font-display">
                CHAMPIONS CLUB
              </h2>
              <p className="text-[10px] text-navy-600 font-semibold tracking-wide">
                SPORTS & WELLNESS PRIVATE LIMITED
              </p>
            </div>
          </div>
          <p className="text-[11px] text-navy-700 mt-2">
            Survey No. 42, Varthur Main Road, Whitefield
            <br />
            Bengaluru, Karnataka - 560066, India
            <br />
            <span className="font-semibold text-navy-900">GSTIN:</span> 29AAAAA0000A1Z5 |{" "}
            <span className="font-semibold text-navy-900">CIN:</span> U92410KA2024PTC188200
          </p>
        </div>

        <div className="sm:text-right">
          <div className="inline-block px-3 py-1 rounded bg-navy-100 text-navy-900 font-mono font-bold text-xs uppercase tracking-wider mb-2">
            Official Quotation
          </div>
          <p className="text-xs font-mono font-bold text-navy-900">{quoteNumber}</p>
          <p className="text-[11px] text-navy-600 mt-0.5">Date: {currentDate}</p>
          <p className="text-[11px] text-red-600 font-medium">Valid Until: {validUntil || "30 Days"}</p>
        </div>
      </div>

      {/* Recipient Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-navy-100 text-[11px]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 block mb-1">
            QUOTATION PREPARED FOR:
          </span>
          <p className="font-bold text-sm text-navy-950">{lead?.name || "Prospective Client"}</p>
          {lead?.companyName && (
            <p className="font-semibold text-navy-800">{lead.companyName}</p>
          )}
          <p className="text-navy-700">{lead?.email || "customer@example.com"}</p>
          <p className="text-navy-700">{lead?.phone || "+91 98000 00000"}</p>
        </div>

        <div className="sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-navy-400 block mb-1">
            CLUB REPRESENTATIVE:
          </span>
          <p className="font-bold text-navy-950">{lead?.owner || "Sales Advisory Team"}</p>
          <p className="text-navy-700">Champions Club Membership Services</p>
          <p className="text-navy-700">membership@championsclub.in</p>
          <p className="text-navy-700">+91 (080) 4920-1100</p>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="my-5 overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b-2 border-navy-900 text-[10px] uppercase font-bold text-navy-800 tracking-wider">
              <th className="py-2.5 pr-2 w-8">#</th>
              <th className="py-2.5 px-2">Description of Services / Items</th>
              <th className="py-2.5 px-2 text-center w-14">Qty</th>
              <th className="py-2.5 px-2 text-right w-24">Rate (₹)</th>
              <th className="py-2.5 px-2 text-right w-16">GST</th>
              <th className="py-2.5 pl-2 text-right w-24">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100 text-navy-900 font-normal">
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="py-2.5 pr-2 text-navy-400 font-mono">{idx + 1}</td>
                <td className="py-2.5 px-2 font-medium">{item.description}</td>
                <td className="py-2.5 px-2 text-center font-mono">{item.qty}</td>
                <td className="py-2.5 px-2 text-right font-mono">
                  {item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-2.5 px-2 text-right font-mono text-navy-600">{item.gstPercent}%</td>
                <td className="py-2.5 pl-2 text-right font-mono font-semibold">
                  {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-navy-400 italic">
                  No line items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals Summary */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t-2 border-navy-900">
        <div className="max-w-md text-[10px] text-navy-600">
          <span className="font-bold text-navy-900 uppercase tracking-wider block mb-1">
            TERMS & CONDITIONS:
          </span>
          <p className="leading-relaxed whitespace-pre-line">{terms || "Standard club terms apply."}</p>
        </div>

        <div className="w-full sm:w-60 space-y-1.5 text-xs">
          <div className="flex justify-between text-navy-700">
            <span>Subtotal (Excl. Tax):</span>
            <span className="font-mono font-medium">
              ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between text-navy-700">
            <span>Integrated GST (18%):</span>
            <span className="font-mono font-medium">
              ₹{gstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-2 border-t border-navy-300 flex justify-between font-bold text-sm text-navy-950">
            <span>Total Payable:</span>
            <span className="font-mono text-base text-navy-950">
              ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Sign-off & Stamp */}
      <div className="mt-8 pt-6 border-t border-dashed border-navy-200 flex flex-col sm:flex-row items-end justify-between gap-4 text-[10px] text-navy-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Computer-generated quotation. Authorized by Champions Club Sales Operations.</span>
        </div>

        <div className="text-right">
          <div className="w-40 border-b border-navy-400 pb-1 mb-1 font-mono text-[9px] text-navy-400 text-center">
            Authorized Signatory
          </div>
          <span>For Champions Club Sports & Wellness Pvt Ltd</span>
        </div>
      </div>
    </div>
  );
}
