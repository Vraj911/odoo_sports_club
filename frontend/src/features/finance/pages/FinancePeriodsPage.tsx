import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import {
  useFinanceStore,
  formatCurrency,
  closeFinancialPeriod,
  reopenFinancialPeriod,
} from "../financeStore";
import type { FinancialPeriod } from "../types";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { useAuth } from "@/app/providers/AuthProvider";
import { formatINR } from "@/components/shared/Money";
import {
  CalendarRange,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function FinancePeriodsPage() {
  const { user } = useAuth();

  const { periods } = useFinanceStore();

  const [closingPeriod, setClosingPeriod] = useState<FinancialPeriod | null>(null);
  const [reopeningPeriod, setReopeningPeriod] = useState<FinancialPeriod | null>(null);

  // Close workflow
  const handleStartClose = (p: FinancialPeriod) => {
    setClosingPeriod(p);
  };

  const handleConfirmClose = () => {
    if (!closingPeriod) return;
    closeFinancialPeriod(closingPeriod.id, user?.name || "Finance Head");
    setClosingPeriod(null);
  };

  // Reopen workflow
  const handleStartReopen = (p: FinancialPeriod) => {
    setReopeningPeriod(p);
  };

  const handleAdminPinConfirm = (reason: string, pin?: string) => {
    if (reopeningPeriod) {
      reopenFinancialPeriod(
        reopeningPeriod.id,
        reason,
        user?.name || "Staff Authorized by Admin",
        pin
      );
    }
    setAdminPinModalOpen(false);
    setReopeningPeriod(null);
    setPendingAction(null);
  };

  const handleDirectAdminReopen = (reason: string) => {
    if (reopeningPeriod) {
      reopenFinancialPeriod(
        reopeningPeriod.id,
        reason,
        user?.name || "Administrator"
      );
    }
    setReopeningPeriod(null);
  };

  const columns: Column<FinancialPeriod>[] = [
    {
      key: "period",
      header: "Financial Period",
      render: (p) => (
        <div>
          <span className="font-bold text-sm text-chalk">{p.name}</span>
          <p className="text-[11px] font-mono text-volt-400">{p.id} ({p.fiscalYear})</p>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Effective Dates",
      render: (p) => (
        <span className="font-mono text-xs text-chalk/70">
          {p.startDate} to {p.endDate}
        </span>
      ),
    },
    {
      key: "revenue",
      header: "Revenue",
      align: "right",
      render: (p) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {formatINR(p.totalRevenue)}
        </span>
      ),
    },
    {
      key: "expense",
      header: "Expenses",
      align: "right",
      render: (p) => (
        <span className="font-mono text-xs font-semibold text-rose-300">
          {formatINR(p.totalExpense)}
        </span>
      ),
    },
    {
      key: "net",
      header: "Operating Profit",
      align: "right",
      render: (p) => (
        <span className="font-mono text-xs font-bold text-chalk">
          {formatINR(p.netOperatingProfit)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusPill tone={p.status === "OPEN" ? "success" : "warning"}>
          {p.status}
        </StatusPill>
      ),
    },
    {
      key: "audit",
      header: "Closing / Reopen Audit",
      render: (p) => (
        <div className="text-xs">
          {p.status === "CLOSED" && p.closedBy && (
            <p className="text-chalk/60">
              Closed by: <span className="text-chalk font-medium">{p.closedBy}</span>
            </p>
          )}
          {p.reopenReason && (
            <p className="text-[11px] text-warning italic">
              Reopened: {p.reopenReason} ({p.reopenedBy})
            </p>
          )}
          {p.status === "OPEN" && !p.reopenReason && (
            <span className="text-emerald-400 text-[11px] font-semibold">Active & Modifiable</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (p) => {
        if (p.status === "OPEN") {
          return (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStartClose(p)}
              className="h-7 px-2.5 text-xs gap-1 border-warning/40 text-warning hover:bg-warning/20"
            >
              <Lock className="size-3" /> Close Period
            </Button>
          );
        } else {
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleStartReopen(p)}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Unlock className="size-3 text-volt-400" />
              Reopen
            </Button>
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Periods"
        subtitle="Accounting month-end locking, edit prevention across ledgers, and audited period reopen controls (FIN-14)."
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Information Alert */}
      <Card className="p-4 border-chalk/14 bg-court-600/70 flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-court-700 text-volt-400 shrink-0">
          <CalendarRange className="size-4" />
        </div>
        <div className="text-xs space-y-1 text-chalk/80">
          <p className="font-semibold text-chalk">
            Period Lock Enforcement & Audit Rules (FIN-14):
          </p>
          <p>
            Closing a period freezes all transactions (payments, invoices, and expenses) within that date range. Any attempted modification returns HTTP 423 (Period Locked).
          </p>
          <p className="text-chalk/60">
            Reopening a period requires an Administrator PIN and an audited business rationale recorded for statutory tax reviewers.
          </p>
        </div>
      </Card>

      <Table
        columns={columns}
        data={periods}
        keyExtractor={(p) => p.id}
      />

      {/* Close Period Confirmation Modal */}
      {closingPeriod && (
        <Modal
          isOpen={Boolean(closingPeriod)}
          onClose={() => setClosingPeriod(null)}
          title={
            <div className="flex items-center gap-2 text-warning">
              <Lock className="size-4" />
              <span>Confirm Closing Period: {closingPeriod.name}</span>
            </div>
          }
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-chalk/90 leading-relaxed">
              Are you sure you want to close <strong className="text-volt-400">{closingPeriod.name}</strong>?
            </p>
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-warning space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="size-3.5" /> Warning: Edits will be strictly locked
              </p>
              <p className="text-[11px] text-chalk/80">
                Staff will no longer be able to record payments, modify invoices, or add expenses for this period without an audited admin override.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
              <Button type="button" variant="secondary" onClick={() => setClosingPeriod(null)}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleConfirmClose} className="gap-1.5">
                <Lock className="size-3.5" /> Close & Lock Period
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reopen Reason Dialog */}
      {reopeningPeriod && (
        <ReasonDialog
          isOpen={Boolean(reopeningPeriod)}
          onClose={() => setReopeningPeriod(null)}
          onConfirm={handleDirectAdminReopen}
          title={`Reopen Financial Period: ${reopeningPeriod.name}`}
          description="Reopening a previously closed accounting period unlocks ledger modifications and requires statutory audit documentation."
          actionLabel="Reopen Financial Period"
          variant="primary"
        />
      )}
    </div>
  );
}
