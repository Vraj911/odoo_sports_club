import { useRef } from "react";
import type { POSReceipt } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/shared/Money";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Share2, Mail, CheckCircle2, FileText, Download } from "lucide-react";
import { toast } from "sonner";

interface ReceiptModalProps {
  receipt: POSReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ receipt, isOpen, onClose }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
    toast.success("Printing receipt...");
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `*CHAMPIONS CLUB PRO SHOP RECEIPT*\n` +
      `Receipt #: ${receipt.receiptNo}\n` +
      `Date: ${receipt.date} ${receipt.time}\n` +
      `Customer: ${receipt.customerName} (${receipt.memberTier})\n` +
      `Items: ${receipt.items.length}\n` +
      `Total: ₹${receipt.total.toLocaleString("en-IN")}\n` +
      `Payment: ${receipt.paymentMethod}\n` +
      `Thank you for shopping at Champions Club!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("WhatsApp receipt link opened!");
  };

  const handleEmail = () => {
    toast.success(`Receipt ${receipt.receiptNo} emailed to customer.`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-400" />
          <span>Payment Successful</span>
        </div>
      }
      subtitle={`Transaction completed · Receipt #${receipt.receiptNo}`}
      maxWidth="max-w-lg"
    >
      <div className="flex flex-col gap-5 text-chalk">
        {/* Crisp White Paper Receipt Card */}
        <div
          ref={printRef}
          className="rounded-[18px] bg-white p-6 sm:p-7 text-neutral-900 shadow-xl border border-neutral-200 font-sans"
        >
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-neutral-300">
            <h2 className="text-lg font-black tracking-wider uppercase text-neutral-900">
              CHAMPIONS CLUB
            </h2>
            <p className="text-[11px] text-neutral-500 uppercase tracking-widest font-semibold">
              Pro Shop & Racquet Sports Centre
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">
              GSTIN: 27AABCC8921N1ZM · Worli Sea Face, Mumbai
            </p>
          </div>

          {/* Receipt Info Meta */}
          <div className="py-3 border-b border-neutral-200 text-xs text-neutral-600 grid grid-cols-2 gap-2">
            <div>
              <p><span className="font-semibold text-neutral-800">Receipt:</span> #{receipt.receiptNo}</p>
              <p><span className="font-semibold text-neutral-800">Date:</span> {receipt.date} {receipt.time}</p>
            </div>
            <div className="text-right">
              <p><span className="font-semibold text-neutral-800">Customer:</span> {receipt.customerName}</p>
              <p>
                <span className="font-semibold text-neutral-800">Tier:</span>{" "}
                <span className="font-bold text-amber-700">{receipt.memberTier}</span>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-3 border-b border-neutral-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-neutral-400 border-b border-neutral-200 text-[10px] uppercase">
                  <th className="text-left pb-1 font-bold">Item</th>
                  <th className="text-center pb-1 font-bold">Qty</th>
                  <th className="text-right pb-1 font-bold">Price</th>
                  <th className="text-right pb-1 font-bold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {receipt.items.map((item, idx) => (
                  <tr key={idx} className="text-neutral-800">
                    <td className="py-2 pr-2">
                      <p className="font-semibold text-neutral-900 leading-tight">{item.name}</p>
                      <p className="text-[10px] text-neutral-500">{item.variantLabel}</p>
                    </td>
                    <td className="py-2 text-center text-neutral-700 font-medium">{item.quantity}</td>
                    <td className="py-2 text-right text-neutral-700">₹{item.unitPrice}</td>
                    <td className="py-2 text-right font-bold text-neutral-900">₹{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Breakdown Totals */}
          <div className="py-3 border-b border-dashed border-neutral-300 text-xs space-y-1.5">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span className="font-medium">₹{receipt.subtotal.toLocaleString("en-IN")}</span>
            </div>

            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Member Discount ({receipt.discountLabel})</span>
                <span>−₹{receipt.discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-600">
              <span>GST (18% inclusive)</span>
              <span className="font-medium">₹{receipt.taxAmount.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between text-base font-extrabold text-neutral-950 pt-2 border-t border-neutral-200">
              <span>TOTAL CHARGE</span>
              <span>₹{receipt.total.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="py-3 border-b border-neutral-200 text-xs text-neutral-700 space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold">Payment Mode:</span>
              <span className="font-bold text-neutral-900">{receipt.paymentMethod}</span>
            </div>

            {receipt.paymentMethod === "CASH" && receipt.tenderedCash !== undefined && (
              <>
                <div className="flex justify-between text-neutral-600">
                  <span>Cash Tendered:</span>
                  <span>₹{receipt.tenderedCash.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700">
                  <span>Change Due:</span>
                  <span>₹{(receipt.changeDue ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </>
            )}

            {receipt.paymentMethod === "UPI" && receipt.upiRef && (
              <div className="flex justify-between text-neutral-600 text-[11px]">
                <span>UPI Ref:</span>
                <span className="font-mono">{receipt.upiRef}</span>
              </div>
            )}

            {receipt.paymentMethod === "CARD" && receipt.cardRef && (
              <div className="flex justify-between text-neutral-600 text-[11px]">
                <span>Card Ref:</span>
                <span className="font-mono">{receipt.cardRef}</span>
              </div>
            )}

            {receipt.paymentMethod === "SPLIT" && receipt.splitDetails && (
              <div className="mt-1 space-y-0.5 pt-1 border-t border-neutral-100">
                {receipt.splitDetails.map((sp) => (
                  <div key={sp.id} className="flex justify-between text-[11px] text-neutral-600">
                    <span>{sp.method}:</span>
                    <span>₹{sp.amount.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* QR Code & Footer */}
          <div className="pt-4 flex items-center justify-between">
            <div className="text-[10px] text-neutral-500 leading-tight">
              <p className="font-bold text-neutral-700">Thank you for playing!</p>
              <p>Return policy: 7 days with tag.</p>
              <p>Cashier: {receipt.cashierName}</p>
            </div>
            <div className="p-1 rounded-lg bg-neutral-50 border border-neutral-200">
              <QRCodeSVG value={`CCMS-RECEIPT-${receipt.receiptNo}`} size={56} />
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          <Button variant="outline" onClick={handlePrint} className="h-10 text-xs">
            <Printer className="size-3.5 mr-1.5" />
            <span>Print</span>
          </Button>
          <Button variant="outline" onClick={handleWhatsApp} className="h-10 text-xs text-emerald-400">
            <Share2 className="size-3.5 mr-1.5" />
            <span>WhatsApp</span>
          </Button>
          <Button variant="outline" onClick={handleEmail} className="h-10 text-xs">
            <Mail className="size-3.5 mr-1.5" />
            <span>Email</span>
          </Button>
          <Button variant="primary" onClick={onClose} className="h-10 text-xs font-bold">
            <span>New Sale</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
