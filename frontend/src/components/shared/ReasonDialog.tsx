import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, Lock } from "lucide-react";

export interface ReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, pin?: string) => void;
  title: string;
  description?: string;
  actionLabel?: string;
  variant?: "danger" | "primary";
  requirePin?: boolean;
}

export function ReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = "This action requires an explicit audit reason and will be logged in the system audit trail.",
  actionLabel = "Confirm Action",
  variant = "danger",
  requirePin = false,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Reason is mandatory for audited sensitive actions.");
      return;
    }
    if (requirePin && (!pin || pin.length < 4)) {
      setError("Valid 4-digit Manager PIN is required.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onConfirm(reason, pin);
      setLoading(false);
      setReason("");
      setPin("");
      setError("");
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-volt-400" />
          <span>{title}</span>
        </div>
      }
      subtitle={description}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3 text-xs text-chalk/70 border border-white/10">
          <ShieldCheck className="size-4 text-volt-400 shrink-0" />
          <span>Audited action: All details will be recorded under your staff ID with timestamp.</span>
        </div>

        <Input
          label="Mandatory Audit Reason *"
          placeholder="e.g. Member requested refund due to rainout..."
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError("");
          }}
          error={error}
          autoFocus
        />

        {requirePin && (
          <Input
            label="Manager PIN *"
            type="password"
            maxLength={4}
            placeholder="••••"
            leftIcon={<Lock className="size-4" />}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
        )}

        <div className="mt-4 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant={variant} loading={loading}>
            {actionLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AuditedChip({ timestamp = "Just now", reason }: { timestamp?: string; reason?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-pill bg-volt-400/16 border border-volt-400/32 px-2.5 py-1 text-xs font-medium text-volt-400"
      title={reason ? `Audit Reason: ${reason}` : undefined}
    >
      <ShieldCheck className="size-3.5" />
      <span>Audited ({timestamp})</span>
    </span>
  );
}
