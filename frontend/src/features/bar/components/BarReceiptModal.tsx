import { BarReceipt } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Printer, Share2, Mail, CheckCircle2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface BarReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: BarReceipt | null;
}

export function BarReceiptModal({ isOpen, onClose, receipt }: BarReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const text = `Champions Club Bar Bill ${receipt.billNumber} for ₹${receipt.grandTotal.toLocaleString("en-IN")}. Thank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tax Invoice & Settlement Receipt">
      <div className="space-y-4">
        {/* Printable Crisp White Paper Surface */}
        <div
          id="bar-receipt-paper"
          className="bg-white text-ink-950 p-6 rounded-2xl shadow-xl border border-gray-200 font-sans text-xs space-y-3"
        >
          {/* Club Header */}
          <div className="text-center pb-3 border-b border-dashed border-gray-300">
            <h3 className="font-heading font-black text-lg text-ink-950 tracking-wider uppercase">
              Champions Club
            </h3>
            <p className="text-[11px] text-gray-600 font-medium">Lounge, Sports Bar & Café</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              FSSAI Lic: 11522018000492 · GSTIN: 27AAAAA0000A1Z5
            </p>
          </div>

          {/* Bill Metadata */}
          <div className="flex justify-between items-start text-[11px] text-gray-700 py-1">
            <div>
              <div>
                <strong>Bill No:</strong> {receipt.billNumber}
              </div>
              <div>
                <strong>Receipt:</strong> {receipt.receiptNumber}
              </div>
              <div>
                <strong>Server:</strong> {receipt.waiterName}
              </div>
            </div>
            <div className="text-right">
              <div>
                <strong>Date:</strong> {new Date(receipt.timestamp).toLocaleDateString("en-IN")}
              </div>
              <div>
                <strong>Time:</strong>{" "}
                {new Date(receipt.timestamp).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              {receipt.tableName && (
                <div>
                  <strong>Cover:</strong> {receipt.tableName}
                </div>
              )}
              {receipt.tabName && (
                <div>
                  <strong>Tab:</strong> {receipt.tabName}
                </div>
              )}
            </div>
          </div>

          {/* Customer / Member Info */}
          {receipt.customer?.name && (
            <div className="bg-gray-100 p-2 rounded-lg text-[11px] flex justify-between items-center text-gray-800">
              <div>
                <span className="font-bold">{receipt.customer.name}</span>
                {receipt.customer.tier && receipt.customer.tier !== "NONE" && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-volt-400 text-ink-900 font-bold text-[10px]">
                    {receipt.customer.tier}
                  </span>
                )}
              </div>
              {receipt.customer.phone && (
                <span className="text-gray-500 font-mono text-[10px]">
                  {receipt.customer.phone}
                </span>
              )}
            </div>
          )}

          {/* Line Items Table */}
          <div className="border-t border-b border-dashed border-gray-300 py-2">
            <div className="flex justify-between font-bold text-[11px] text-gray-800 pb-1 mb-1 border-b border-gray-200">
              <span className="w-1/2">Item Description</span>
              <span className="w-12 text-center">Qty</span>
              <span className="w-16 text-right">Rate</span>
              <span className="w-16 text-right">Amount</span>
            </div>
            <div className="space-y-1.5">
              {receipt.items.map((line, idx) => (
                <div key={idx} className="flex justify-between text-[11px] text-gray-800">
                  <span className="w-1/2 font-medium truncate">{line.name}</span>
                  <span className="w-12 text-center font-mono">{line.qty}</span>
                  <span className="w-16 text-right font-mono">₹{line.price}</span>
                  <span className="w-16 text-right font-bold font-mono">
                    ₹{line.amount.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal, Discounts & Taxes */}
          <div className="space-y-1 text-[11px] text-gray-700 pt-1">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono">₹{receipt.subtotal.toLocaleString("en-IN")}</span>
            </div>

            {receipt.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Member Tier Discount ({receipt.discountPercent}%):</span>
                <span className="font-mono">−₹{receipt.discountAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>GST (F&B / Bar):</span>
              <span className="font-mono">₹{receipt.gstAmount.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-black text-ink-950 pt-2 border-t border-gray-300">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-base text-ink-950">
                ₹{receipt.grandTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-[10px] space-y-1">
            <div className="font-bold text-gray-800">Payment Breakdown:</div>
            {receipt.payments.map((p, idx) => (
              <div key={idx} className="flex justify-between text-gray-700 font-mono">
                <span>
                  {p.method}
                  {p.reference ? ` (${p.reference})` : ""}
                </span>
                <span>₹{p.amount.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          {/* Footer QR & Thank You */}
          <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-300">
            <div className="text-[10px] text-gray-500">
              <p className="font-medium text-gray-700">Thank you for dining with us!</p>
              <p>For member account queries: support@championsclub.in</p>
            </div>
            <div className="p-1 bg-white rounded border border-gray-300">
              <QRCodeSVG value={`CCMS-BILL-${receipt.billNumber}`} size={42} />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 text-xs">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Receipt
            </Button>
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="h-9 text-xs text-emerald-400 border-emerald-500/30">
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              WhatsApp
            </Button>
          </div>

          <Button size="sm" onClick={onClose} className="bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-9 text-xs">
            Done & Next Order
          </Button>
        </div>
      </div>
    </Modal>
  );
}
