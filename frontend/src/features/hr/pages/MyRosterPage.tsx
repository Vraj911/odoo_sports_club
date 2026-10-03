import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHrStore } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Calendar,
  Sparkles,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const WEEK_DAYS = [
  { date: "2026-10-05", dayName: "Monday", dayNum: "05 Oct" },
  { date: "2026-10-06", dayName: "Tuesday", dayNum: "06 Oct" },
  { date: "2026-10-07", dayName: "Wednesday", dayNum: "07 Oct" },
  { date: "2026-10-08", dayName: "Thursday", dayNum: "08 Oct" },
  { date: "2026-10-09", dayName: "Friday", dayNum: "09 Oct" },
  { date: "2026-10-10", dayName: "Saturday", dayNum: "10 Oct" },
  { date: "2026-10-11", dayName: "Sunday", dayNum: "11 Oct" },
];

export default function MyRosterPage() {
  const go = useGo();
  const { user } = useAuth();
  const { employees, roster, leaveRequests, holidays } = useHrStore();

  const currentEmployee =
    employees.find((e) => e.email === user?.email) || employees[0]!;

  const myAssignments = roster.filter((r) => r.employeeId === currentEmployee.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Weekly Work Roster"
        subtitle={`Scheduled shifts, approved time-off, and weekly offs for ${currentEmployee.name} (${currentEmployee.department.replace("_", " ")}).`}
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
              onClick={() => go("/my")}
              className="gap-1.5"
            >
              Today's Shift
            </Button>
          </div>
        }
      />

      {/* Week Selector Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-volt-400" />
          <div>
            <h3 className="text-sm font-bold text-chalk">Current Week Schedule</h3>
            <p className="text-xs text-chalk/60 font-mono">5 October – 11 October 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-full bg-court-700 p-1 border border-chalk/10">
          <button
            type="button"
            onClick={() => toast.info("Viewing Previous Week")}
            className="size-7 rounded-full flex items-center justify-center text-chalk/70 hover:text-chalk"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-3 text-xs font-bold text-chalk font-mono">Week 41</span>
          <button
            type="button"
            onClick={() => toast.info("Viewing Next Week")}
            className="size-7 rounded-full flex items-center justify-center text-chalk/70 hover:text-chalk"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </Card>

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {WEEK_DAYS.map((day) => {
          const assignment = myAssignments.find((r) => r.date === day.date);
          const leave = leaveRequests.find(
            (l) =>
              l.employeeId === currentEmployee.id &&
              l.status === "APPROVED" &&
              day.date >= l.startDate &&
              day.date <= l.endDate
          );
          const holiday = holidays.find((h) => h.date === day.date);

          return (
            <Card
              key={day.date}
              className={cn(
                "p-5 space-y-3 transition-all",
                day.date === "2026-10-05" && "border-volt-400/40 bg-court-500/90 shadow-lg",
                leave && "border-rose-500/40 bg-rose-950/10"
              )}
            >
              <div className="flex items-center justify-between border-b border-chalk/10 pb-2">
                <div>
                  <p className="text-xs font-semibold text-chalk/60 uppercase">{day.dayName}</p>
                  <p className="text-sm font-bold font-mono text-chalk">{day.dayNum}</p>
                </div>
                {day.date === "2026-10-05" && (
                  <span className="rounded-full bg-volt-400 text-ink-900 text-[10px] font-bold px-2 py-0.5">
                    TODAY
                  </span>
                )}
                {holiday && (
                  <span className="rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5">
                    ✦ Holiday
                  </span>
                )}
              </div>

              {leave ? (
                <div className="rounded-xl border border-dashed border-rose-500/50 bg-rose-500/10 p-3 space-y-1">
                  <div className="flex items-center justify-between text-rose-300 text-xs font-bold">
                    <span>Approved Leave ▒</span>
                    <span className="uppercase text-[10px]">{leave.leaveType}</span>
                  </div>
                  <p className="text-[11px] text-rose-200/80 italic">"{leave.reason}"</p>
                </div>
              ) : assignment ? (
                assignment.isOff ? (
                  <div className="rounded-xl border border-chalk/10 bg-court-700/50 p-4 text-center text-xs text-chalk/50 font-medium">
                    Weekly Off
                  </div>
                ) : (
                  <div
                    className={cn(
                      "rounded-xl border p-3.5 space-y-2",
                      assignment.color
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{assignment.shiftName}</span>
                      <Clock className="size-3.5 opacity-70" />
                    </div>
                    <div className="text-xs font-mono font-semibold">
                      {assignment.startTime} - {assignment.endTime}
                    </div>
                    <span className="text-[10px] opacity-75 block">Duration: 8.0 Hours</span>
                  </div>
                )
              ) : (
                <div className="p-4 text-center text-chalk/30 text-xs rounded-xl border border-dashed border-chalk/10">
                  Not Scheduled
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
