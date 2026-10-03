import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore, formatINR } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { ClockWidget } from "../components/ClockWidget";
import {
  Users,
  CalendarClock,
  Fingerprint,
  Plane,
  Banknote,
  PartyPopper,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function HrOverviewPage() {
  const go = useGo();
  const { employees, roster, attendance, leaveRequests, payrollRuns, activeClockSessions } = useHrStore();

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "ACTIVE").length;
  const clockedInCount = Object.keys(activeClockSessions).length;
  const pendingLeaves = leaveRequests.filter((l) => l.status === "PENDING").length;

  const currentRun = payrollRuns[payrollRuns.length - 1];

  // Detect coverage gap for today/tomorrow
  const today = "2026-10-07"; // Simulated Wednesday with known bar gap
  const barEveningStaff = roster.filter(
    (r) => r.date === today && r.shiftTemplateId === "SHIFT-EVE" && employees.find((e) => e.id === r.employeeId)?.department === "BAR"
  );
  const hasBarGap = barEveningStaff.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Human Resources & Staff Operations"
        subtitle="Staff directory, weekly roster, live biometric attendance, leave approvals, and compliant payroll runs (HR-01 to HR-09)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/hr/roster")}
              className="gap-1.5"
            >
              <CalendarClock className="size-3.5" /> Open Roster
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => go("/hr/payroll")}
              className="gap-1.5"
            >
              <Banknote className="size-3.5" /> Manage Payroll
            </Button>
          </div>
        }
      />

      {/* Critical Coverage Alert Banner */}
      {hasBarGap && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <p className="font-bold text-amber-300">
                Critical Roster Coverage Warning: Bar Evening Shift (Wed Oct 7)
              </p>
              <p className="text-amber-200/80 mt-0.5">
                Rohan Varma is on approved Medical Leave and Vikram Singh is scheduled for morning. Zero bar staff are assigned for the evening rush.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => go("/hr/roster")}
            className="shrink-0 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/40 text-xs"
          >
            Fix in Roster <ArrowRight className="size-3 ml-1" />
          </Button>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <p className="text-xs text-chalk/60 font-medium">Total Staff</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-volt-400 font-mono">
              {activeEmployees}
            </span>
            <span className="text-[11px] text-chalk/50 font-mono">/ {totalEmployees} active</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <ShieldCheck className="size-3" /> All 7 depts covered
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-chalk/60 font-medium">Clocked In Now</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-volt-400 font-mono">
              {clockedInCount}
            </span>
            <span className="text-[11px] text-chalk/50 font-mono">live on duty</span>
          </div>
          <p className="text-[11px] text-volt-400 font-medium flex items-center gap-1">
            <Clock className="size-3" /> Front desk & bar active
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-chalk/60 font-medium">Pending Leave Requests</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {pendingLeaves}
            </span>
            <span className="text-[11px] text-chalk/50 font-mono">requests</span>
          </div>
          <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
            <Plane className="size-3" /> Requires admin review
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-xs text-chalk/60 font-medium">October Payroll Run</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-chalk font-mono">
              {currentRun ? formatINR(currentRun.totalNet) : "—"}
            </span>
            <span className="text-[11px] text-volt-400 font-semibold uppercase">
              {currentRun?.status || "DRAFT"}
            </span>
          </div>
          <p className="text-[11px] text-chalk/60 font-medium flex items-center gap-1">
            <TrendingUp className="size-3" /> Ready for final review
          </p>
        </Card>
      </div>

      {/* Main Grid: Live Clock Widget & Quick Nav Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Clock Widget */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
              <Fingerprint className="size-4 text-volt-400" /> Administrative Time Clock Terminal
            </h3>
            <span className="text-xs text-chalk/60">Simulate staff clock-in / clock-out</span>
          </div>
          <ClockWidget employeeId="EMP-001" employeeName="Aarav Sharma" />

          {/* Today's Attendance Snapshot */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-chalk uppercase tracking-wider">
                Live Attendance Feed
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => go("/hr/attendance")}
                className="text-xs text-volt-400 hover:text-volt-300"
              >
                View full log <ArrowRight className="size-3 ml-1" />
              </Button>
            </div>

            <div className="divide-y divide-chalk/10">
              {attendance.slice(0, 4).map((att) => (
                <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-chalk">{att.employeeName}</p>
                    <p className="text-[11px] text-chalk/60">{att.shift}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-chalk/80">
                      In: <strong className="text-chalk">{att.clockIn || "—"}</strong>
                    </span>
                    <StatusPill variant={att.status === "PRESENT" ? "success" : att.status === "LATE" ? "warning" : "danger"}>
                      {att.status}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Quick Module Launchers */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
            <Users className="size-4 text-volt-400" /> HR Operational Modules
          </h3>

          <div className="space-y-2.5">
            {[
              {
                title: "Employee Directory",
                desc: "12 staff profiles, salary structures, bank details & coaching tags.",
                path: "/hr/employees",
                icon: Users,
                color: "text-sky-400",
              },
              {
                title: "Shift Roster & Gaps",
                desc: "Interactive weekly calendar, drag template, leave locks & gap alerts.",
                path: "/hr/roster",
                icon: CalendarClock,
                color: "text-amber-400",
              },
              {
                title: "Attendance & Corrections",
                desc: "Biometric time punch records, audits, late flags & ReasonDialog corrections.",
                path: "/hr/attendance",
                icon: Fingerprint,
                color: "text-emerald-400",
              },
              {
                title: "Leave Approvals Queue",
                desc: "3 requests pending. Coverage checks, balance updates & roster sync.",
                path: "/hr/leave",
                icon: Plane,
                color: "text-rose-400",
              },
              {
                title: "Monthly Payroll Engine",
                desc: "October 2026 run. Inline bonus edits, PF/ESI/TDS, payslip generator.",
                path: "/hr/payroll",
                icon: Banknote,
                color: "text-volt-400",
              },
              {
                title: "Club Holiday Calendar",
                desc: "Declared club holidays, booking closure flags & facility maintenance.",
                path: "/hr/holidays",
                icon: PartyPopper,
                color: "text-purple-400",
              },
            ].map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.path}
                  onClick={() => go(mod.path)}
                  className="rounded-[20px] border border-chalk/14 bg-court-500 p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all hover:border-chalk/28 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-court-600 border border-chalk/10">
                      <Icon className={`size-4 ${mod.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-chalk">{mod.title}</p>
                      <p className="text-[11px] text-chalk/60 line-clamp-1">{mod.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-chalk/40 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
