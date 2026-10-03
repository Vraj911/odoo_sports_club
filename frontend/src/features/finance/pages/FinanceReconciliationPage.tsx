import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import {
  useFinanceStore,
  formatCurrency,
  matchGatewaySettlement,
  signOffCashReconciliation,
} from "../financeStore";
import type { CashReconciliationRecord, GatewaySettlementRecord } from "../types";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import { PeriodLockedBanner } from "../components/PeriodLockedBanner";
import { PeriodLockModal } from "../components/PeriodLockModal";
import { useAuth } from "@/app/providers/AuthProvider";
import { formatINR } from "@/components/shared/Money";
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Building,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/cn";

export default function FinanceReconciliationPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { cashReconciliations, gatewaySettlements } = useFinanceStore();

  const [activeTab, setActiveTab] = useState<string>("CASH");
  const [selectedCashRecord, setSelectedCashRecord] = useState<CashReconciliationRecord | null>(null);
  const [matchingGatewayRecord, setMatchingGatewayRecord] = useState<GatewaySettlementRecord | null>(null);
  const [bankRefInput, setBankRefInput] = useState("");
  const [adminPinModalOpen, setAdminPinModalOpen] = useState(false);

  const tabs: TabItem[] = [
    { id: "CASH", label: "Daily Cash Drawer Reconciliation" },
    { id: "GATEWAY", label: "Gateway & Bank Settlement Matching" },
  ];

  // Cash Sign-off workflow
  const handleStartSignoff = (cr: CashReconciliationRecord) => {
    setSelectedCashRecord(cr);
    if (isAdmin) {
      signOffCashReconciliation(cr.id, user?.name || "Administrator");
    } else {
      setAdminPinModalOpen(true);
    }
  };

  const handleAdminPinConfirm = (reason: string, pin?: string) => {
    if (selectedCashRecord) {
      signOffCashReconciliation(
        selectedCashRecord.id,
        user?.name || "Staff Authorised by Admin",
        pin
      );
    }
    setAdminPinModalOpen(false);
    setSelectedCashRecord(null);
  };

  // Gateway Matching workflow
  const handleConfirmMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchingGatewayRecord || !bankRefInput.trim()) return;

    matchGatewaySettlement(
      matchingGatewayRecord.id,
      bankRefInput.trim(),
      user?.name || "Accounts Desk"
    );
    setMatchingGatewayRecord(null);
    setBankRefInput("");
  };

  // Cash Columns
  const cashColumns: Column<CashReconciliationRecord>[] = [
    {
      key: "date",
      header: "Date / Terminal",
      render: (cr) => (
        <div>
          <span className="font-bold text-sm text-chalk">{cr.registerName}</span>
          <p className="text-[11px] text-chalk/60 font-mono">{cr.date}</p>
        </div>
      ),
    },
    {
      key: "systemCash",
      header: "System Calculated",
      align: "right",
      render: (cr) => (
        <span className="font-mono text-xs font-semibold text-chalk">
          {formatINR(cr.systemCalculatedCash)}
        </span>
      ),
    },
    {
      key: "actualCash",
      header: "Actual Counted",
      align: "right",
      render: (cr) => (
        <span className="font-mono text-xs font-bold text-volt-400">
          {formatINR(cr.actualCountedCash)}
        </span>
      ),
    },
    {
      key: "variance",
      header: "Variance",
      align: "right",
      render: (cr) => {
        const isZero = cr.variance === 0;
        return (
          <span
            className={cn(
              "font-mono text-xs font-bold",
              isZero ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {isZero ? "₹0.00 (Balanced)" : `${formatINR(cr.variance)}`}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (cr) => (
        <StatusPill
          tone={
            cr.status === "SIGNED_OFF"
              ? "success"
              : cr.status === "MATCHED"
              ? "info"
              : "warning"
          }
          className="capitalize"
        >
          {cr.status.replace("_", " ")}
        </StatusPill>
      ),
    },
    {
      key: "cashier",
      header: "Cashier & Notes",
      render: (cr) => (
        <div>
          <span className="text-xs text-chalk/90 font-medium">{cr.cashierName}</span>
          {cr.notes && <p className="text-[11px] text-chalk/60 max-w-xs truncate">{cr.notes}</p>}
          {cr.signedOffBy && (
            <p className="text-[10px] text-volt-400 font-mono">Sign-off: {cr.signedOffBy}</p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (cr) => {
        const isSigned = cr.status === "SIGNED_OFF";
        return (
          <Button
            variant={isSigned ? "secondary" : "primary"}
            size="sm"
            disabled={isSigned}
            onClick={() => handleStartSignoff(cr)}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <ShieldCheck className="size-3" />
            {isSigned ? "Verified" : "Sign-off"}
          </Button>
        );
      },
    },
  ];

  // Gateway Columns
  const gatewayColumns: Column<GatewaySettlementRecord>[] = [
    {
      key: "batchId",
      header: "Batch ID / Gateway",
      render: (gw) => (
        <div>
          <span className="font-mono font-bold text-volt-400">{gw.batchId}</span>
          <p className="text-[11px] text-chalk/70 font-semibold">{gw.gateway}</p>
        </div>
      ),
    },
    {
      key: "date",
      header: "Settlement Date",
      render: (gw) => <span className="font-mono text-xs text-chalk/80">{gw.date}</span>,
    },
    {
      key: "grossAmount",
      header: "Gross Amount",
      align: "right",
      render: (gw) => (
        <span className="font-mono text-xs text-chalk font-semibold">
          {formatINR(gw.grossAmount)}
        </span>
      ),
    },
    {
      key: "feeGst",
      header: "MDR Fee + GST",
      align: "right",
      render: (gw) => (
        <span className="font-mono text-xs text-chalk/60 font-mono">
          - {formatINR(gw.feeGst)}
        </span>
      ),
    },
    {
      key: "netSettlement",
      header: "Net Bank Credit",
      align: "right",
      render: (gw) => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {formatINR(gw.netSettlement)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (gw) => (
        <StatusPill tone={gw.status === "MATCHED" ? "success" : "warning"}>
          {gw.status === "MATCHED" ? "Matched ✔" : "Unmatched ⚠"}
        </StatusPill>
      ),
    },
    {
      key: "bankRef",
      header: "Bank Reference",
      render: (gw) => (
        <div>
          {gw.bankRef ? (
            <span className="font-mono text-xs text-chalk/90">{gw.bankRef}</span>
          ) : (
            <span className="text-[11px] text-warning italic">Pending Bank CMS</span>
          )}
          {gw.matchedBy && (
            <p className="text-[10px] text-chalk/50 font-mono">By: {gw.matchedBy}</p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (gw) => {
        const isMatched = gw.status === "MATCHED";
        return (
          <Button
            variant={isMatched ? "secondary" : "primary"}
            size="sm"
            disabled={isMatched}
            onClick={() => {
              setMatchingGatewayRecord(gw);
              setBankRefInput(gw.bankRef || `HDFC-CMS-${Date.now().toString().slice(-8)}`);
            }}
            className="h-7 px-2.5 text-xs gap-1"
          >
            <CheckCircle2 className="size-3" />
            {isMatched ? "Matched" : "Mark Matched"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation & Settlements"
        subtitle="End-of-day register balancing, physical cash drawer sign-off, and gateway settlement clearance (FIN-12)."
      />

      <PeriodLockedBanner />
      <PeriodLockModal />

      {/* Tabs */}
      <Card className="p-5 space-y-4">
        <div className="border-b border-chalk/10 pb-3">
          <Tabs tabs={tabs} activeId={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "CASH" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-chalk/70 px-1">
              <span>
                Daily register cash counts verified against CCMS POS and Front Desk receipts
              </span>
              {!isAdmin && (
                <span className="text-warning flex items-center gap-1 font-medium">
                  <ShieldAlert className="size-3.5" /> Sign-off requires Admin PIN
                </span>
              )}
            </div>

            <Table
              columns={cashColumns}
              data={cashReconciliations}
              keyExtractor={(cr) => cr.id}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-chalk/70 px-1">
              <span>
                Matching batch settlements from Razorpay, PineLabs POS terminals, and PayTM UPI with bank statement credits
              </span>
            </div>

            <Table
              columns={gatewayColumns}
              data={gatewaySettlements}
              keyExtractor={(gw) => gw.id}
            />
          </div>
        )}
      </Card>

      {/* Mark Gateway Matched Modal */}
      {matchingGatewayRecord && (
        <Modal
          isOpen={Boolean(matchingGatewayRecord)}
          onClose={() => setMatchingGatewayRecord(null)}
          title={
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>Match Gateway Settlement Batch</span>
            </div>
          }
          maxWidth="md"
        >
          <form onSubmit={handleConfirmMatch} className="space-y-4 text-xs">
            <div className="rounded-lg bg-court-700/60 p-3 border border-chalk/10 space-y-1">
              <p className="font-bold text-chalk">
                Batch: {matchingGatewayRecord.batchId} ({matchingGatewayRecord.gateway})
              </p>
              <div className="flex justify-between text-chalk/80">
                <span>Net Credit Expected:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(matchingGatewayRecord.netSettlement)}
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-chalk/80 mb-1">
                Bank Statement Reference / CMS Ref <span className="text-danger">*</span>
              </label>
              <Input
                placeholder="e.g. HDFC-CMS-991823001"
                value={bankRefInput}
                onChange={(e) => setBankRefInput(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMatchingGatewayRecord(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm & Mark Matched
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Admin PIN Dialog for Cash Drawer Sign-off */}
      <AdminPinDialog
        isOpen={adminPinModalOpen}
        onClose={() => setAdminPinModalOpen(false)}
        onConfirm={handleAdminPinConfirm}
        title="Admin Sign-off Required"
        description="Daily cash reconciliation sign-off certifies physical vault counts. An administrator PIN (1234 or 9999) is required."
      />
    </div>
  );
}
