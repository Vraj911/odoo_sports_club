import { Printer, Download, Mail, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatINR } from "../hrStore";
import type { Payslip } from "../types";
import { toast } from "sonner";

export interface PayslipPreviewProps {
  payslip: Payslip;
  onClose?: () => void;
}

export function PayslipPreview({ payslip, onClose }: PayslipPreviewProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    toast.success(`Downloaded official payslip PDF: ${payslip.id}.pdf`);
  };

  const handleEmail = () => {
    toast.success(`Payslip ${payslip.id} emailed to ${payslip.employeeName}!`);
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between no-print gap-3 pb-2 border-b border-chalk/10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-volt-400">
            {payslip.id}
          </span>
          <span className="text-xs text-chalk/60">· {payslip.month}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleEmail} className="gap-1.5">
            <Mail className="size-3.5" /> Email
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadPDF} className="gap-1.5">
            <Download className="size-3.5" /> PDF
          </Button>
          <Button variant="primary" size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="size-3.5" /> Print
          </Button>
        </div>
      </div>

      {/* Standard White Paper Payslip Surface */}
      <div
        id="printable-payslip"
        className="rounded-2xl bg-white text-slate-900 p-8 shadow-2xl font-sans border border-slate-200 text-xs selection:bg-amber-100"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900 uppercase">
                Champions Sports Club
              </span>
              <span className="rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] px-1.5 py-0.5 border border-emerald-300">
                Official Payslip
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Plot 42, Bandra-Kurla Complex, Bandra West, Mumbai, MH 400051
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              GSTIN: 27AAAAA0000A1Z5 · PAN: AAATC1234D · TAN: MUMC01928F
            </p>
          </div>

          <div className="text-right space-y-0.5">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Salary Slip
            </p>
            <p className="text-xs font-semibold text-slate-700">{payslip.month}</p>
            <p className="text-[11px] text-slate-500 font-mono">Pay Date: {payslip.payDate}</p>
          </div>
        </div>

        {/* Employee Details Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 py-4 border-b border-slate-200 text-[11px]">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Employee ID:</span>
              <span className="font-bold text-slate-900 font-mono">{payslip.employeeId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Employee Name:</span>
              <span className="font-bold text-slate-900">{payslip.employeeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{payslip.department.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Designation:</span>
              <span className="font-semibold text-slate-800">{payslip.roleTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pay Period:</span>
              <span className="font-medium text-slate-700">{payslip.payPeriod}</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-semibold text-slate-800">{payslip.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Account:</span>
              <span className="font-mono font-semibold text-slate-900">{payslip.accountNumberMasked}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UAN / PF Number:</span>
              <span className="font-mono text-slate-700">{payslip.uan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">PAN:</span>
              <span className="font-mono font-semibold text-slate-900">{payslip.pan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <CheckCircle2 className="size-3" /> Transferred
              </span>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Table */}
        <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200 my-2">
          {/* Earnings Column */}
          <div className="pr-4 py-2">
            <div className="flex justify-between pb-1.5 border-b border-slate-300 font-bold text-[11px] text-slate-900 uppercase">
              <span>Earnings Component</span>
              <span>Amount (₹)</span>
            </div>
            <div className="divide-y divide-slate-100 space-y-1 pt-1.5">
              {payslip.earnings.map((e, idx) => (
                <div key={idx} className="flex justify-between py-1 text-[11px]">
                  <span className="text-slate-700">{e.label}</span>
                  <span className="font-mono font-medium text-slate-900">{formatINR(e.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions Column */}
          <div className="pl-4 py-2">
            <div className="flex justify-between pb-1.5 border-b border-slate-300 font-bold text-[11px] text-slate-900 uppercase">
              <span>Deductions Component</span>
              <span>Amount (₹)</span>
            </div>
            <div className="divide-y divide-slate-100 space-y-1 pt-1.5">
              {payslip.deductions.map((d, idx) => (
                <div key={idx} className="flex justify-between py-1 text-[11px]">
                  <span className="text-slate-700">{d.label}</span>
                  <span className="font-mono font-medium text-rose-700">{formatINR(d.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subtotals */}
        <div className="grid grid-cols-2 divide-x divide-slate-200 border-b-2 border-slate-900 py-2.5 bg-slate-50/80 rounded-lg px-2">
          <div className="pr-3 flex justify-between font-bold text-slate-900 text-xs">
            <span>Total Gross Earnings:</span>
            <span className="font-mono">{formatINR(payslip.grossEarnings)}</span>
          </div>
          <div className="pl-3 flex justify-between font-bold text-slate-900 text-xs">
            <span>Total Deductions:</span>
            <span className="font-mono text-rose-700">{formatINR(payslip.totalDeductions)}</span>
          </div>
        </div>

        {/* Net Pay Callout */}
        <div className="my-5 rounded-xl border-2 border-slate-900 bg-amber-50/60 p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Net Take-Home Salary
            </p>
            <p className="text-[11px] font-medium text-slate-700 italic mt-0.5">
              In Words: <strong className="text-slate-900">{payslip.netPayInWords}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono text-slate-900">
              {formatINR(payslip.netPay)}
            </span>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="pt-6 grid grid-cols-2 gap-8 text-[10px] text-slate-500">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-600" /> Digital System Record
            </p>
            <p>
              This is a computer-generated payslip under Maharashtra Shops & Establishments Act and does not require a physical signature.
            </p>
          </div>

          <div className="text-right space-y-4">
            <div className="border-b border-slate-400 w-44 ml-auto" />
            <p className="text-slate-700 font-semibold">Authorised Signatory / Finance Desk</p>
            <p className="text-[9px] text-slate-400 font-mono">Champions Club Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
