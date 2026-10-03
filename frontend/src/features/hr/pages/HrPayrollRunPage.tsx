import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore, formatINR } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { AdminPinDialog } from "@/components/shared/AdminPinDialog";
import { PayslipPreview } from "../components/PayslipPreview";
import type { PayrollRun, PayrollItem, Payslip } from "../types";
import {
  Banknote,
  ArrowLeft,
  CheckCircle2,
  Lock,
  FileText,
  AlertTriangle,
  Receipt,
  Download,
  Info,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export interface HrPayrollRunPageProps {
  params?: { runId?: string };
}

export default function HrPayrollRunPage({ params }: HrPayrollRunPageProps) {
  const go = useGo();
  const { payrollRuns, payslips, updatePayrollItem, finalisePayroll } = useHrStore();

  const runId = params?.runId || "PR-2026-10";
  const run = payrollRuns.find((r) => r.id === runId) || payrollRuns[payrollRuns.length - 1];

  const [isAdminPinOpen, setIsAdminPinOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  if (!run) {
    return (
      <div className="p-8 text-center text-chalk">
        <p className="text-lg font-bold">Payroll run not found</p>
        <Button variant="secondary" size="sm" onClick={() => go("/hr/payroll")} className="mt-4">
          Back to Payroll
        </Button>
      </div>
    );
  }

  const isFinalised = run.status === "FINALISED";

  const handleInlineChange = (
    employeeId: string,
    field: "overtimeHours" | "bonus",
    val: string
  ) => {
    if (isFinalised) return;
    const num = parseFloat(val) || 0;
    if (field === "overtimeHours") {
      const pay = num * 300; // ₹300/hr standard overtime rate
      updatePayrollItem(run.id, employeeId, { overtimeHours: num, overtimePay: pay });
    } else {
      updatePayrollItem(run.id, employeeId, { bonus: num });
    }
  };

  const handleFinaliseConfirm = (reason: string, pin?: string) => {
    const res = finalisePayroll(run.id, "Sunita Deshmukh (Admin)", Boolean(pin));
    setIsAdminPinOpen(false);
  };

  const handleOpenPayslip = (employeeId: string) => {
    // Find generated payslip for this employee and run
    const slip =
      payslips.find((p) => p.employeeId === employeeId && (p.payrollRunId === run.id || p.month === run.month)) ||
      payslips.find((p) => p.employeeId === employeeId) ||
      payslips[0];

    if (slip) {
      setSelectedPayslip(slip);
    } else {
      toast.info("Payslips will be generated immediately once payroll is finalised.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go("/hr/payroll")}
          className="gap-1 text-xs"
        >
          <ArrowLeft className="size-3.5" /> Back to Payroll Runs
        </Button>
      </div>

      <PageHeader
        title={`Payroll Cycle: ${run.month}`}
        subtitle={`Detailed compensation calculation, attendance days, overtime hours, bonuses, and statutory deductions (HR-06, HR-07).`}
        actions={
          <div className="flex items-center gap-2">
            {!isFinalised ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAdminPinOpen(true)}
                className="gap-1.5"
              >
                <CheckCircle2 className="size-3.5" /> Finalise Payroll (Admin PIN)
              </Button>
            ) : (
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1 flex items-center gap-1.5">
                <Lock className="size-3.5" /> FINALISED & AUDITED
              </span>
            )}
          </div>
        }
      />

      {/* Salaries Payable Posted Banner (FIN-10/12 Integration) */}
      {isFinalised && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="font-bold text-emerald-300">
                Salaries Payable Liability Recorded in General Ledger
              </p>
              <p className="text-emerald-200/80 mt-0.5">
                Total net amount of <strong className="text-volt-400 font-mono">{formatINR(run.totalNet)}</strong> has been posted to Accounts Payable and is available in Finance for disbursement.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => go("/finance/vendor-bills")}
            className="shrink-0 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40 text-xs"
          >
            View Payables in Finance <ExternalLink className="size-3 ml-1" />
          </Button>
        </div>
      )}

      {/* Summary Strip Card */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-[11px] text-chalk/50 uppercase font-semibold">Total Employees</span>
          <p className="text-xl font-black font-mono text-chalk">{run.items.length}</p>
          <p className="text-[10px] text-chalk/50">All active staff</p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] text-chalk/50 uppercase font-semibold">Gross Earnings</span>
          <p className="text-xl font-black font-mono text-chalk">{formatINR(run.totalGross)}</p>
          <p className="text-[10px] text-chalk/50">Base + OT + Bonus</p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-[11px] text-chalk/50 uppercase font-semibold">Total Deductions</span>
          <p className="text-xl font-black font-mono text-rose-300">{formatINR(run.totalDeductions)}</p>
          <p className="text-[10px] text-chalk/50">EPF + ESI + TDS + PT</p>
        </Card>

        <Card className="p-4 space-y-1 bg-volt-400/10 border-volt-400/30">
          <span className="text-[11px] text-volt-400 uppercase font-bold">Net Salary Disbursed</span>
          <p className="text-2xl font-black font-mono text-volt-400">{formatINR(run.totalNet)}</p>
          <p className="text-[10px] text-volt-400/80">Bank Transfer Total</p>
        </Card>
      </div>

      {/* Payroll Calculation Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-chalk">
              Employee Salary Computation Sheet
            </h3>
            {!isFinalised && (
              <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5">
                Editable Bonus & Overtime
              </span>
            )}
          </div>

          <span className="text-xs text-chalk/60 font-mono">
            Status: <strong className="text-volt-400 uppercase">{run.status}</strong>
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-chalk/14">
          <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
            <thead className="bg-court-700 text-chalk/70 font-semibold uppercase text-[10px] tracking-wider border-b border-chalk/14">
              <tr>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Dept</th>
                <th className="py-3 px-3 text-right">Base CTC</th>
                <th className="py-3 px-3 text-center">Days (Att / Lv)</th>
                <th className="py-3 px-3 text-right">Overtime (hrs / ₹)</th>
                <th className="py-3 px-3 text-right">Bonus (₹)</th>
                <th className="py-3 px-3 text-right">Gross (₹)</th>
                <th className="py-3 px-3 text-right">Deductions (₹)</th>
                <th className="py-3 px-3 text-right">Net Payable</th>
                <th className="py-3 px-3 text-right">Payslip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/10 bg-court-600/40">
              {run.items.map((item) => (
                <tr key={item.employeeId} className="hover:bg-court-700/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-chalk">
                    <p>{item.employeeName}</p>
                    <span className="text-[10px] text-chalk/50 font-mono">{item.employeeId}</span>
                  </td>
                  <td className="py-3 px-3 text-chalk/70 text-[11px]">
                    {item.department.replace("_", " ")}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-chalk">
                    {formatINR(item.baseMonthlySalary)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-[11px] text-chalk/80">
                    <span>{item.attendanceDays}d att</span>
                    {item.approvedPaidLeaveDays > 0 && (
                      <span className="text-emerald-400 block text-[10px]">
                        +{item.approvedPaidLeaveDays}d paid lv
                      </span>
                    )}
                    {item.unpaidLeaveDays > 0 && (
                      <span className="text-rose-400 block text-[10px]">
                        -{item.unpaidLeaveDays}d unpaid
                      </span>
                    )}
                  </td>

                  {/* Overtime (Inline Editable if DRAFT) */}
                  <td className="py-3 px-3 text-right font-mono">
                    {!isFinalised ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          value={item.overtimeHours}
                          onChange={(e) =>
                            handleInlineChange(item.employeeId, "overtimeHours", e.target.value)
                          }
                          className="w-14 h-7 text-right font-mono text-xs px-1.5"
                        />
                        <span className="text-[11px] text-volt-400 font-bold">
                          +{formatINR(item.overtimePay)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span>{item.overtimeHours}h</span>
                        <span className="text-volt-400 block text-[10px]">
                          +{formatINR(item.overtimePay)}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Bonus (Inline Editable if DRAFT) */}
                  <td className="py-3 px-3 text-right font-mono">
                    {!isFinalised ? (
                      <Input
                        type="number"
                        value={item.bonus}
                        onChange={(e) =>
                          handleInlineChange(item.employeeId, "bonus", e.target.value)
                        }
                        className="w-20 h-7 text-right font-mono text-xs px-1.5 ml-auto"
                      />
                    ) : (
                      <span className="text-emerald-400 font-bold">{formatINR(item.bonus)}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-semibold text-chalk">
                    {formatINR(item.grossSalary)}
                  </td>

                  {/* Deductions with breakdown tooltip */}
                  <td className="py-3 px-3 text-right font-mono text-rose-300">
                    <span
                      title={`PF: ₹${item.pfDeduction} | ESI: ₹${item.esiDeduction} | TDS: ₹${item.tdsDeduction} | PT: ₹200`}
                      className="cursor-help underline decoration-dotted"
                    >
                      {formatINR(item.totalDeductions)}
                    </span>
                  </td>

                  {/* Net Payable */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-volt-400 text-sm">
                    {formatINR(item.netPayable)}
                  </td>

                  {/* Payslip Action */}
                  <td className="py-3 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenPayslip(item.employeeId)}
                      className="gap-1 text-xs text-volt-400 hover:text-volt-300"
                    >
                      <FileText className="size-3" /> Payslip
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin PIN Dialog to Finalise Run */}
      <AdminPinDialog
        isOpen={isAdminPinOpen}
        onClose={() => setIsAdminPinOpen(false)}
        onConfirm={handleFinaliseConfirm}
        title={`Finalise Payroll: ${run.month}`}
        description={`This action locks all salaries, generates official employee payslips, and posts the ₹${run.totalNet.toLocaleString(
          "en-IN"
        )} liability to Finance Salaries Payable. Enter Admin PIN (1234 / 9999).`}
      />

      {/* Payslip Paper Preview Modal */}
      <Modal
        isOpen={Boolean(selectedPayslip)}
        onClose={() => setSelectedPayslip(null)}
        maxWidth="xl"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <FileText className="size-4" />
            </div>
            <span>Official Salary Slip Preview</span>
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
