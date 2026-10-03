import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Lock, Package, ArrowRight } from "lucide-react";
import { AppLink } from "@/app/router/links";

interface StockInsufficientModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  orderNumber?: string;
}

export function StockInsufficientModal({
  isOpen,
  onClose,
  message,
  orderNumber = "SO-1042",
}: StockInsufficientModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-danger">
          <AlertCircle className="size-5" />
          <span>Stock Insufficient / Reserved</span>
        </div>
      }
      subtitle="The requested unit cannot be sold at the counter."
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 text-chalk">
        <div className="rounded-xl border border-danger/40 bg-danger/16 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-pill bg-danger/20 text-red-300 shrink-0 mt-0.5">
              <Lock className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-300 uppercase tracking-wide">
                STOCK_INSUFFICIENT
              </h4>
              <p className="mt-1 text-sm font-semibold text-white">{message}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-chalk/12 bg-court-700/60 p-3.5 text-xs text-chalk/80 space-y-1.5">
          <p className="font-semibold text-chalk flex items-center gap-1.5">
            <Package className="size-4 text-volt-300" />
            <span>Online Order Hold Policy (BR-09)</span>
          </p>
          <p className="text-[11px] text-chalk/70 leading-relaxed">
            Units reserved for paid/active online click-and-collect orders cannot be fulfilled to
            walk-in counter customers to prevent order shortages.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Dismiss
          </Button>
          <AppLink
            to="/shop-console/orders"
            className="flex h-10 items-center gap-1.5 rounded-pill bg-volt-400 px-4 text-xs font-bold text-ink-900 hover:bg-volt-500 transition-colors"
          >
            <span>View Online Queue</span>
            <ArrowRight className="size-3.5" />
          </AppLink>
        </div>
      </div>
    </Modal>
  );
}
