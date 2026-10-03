import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import type { Booking } from "@/features/booking/types";
import { calculateCancellationPolicy } from "@/features/booking/sampleData";
import { Money } from "@/components/shared/Money";

export interface CancelBookingDialogProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (bookingId: string, reason: string) => void;
}

export function CancelBookingDialog({
  booking,
  isOpen,
  onClose,
  onConfirmCancel,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const policy = calculateCancellationPolicy(booking);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      onConfirmCancel(booking.id, reason.trim() || "Member requested cancellation");
      setLoading(false);
      setReason("");
      onClose();
    }, 450);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2 text-danger">
          <AlertTriangle className="size-5 shrink-0" />
          <span>Cancel Booking #{booking.id}</span>
        </div>
      }
      subtitle={`Slot: ${booking.courtName} · ${booking.date} · ${booking.startTime}–${booking.endTime}`}
    >
      <div className="flex flex-col gap-4">
        {/* Policy Box */}
        <div
          className={`rounded-2xl border p-4 ${
            policy.freeCancellation
              ? "border-success/30 bg-success/10 text-success"
              : "border-warning/30 bg-warning/10 text-warning"
          }`}
        >
          <div className="flex items-start gap-3">
            {policy.freeCancellation ? (
              <CheckCircle2 className="size-5 shrink-0 mt-0.5" />
            ) : (
              <Clock className="size-5 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-semibold tracking-wide">
                {policy.freeCancellation
                  ? "Eligible for Free Cancellation"
                  : "Within 4-Hour Window (Late Cancellation)"}
              </h4>
              <p className="text-xs text-chalk/80 mt-1 leading-relaxed">
                {policy.policySummary}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-chalk/70">
            <span>Original Paid Amount:</span>
            <span className="font-semibold text-chalk">
              <Money amount={policy.originalPrice} />
            </span>
          </div>

          {!policy.freeCancellation && policy.cancellationFee > 0 && (
            <div className="flex items-center justify-between text-danger">
              <span>Cancellation Fee (50%):</span>
              <span className="font-semibold">
                - <Money amount={policy.cancellationFee} />
              </span>
            </div>
          )}

          <div className="border-t border-chalk/10 pt-2 flex items-center justify-between font-semibold">
            <span className="text-chalk">Net Refund Credited:</span>
            <span className={policy.refundAmount > 0 ? "text-success text-sm" : "text-chalk/60"}>
              <Money amount={policy.refundAmount} />
            </span>
          </div>
          <p className="text-[11px] text-chalk/50 italic">
            * Refund will be processed against original payment (BKG-14 policy).
          </p>
        </div>

        {/* Reason Input */}
        <div>
          <Input
            label="Reason for cancellation (optional)"
            placeholder="e.g. Schedule clash, weather, personal..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Keep Booking
          </Button>
          <Button variant="danger" onClick={handleConfirm} loading={loading}>
            Confirm Cancellation
          </Button>
        </div>
      </div>
    </Modal>
  );
}
