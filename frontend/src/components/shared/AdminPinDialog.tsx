import { useState } from "react";
import { ShieldAlert, ShieldCheck, Lock, AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/app/providers/AuthProvider";

export interface AdminPinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, pin?: string) => void;
  title?: string;
  description?: string;
  overrideType?: "cap" | "price" | "discount";
}

export function AdminPinDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Admin Override Required",
  description = "This action exceeds standard desk limits. An administrator PIN and audit justification are required to proceed.",
  overrideType = "cap",
}: AdminPinDialogProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError("Please provide a reason for the audit log.");
      return;
    }

    if (!isAdmin) {
      if (!pin.trim()) {
        setError("Admin PIN is required. Ask an admin to override.");
        return;
      }
      if (pin !== "9999" && pin !== "1234") {
        setError("Invalid Admin PIN. Please ask an administrator to authorize.");
        return;
      }
    }

    setError(null);
    onConfirm(reason.trim(), pin || undefined);
    setPin("");
    setReason("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError(null);
        setPin("");
        setReason("");
        onClose();
      }}
      title={title}
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-chalk">
        <div className="flex items-start gap-3 rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
          <AlertTriangle className="size-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">Admin Privileges Required</p>
            <p className="leading-relaxed">{description}</p>
          </div>
        </div>

        {!isAdmin ? (
          <div className="rounded-[14px] border border-chalk/12 bg-court-700/60 p-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-chalk/80 font-medium">
              <Lock className="size-3.5 text-volt-400" />
              <span>Ask an admin to override</span>
            </div>
            <p className="text-chalk/60 text-[11px] leading-relaxed">
              Standard staff accounts cannot self-authorize daily cap or pricing waivers. An in-person Administrator must enter their 4-digit security PIN.
            </p>
            <Input
              label="Admin Security PIN"
              type="password"
              placeholder="Enter 4-digit PIN (Demo: 9999)"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(null);
              }}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-volt-400 bg-volt-400/10 border border-volt-400/30 rounded-pill px-3 py-1.5 font-medium">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Authenticated as Super Admin — PIN waived</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-chalk/80">
            Audit Justification <span className="text-danger">*</span>
          </label>
          <textarea
            rows={2}
            className="w-full rounded-input border border-chalk/20 bg-chalk/8 p-2.5 text-xs text-chalk placeholder:text-chalk/40 focus:border-volt-400 focus:outline-none"
            placeholder="e.g. Approved tournament training extension / VIP exemption"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        {error && (
          <p className="text-xs text-danger font-medium flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setError(null);
              setPin("");
              setReason("");
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Authorize Admin Override
          </Button>
        </div>
      </form>
    </Modal>
  );
}
