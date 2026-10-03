import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore, formatINR } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import type { PayrollRun } from "../types";
import {
  Banknote,
  Plus,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function HrPayrollPage() {
  const go = useGo();
  const { payrollRuns } = useHrStore();

  const columns: Column<PayrollRun>[] = [
    {
      key: "month",
      header: "Payroll Month & Cycle",
      render: (run) => (
        <div className="space-y-0.5">
          <p className="font-bold text-chalk text-sm">{run.month}</p>
          <p className="text-[11px] text-chalk/50 font-mono">
            {run.id} · Fiscal {run.fiscalYear}
          </p>
        </div>
      ),
    },
    {
      key: "staffCount",
      header: "Staff Count",
      render: (run) => (
        <span className="font-mono text-xs text-chalk/80">
          {run.items.length} employees
        </span>
      ),
    },
    {
      key: "gross",
      header: "Total Gross",
      render: (run) => (
        <span className="font-mono text-xs text-chalk">
          {formatINR(run.totalGross)}
        </span>
      ),
    },
    {
      key: "deductions",
      header: "Statutory Deductions",
      render: (run) => (
        <span className="font-mono text-xs text-rose-300">
          {formatINR(run.totalDeductions)}
        </span>
      ),
    },
    {
      key: "net",
      header: "Net Disbursed / Payable",
      render: (run) => (
        <span className="font-mono font-bold text-sm text-volt-400">
          {formatINR(run.totalNet)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Run Status",
      render: (run) => (
        <StatusPill variant={run.status === "FINALISED" ? "success" : run.status === "REVIEWED" ? "info" : "warning"}>
          {run.status}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (run) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => go(`/hr/payroll/${run.id}`)}
          className="gap-1 text-xs text-volt-400 hover:text-volt-300"
        >
          {run.status === "FINALISED" ? "View Payslips" : "Open Run"} <ArrowRight className="size-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Payroll Engine & Salary Runs"
        subtitle="Manage salary computations, statutory deductions (PF, ESI, TDS), payslip generation, and liabilities (HR-06, HR-07, HR-08)."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => go(`/hr/payroll/${payrollRuns[payrollRuns.length - 1]?.id || "PR-2026-10"}`)}
            className="gap-1.5"
          >
            <Banknote className="size-3.5" /> Open Active October Run
          </Button>
        }
      />

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs text-chalk/60">Annualized Payroll Expense</p>
          <p className="text-2xl font-black font-mono text-chalk">₹52,80,000</p>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="size-3" /> Within FY26-27 HR budget
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-chalk/60">PF & ESI Compliance Rate</p>
          <p className="text-2xl font-black font-mono text-volt-400">100%</p>
          <p className="text-[11px] text-chalk/50 flex items-center gap-1">
            <ShieldCheck className="size-3 text-volt-400" /> EPFO & ESIC compliant
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-chalk/60">Last Finalised Run</p>
          <p className="text-2xl font-black font-mono text-emerald-400">September 2026</p>
          <p className="text-[11px] text-chalk/60 flex items-center gap-1">
            <CheckCircle2 className="size-3 text-emerald-400" /> 12 Payslips Disbursed
          </p>
        </Card>
      </div>

      {/* Payroll Runs History Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
            <Calendar className="size-4 text-volt-400" /> Payroll Runs Directory
          </h3>
        </div>

        <Table
          data={payrollRuns}
          columns={columns}
          keyExtractor={(run) => run.id}
          emptyTitle="No payroll runs recorded"
          emptySubtitle="No payroll cycles have been generated yet."
        />
      </Card>
    </div>
  );
}
