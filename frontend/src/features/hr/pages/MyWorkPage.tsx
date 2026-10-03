import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHrStore, formatINR } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { ClockWidget } from "../components/ClockWidget";
import { LeaveBalanceRing } from "../components/LeaveBalanceRing";
import { PayslipPreview } from "../components/PayslipPreview";
import {
  CalendarClock,
  Clock,
  Plane,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight,
  FileText,
  Coffee,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function MyWorkPage() {
  const go = useGo();
  const { user } = useAuth();
  const { employees, roster, leaveRequests, payslips, activeClockSessions } = useHrStore();

  // Pick logged in employee or default to Aarav Sharma (EMP-001)
  const currentEmployee =
    employees.find((e) => e.email === user?.email) || employees[0]!;

  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);

  const isClockedIn = Boolean(activeClockSessions[currentEmployee.id]);

  // Today's shift (Simulated today: 2026-10-05)
  const todayDate = "2026-10-05";
  const todayShift = roster.find(
    (r) => r.employeeId === currentEmployee.id && r.date === todayDate
  );

  // My upcoming shifts
  const myUpcomingShifts = roster
    .filter((r) => r.employeeId === currentEmployee.id && r.date >= todayDate)
    .slice(0, 4);

  // Latest payslip
  const myLatestPayslip =
    payslips.find((p) => p.employeeId === currentEmployee.id) || payslips[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${currentEmployee.name.split(" ")[0]}!`}
        subtitle={`${currentEmployee.roleTitle} · ${currentEmployee.department.replace("_", " ")} Department · Employee ID: ${currentEmployee.id}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/my/leave")}
              className="gap-1.5"
            >
              <Plane className="size-3.5" /> Request Leave
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => go("/my/roster")}
              className="gap-1.5"
            >
              <CalendarClock className="size-3.5" /> My Weekly Schedule
            </Button>
          </div>
        }
      />

      {/* Main Clock-in Terminal Card */}
      <ClockWidget
        employeeId={currentEmployee.id}
        employeeName={currentEmployee.name}
      />

      {/* Secondary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Today's Shift & Roster Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Shift Card */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-volt-400" />
                <h3 className="text-sm font-semibold text-chalk">Today's Assigned Shift</h3>
              </div>
              <span className="text-xs text-chalk/60 font-mono">Monday, 5 Oct 2026</span>
            </div>

            {todayShift ? (
              <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-chalk">{todayShift.shiftName}</span>
                    <span className="rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-bold px-2 py-0.5">
                      Front Desk Desk 1
                    </span>
                  </div>
                  <p className="text-xs font-mono text-chalk/70">
                    Timings: <strong className="text-volt-400">{todayShift.startTime} - {todayShift.endTime}</strong> (8 Hours)
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <StatusPill variant={isClockedIn ? "success" : "warning"}>
                    {isClockedIn ? "SHIFT IN PROGRESS" : "NOT STARTED"}
                  </StatusPill>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-chalk/50 text-xs rounded-xl bg-court-700/30">
                No shift assigned for today. Enjoy your day off!
              </div>
            )}
          </Card>

          {/* Upcoming Schedule Snippet */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
                <Clock className="size-4 text-volt-400" /> My Upcoming Shifts this Week
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => go("/my/roster")}
                className="text-xs text-volt-400 hover:text-volt-300"
              >
                View full roster <ArrowRight className="size-3 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myUpcomingShifts.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-chalk/10 bg-court-700/40 p-3.5 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-chalk font-mono">{s.date}</p>
                    <p className="text-[11px] text-chalk/60">{s.shiftName}</p>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-volt-400">
                    {s.startTime} - {s.endTime}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Leave Balances & Latest Payslip */}
        <div className="space-y-6">
          {/* Leave Balances */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
                <Plane className="size-4 text-volt-400" /> My Leave Balances
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => go("/my/leave")}
                className="text-xs text-volt-400 hover:text-volt-300"
              >
                Request <ChevronRight className="size-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <LeaveBalanceRing
                label="Casual Leave"
                total={currentEmployee.leaveBalances.casual.total}
                used={currentEmployee.leaveBalances.casual.used}
                color="stroke-sky-400"
              />
              <LeaveBalanceRing
                label="Sick Leave"
                total={currentEmployee.leaveBalances.sick.total}
                used={currentEmployee.leaveBalances.sick.used}
                color="stroke-amber-400"
              />
            </div>
          </div>

          {/* Latest Payslip Quick Card */}
          <Card className="p-5 space-y-3 border-volt-400/20 bg-gradient-to-br from-court-500 to-volt-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-volt-400" />
                <h3 className="text-sm font-semibold text-chalk">Latest Payslip</h3>
              </div>
              <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5">
                DISBURSED
              </span>
            </div>

            {myLatestPayslip ? (
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-chalk/60">{myLatestPayslip.month}</span>
                  <span className="text-lg font-black font-mono text-volt-400">
                    {formatINR(myLatestPayslip.netPay)}
                  </span>
                </div>
                <p className="text-[11px] text-chalk/60">
                  Credited to {myLatestPayslip.bankName} ({myLatestPayslip.accountNumberMasked})
                </p>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedPayslip(myLatestPayslip)}
                    className="w-full text-xs gap-1.5"
                  >
                    <FileText className="size-3.5" /> View & Print Payslip
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-chalk/50">No payslips issued yet.</p>
            )}
          </Card>
        </div>
      </div>

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
            <span>My Salary Slip</span>
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
