import { Lock, AlertTriangle } from "lucide-react";
import { useFinanceStore } from "../financeStore";
import { AppLink } from "@/app/router/links";

export function PeriodLockedBanner() {
  const { activePeriod } = useFinanceStore();

  if (activePeriod?.status !== "CLOSED") return null;

  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-warning/40 bg-warning/15 px-4 py-3 text-warning">
      <div className="flex items-center gap-2.5">
        <Lock className="size-4 shrink-0" />
        <span className="text-xs sm:text-sm font-semibold">
          Financial Period Closed ({activePeriod.name}): Edits across ledgers, invoices, and expenses are locked (HTTP 423).
        </span>
      </div>
      <AppLink
        to="/finance/periods"
        className="rounded-pill bg-warning/20 px-3 py-1 text-xs font-bold hover:bg-warning/30 transition-colors"
      >
        View Periods
      </AppLink>
    </div>
  );
}
