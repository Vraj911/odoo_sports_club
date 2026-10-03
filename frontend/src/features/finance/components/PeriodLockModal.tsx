import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useFinanceStore, closePeriodLockModal } from "../financeStore";
import { Lock, ShieldAlert, ArrowRight } from "lucide-react";
import { useGo } from "@/app/router/links";

export function PeriodLockModal() {
  const { periodLockModal } = useFinanceStore();
  const go = useGo();

  if (!periodLockModal.isOpen) return null;

  return (
    <Modal
      isOpen={periodLockModal.isOpen}
      onClose={closePeriodLockModal}
      title={
        <div className="flex items-center gap-2 text-warning">
          <div className="flex size-7 items-center justify-center rounded-full bg-warning/20">
            <Lock className="size-4" />
          </div>
          <span>423 Locked: Financial Period Closed</span>
        </div>
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-chalk/80 leading-relaxed">
          The requested action <strong className="text-chalk">{periodLockModal.attemptedAction}</strong> cannot be completed because the financial period <strong className="text-volt-400">{periodLockModal.periodName}</strong> has been officially closed by accounting.
        </p>

        <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3.5 text-xs text-chalk/70 space-y-1.5">
          <p className="font-semibold text-chalk flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-warning" /> Compliance Audit Rule
          </p>
          <p>
            Closed periods lock all ledgers, invoice modifications, and expense disbursements to maintain GST and tax audit integrity. Only an Administrator with explicit authorization can reopen a period.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={closePeriodLockModal}>
            Dismiss
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              closePeriodLockModal();
              go("/finance/periods");
            }}
            className="gap-1.5"
          >
            Review Periods <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
