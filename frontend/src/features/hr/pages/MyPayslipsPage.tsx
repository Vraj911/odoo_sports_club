import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHrStore, formatINR } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Table, type Column } from "@/components/ui/Table";
import { PayslipPreview } from "../components/PayslipPreview";
import type { Payslip } from "../types";
import { Banknote, FileText, Download, Printer, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function MyPayslipsPage() {
  const { user } = useAuth();
  const { employees, payslips } = useHrStore();

  const currentEmployee =
    employees.find((e) => e.email === user?.email) || employees[0]!;

  const myPayslips = payslips.filter((p) => p.employeeId === currentEmployee.id);

  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const columns: Column<Payslip>[] = [
    {
      key: "month",
      header: "Salary Month & Cycle",
      render: (p) => (
        <div className="space-y-0.5">
          <p className="font-bold text-chalk text-sm">{p.month}</p>
          <p className="text-[11px] text-chalk/50 font-mono">
            {p.id} · {p.payPeriod}
          </p>
        </div>
      ),
    },
    {
      key: "gross",
      header: "Gross Earnings",
      render: (p) => <span className="font-mono text-xs text-chalk">{formatINR(p.grossEarnings)}</span>,
    },
    {
      key: "deductions",
      header: "Deductions",
      render: (p) => (
        <span className="font-mono text-xs text-rose-300">{formatINR(p.totalDeductions)}</span>
      ),
    },
    {
      key: "net",
      header: "Net Take-Home Pay",
      render: (p) => (
        <span className="font-mono font-bold text-sm text-volt-400">
          {formatINR(p.netPay)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <span className="inline-flex items-center gap-1 font-bold text-emerald-400 text-xs">
          <CheckCircle2 className="size-3.5" /> Disbursed
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedPayslip(p)}
            className="gap-1.5 text-xs text-volt-400 hover:text-volt-300"
          >
            <FileText className="size-3.5" /> View Payslip
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Salary Slips & Tax Summaries"
        subtitle={`Official monthly payslips, statutory deductions breakdown, and tax summaries for ${currentEmployee.name} (HR-08).`}
      />

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="size-4 text-volt-400" />
            <h3 className="text-sm font-semibold text-chalk">Issued Monthly Salary Slips</h3>
          </div>
          <span className="text-xs text-chalk/60 font-mono">
            {myPayslips.length} slips available
          </span>
        </div>

        <Table
          data={myPayslips}
          columns={columns}
          keyExtractor={(p) => p.id}
          emptyTitle="No payslips issued"
          emptySubtitle="No payslips issued yet for this account."
        />
      </Card>

      {/* Payslip Modal */}
      <Modal
        isOpen={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
        maxWidth="xl"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <FileText className="size-4" />
            </div>
            <span>Official Salary Slip · {selectedPayslip?.month}</span>
          </div>
        }
      >
        {selectedPayslip && (
          <PayslipPreview
            payslip={selectedPayslip}
            onClose={() => setSelectedPayslip(null)}
          />
        )}
      </Modal>
    </div>
  );
}
