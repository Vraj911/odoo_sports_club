import { useState } from "react";
import type { PaymentRecord } from "../types";
import { Drawer } from "@/components/ui/Drawer";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { formatCurrency, refundPayment } from "../financeStore";
import { formatINR } from "@/components/shared/Money";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  Receipt,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
  User,
  Hash,
  Printer,
  ShieldAlert,
} from "lucide-react";

export interface PaymentDrawerProps {
  payment: PaymentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDrawer({ payment, isOpen, onClose }: PaymentDrawerProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [adminPinModalOpen, setAdminPinModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundMode, setRefundMode] = useState<"GATEWAY" | "CASH_CREDIT_MEMO">("GATEWAY");
  const [refundReason, setRefundReason] = useState("");

  if (!payment) return null;

  const maxRefundable = payment.amount - (payment.refundedAmount || 0);

  const handleStartRefund = () => {
    setRefundAmount(maxRefundable);
    setRefundReason("");
    setRefundMode(payment.method === "ONLINE" || payment.method === "CARD" ? "GATEWAY" : "CASH_CREDIT_MEMO");

    if (isAdmin) {
      setRefundDialogOpen(true);
    } else {
      // Staff requires admin pin override
      setAdminPinModalOpen(true);
    }
  };

  const handleAdminPinConfirm = (reason: string, pin?: string) => {
    setRefundReason(reason);
    setAdminPinModalOpen(false);
    // Proceed to execute refund with the verified PIN
    const res = refundPayment(
      payment.id,
      refundAmount || maxRefundable,
      reason,
      refundMode,
      user?.name || "Staff Authorized by Admin",
      pin
    );
    if (res.success) {
      onClose();
    }
  };

  const handleDirectAdminRefund = (reason: string) => {
    const res = refundPayment(
      payment.id,
      refundAmount || maxRefundable,
      reason,
      refundMode,
      user?.name || "Administrator"
    );
    if (res.success) {
      setRefundDialogOpen(false);
      onClose();
    }
  };

  const getStatusTone = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return "warning";
      case "FAILED":
        return "danger";
      case "FAILED_RETRIED":
        return "info";
      default:
        return "neutral";
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-bold text-chalk">{payment.id}</span>
            <StatusPill tone={getStatusTone(payment.status)} className="capitalize">
              {payment.status === "FAILED_RETRIED" ? "Failed → Retried" : payment.status.replace("_", " ")}
            </StatusPill>
          </div>
        }
        subtitle={
          <p className="text-xs text-chalk/60">
            Recorded on {new Date(payment.timestamp).toLocaleString("en-IN")} by {payment.receivedBy}
          </p>
        }
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="size-3.5" /> Print Receipt
            </Button>

            {maxRefundable > 0 && payment.status !== "FAILED" ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleStartRefund}
                className="gap-2"
              >
                <RotateCcw className="size-3.5" />
                {!isAdmin && <ShieldAlert className="size-3" />}
                Refund {maxRefundable < payment.amount ? `Remaining (${formatINR(maxRefundable)})` : "Payment"}
              </Button>
            ) : (
              <span className="text-xs text-chalk/50 italic">
                {payment.status === "REFUNDED" ? "Fully refunded" : "No refund available"}
              </span>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Amount Hero Card */}
          <div className="rounded-2xl border border-chalk/14 bg-court-700/60 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-chalk/70 uppercase tracking-wider">Amount Paid</p>
              <p className="text-3xl font-extrabold text-volt-400 font-mono mt-1">
                {formatCurrency(payment.amount)}
              </p>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-chalk/70">
                <span>Source:</span>
                <span className="font-semibold text-chalk">{payment.source}</span>
                <span>•</span>
                <span>Method:</span>
                <span className="font-semibold text-chalk">{payment.method}</span>
              </div>
            </div>

            {payment.refundedAmount && payment.refundedAmount > 0 && (
              <div className="text-right border-l border-chalk/14 pl-4">
                <p className="text-[11px] font-semibold text-warning uppercase">Refunded</p>
                <p className="text-lg font-bold font-mono text-warning">
                  {formatINR(payment.refundedAmount)}
                </p>
                {payment.refundReason && (
                  <p className="text-[10px] text-chalk/60 max-w-[140px] truncate" title={payment.refundReason}>
                    {payment.refundReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Webhook Idempotency & Gateway Retry Banner */}
          {payment.status === "FAILED_RETRIED" && payment.retryHistory && (
            <div className="rounded-xl border border-info/30 bg-info/10 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-info">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Gateway Retry Successful (Idempotency Key Protected)</span>
              </div>
              <p className="text-chalk/80 leading-relaxed">
                Initial attempt failed at the card issuer bank. System retried via webhook handler with unique transaction idempotency token to prevent double-charging.
              </p>
              <div className="mt-2 space-y-1 rounded-lg bg-court-800/80 p-2.5 font-mono text-[11px] text-chalk/80">
                {payment.retryHistory.map((h, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>
                      Attempt {h.attempt}: {h.status}
                    </span>
                    <span className="text-chalk/60">{new Date(h.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metadata Grid */}
          <div className="rounded-xl border border-chalk/10 bg-court-500/70 p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-chalk/8">
              <span className="text-chalk/60 flex items-center gap-1.5">
                <User className="size-3.5" /> Customer Name
              </span>
              <span className="font-semibold text-chalk">{payment.customerName}</span>
            </div>
            {payment.customerPhone && (
              <div className="flex justify-between items-center py-1 border-b border-chalk/8">
                <span className="text-chalk/60">Phone</span>
                <span className="font-mono text-chalk/90">{payment.customerPhone}</span>
              </div>
            )}
            {payment.customerEmail && (
              <div className="flex justify-between items-center py-1 border-b border-chalk/8">
                <span className="text-chalk/60">Email</span>
                <span className="font-mono text-chalk/90">{payment.customerEmail}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1 border-b border-chalk/8">
              <span className="text-chalk/60 flex items-center gap-1.5">
                <Hash className="size-3.5" /> Transaction Ref
              </span>
              <span className="font-mono font-medium text-volt-400">{payment.ref}</span>
            </div>
            {payment.gatewayTxnId && (
              <div className="flex justify-between items-center py-1 border-b border-chalk/8">
                <span className="text-chalk/60">Gateway Txn ID</span>
                <span className="font-mono text-chalk/90">{payment.gatewayTxnId}</span>
              </div>
            )}
            {payment.invoiceId && (
              <div className="flex justify-between items-center py-1 border-b border-chalk/8">
                <span className="text-chalk/60">Linked Invoice</span>
                <span className="font-mono font-bold text-volt-400">{payment.invoiceId}</span>
              </div>
            )}
            {payment.orderId && (
              <div className="flex justify-between items-center py-1 border-b border-chalk/8">
                <span className="text-chalk/60">Linked Order / Booking</span>
                <span className="font-mono font-medium text-chalk">{payment.orderId}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-chalk/60">Received By</span>
              <span className="text-chalk/90 font-medium">{payment.receivedBy}</span>
            </div>
          </div>

          {/* White Paper Thermal Receipt Preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-chalk/70 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="size-3.5" /> Official Cash/Card Receipt Slip
            </p>
            <div className="rounded-lg bg-white p-6 font-mono text-neutral-900 shadow-md text-xs space-y-3">
              <div className="text-center border-b border-dashed border-neutral-300 pb-3">
                <p className="font-bold text-sm tracking-wider">CHAMPIONS SPORTS CLUB</p>
                <p className="text-[10px] text-neutral-500">BKC, Bandra East, Mumbai</p>
                <p className="text-[10px] text-neutral-500">GSTIN: 27AAAAA0000A1Z5</p>
                <p className="text-[10px] mt-1 font-semibold uppercase">PAYMENT RECEIPT</p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Receipt Ref:</span>
                  <span className="font-bold">{payment.ref}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Date & Time:</span>
                  <span>{new Date(payment.timestamp).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-semibold">{payment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Method:</span>
                  <span className="uppercase font-bold">{payment.method}</span>
                </div>
                {payment.orderId && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Source / Ref:</span>
                    <span>{payment.source} ({payment.orderId})</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center py-1 text-sm font-bold border-b border-dashed border-neutral-300 pb-3">
                <span>TOTAL RECEIVED:</span>
                <span className="text-base">{formatCurrency(payment.amount)}</span>
              </div>

              <div className="text-center text-[10px] text-neutral-500 pt-1 space-y-0.5">
                <p>Thank you for playing at Champions Sports Club!</p>
                <p>Keep this receipt for facility check-in verification.</p>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Staff Admin PIN Override Dialog */}
      <AdminPinDialog
        isOpen={adminPinModalOpen}
        onClose={() => setAdminPinModalOpen(false)}
        onConfirm={handleAdminPinConfirm}
        title="Admin Authorization Required for Refund"
        description={`Refund of ${formatINR(
          refundAmount
        )} requires Manager / Admin PIN (1234 or 9999) and an explicit audit justification.`}
      />

      {/* Admin Direct Reason Dialog */}
      <ReasonDialog
        isOpen={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        onConfirm={handleDirectAdminRefund}
        title={`Authorize Refund: ${payment.id}`}
        description={`Please provide an audit reason for refunding ${formatINR(
          refundAmount
        )} to ${payment.customerName}.`}
        actionLabel="Confirm & Process Refund"
      />
    </>
  );
}
