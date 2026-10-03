import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { ShiftTemplate, Department, RosterAssignment, Employee } from "../types";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Sparkles,
  Info,
  Clock,
  CheckCircle2,
  Trash2,
  CalendarDays,
  Coffee,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

// Dates for Week 41 (October 5 - October 11, 2026)
const WEEK_DAYS = [
  { date: "2026-10-05", dayName: "Mon", dayNum: "05" },
  { date: "2026-10-06", dayName: "Tue", dayNum: "06" },
  { date: "2026-10-07", dayName: "Wed", dayNum: "07" },
  { date: "2026-10-08", dayName: "Thu", dayNum: "08" },
  { date: "2026-10-09", dayName: "Fri", dayNum: "09" },
  { date: "2026-10-10", dayName: "Sat", dayNum: "10" },
  { date: "2026-10-11", dayName: "Sun", dayNum: "11" },
];

export default function HrRosterPage() {
  const go = useGo();
  const {
    employees,
    shiftTemplates,
    roster,
    leaveRequests,
    holidays,
    assignShift,
    markRosterOff,
    removeShift,
  } = useHrStore();

  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  // Assign shift modal
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    employee: Employee | null;
    date: string;
    existingAssignment?: RosterAssignment | null;
  }>({
    isOpen: false,
    employee: null,
    date: "",
    existingAssignment: null,
  });

  const [activeTemplateId, setActiveTemplateId] = useState<string>("SHIFT-MORN");

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (selectedDept !== "ALL" && emp.department !== selectedDept) return false;
      return true;
    });
  }, [employees, selectedDept]);

  // Check if an employee is on approved leave on a given date (BR-13)
  const getApprovedLeave = (employeeId: string, date: string) => {
    return leaveRequests.find(
      (lv) =>
        lv.employeeId === employeeId &&
        lv.status === "APPROVED" &&
        date >= lv.startDate &&
        date <= lv.endDate
    );
  };

  // Check if date is a holiday
  const getHoliday = (date: string) => {
    return holidays.find((h) => h.date === date);
  };

  // Cell click handler
  const handleCellClick = (employee: Employee, date: string) => {
    const leave = getApprovedLeave(employee.id, date);
    if (leave) {
      toast.error(
        `Assignment Blocked (BR-13): ${employee.name} is on approved ${leave.leaveType} leave on ${date}.`
      );
      return;
    }

    const existing = roster.find((r) => r.employeeId === employee.id && r.date === date);
    setAssignModal({
      isOpen: true,
      employee,
      date,
      existingAssignment: existing || null,
    });
  };

  const handleApplyShift = (templateId: string) => {
    if (!assignModal.employee) return;
    const res = assignShift(assignModal.employee.id, assignModal.date, templateId);
    if (res.success) {
      setAssignModal({ isOpen: false, employee: null, date: "", existingAssignment: null });
    }
  };

  const handleMarkWeeklyOff = () => {
    if (!assignModal.employee) return;
    markRosterOff(assignModal.employee.id, assignModal.date);
    setAssignModal({ isOpen: false, employee: null, date: "", existingAssignment: null });
  };

  const handleRemoveAssignment = () => {
    if (!assignModal.existingAssignment) return;
    removeShift(assignModal.existingAssignment.id);
    setAssignModal({ isOpen: false, employee: null, date: "", existingAssignment: null });
  };

  // Calculate department coverage count for a date
  const getDeptCoverage = (dept: Department, date: string, shiftType?: "MORNING" | "EVENING") => {
    const assignmentsOnDate = roster.filter((r) => r.date === date && !r.isOff);
    return assignmentsOnDate.filter((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      if (!emp || emp.department !== dept) return false;
      if (!shiftType) return true;
      const tmpl = shiftTemplates.find((t) => t.id === a.shiftTemplateId);
      return tmpl?.type === shiftType;
    }).length;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Weekly Roster & Scheduling"
        subtitle="Manage shifts, ensure department coverage minimums, detect staffing gaps, and enforce approved-leave blocks (HR-02, HR-09, BR-13)."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => go("/hr/leave")}
              className="gap-1.5"
            >
              Leave Approvals
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.info("Week schedule published and broadcast to all staff /my portal.")}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" /> Publish Roster
            </Button>
          </div>
        }
      />

      {/* Top Controls Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Week Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full bg-court-700 p-1 border border-chalk/10">
              <button
                type="button"
                onClick={() => toast.info("Viewing Previous Week (28 Sep - 4 Oct)")}
                className="size-7 rounded-full flex items-center justify-center text-chalk/70 hover:text-chalk hover:bg-chalk/10"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-3 text-xs font-bold text-chalk font-mono">
                Week 5–11 Oct 2026
              </span>
              <button
                type="button"
                onClick={() => toast.info("Viewing Next Week (12 - 18 Oct)")}
                className="size-7 rounded-full flex items-center justify-center text-chalk/70 hover:text-chalk hover:bg-chalk/10"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-full bg-court-700 p-1 border border-chalk/10 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  viewMode === "week" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/70"
                )}
              >
                Week View
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("month");
                  toast.info("Month overview view loaded.");
                }}
                className={cn(
                  "rounded-full px-3 py-1 font-medium transition-colors",
                  viewMode === "month" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/70"
                )}
              >
                Month View
              </button>
            </div>
          </div>

          {/* Shift Templates Bar (Drag/Click Palette) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-chalk/50 uppercase font-semibold">Templates:</span>
            {shiftTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTemplateId(t.id);
                  toast.info(`Selected ${t.name}. Click any employee day cell to assign.`);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm",
                  t.color,
                  activeTemplateId === t.id ? "ring-2 ring-volt-400 font-bold scale-105" : "hover:opacity-80"
                )}
              >
                <Clock className="size-3" />
                <span>{t.name}</span>
                <span className="text-[10px] opacity-70">({t.startTime})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend & Department Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-chalk/10 text-xs text-chalk/70">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-chalk/90">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-400" /> Morning (06:00-14:00)
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-sky-400" /> Evening (14:00-22:00)
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-purple-400" /> Night (22:00-06:00)
            </span>
            <span className="flex items-center gap-1 text-rose-300 font-semibold">
              <span className="px-1 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 border-dashed text-[10px]">
                Leave ▒
              </span>
              (BR-13 Locked)
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-semibold">
              <span>✦</span> Club Holiday
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-chalk/50">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="h-8 rounded-lg bg-court-700 border border-chalk/14 px-2 text-xs text-chalk focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              <option value="FRONT_DESK">Front Desk</option>
              <option value="BAR">Bar & Lounge</option>
              <option value="KITCHEN">Kitchen</option>
              <option value="SHOP">Pro Shop</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="COACHING">Coaching</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Roster Grid Table */}
      <div className="rounded-2xl border border-chalk/14 bg-court-600/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[900px]">
            {/* Header: Days of the week */}
            <thead className="bg-court-700 text-chalk font-semibold border-b border-chalk/14">
              <tr>
                <th className="py-3 px-4 w-56 sticky left-0 bg-court-700 z-10 border-r border-chalk/10">
                  Staff Member
                </th>
                {WEEK_DAYS.map((day) => {
                  const holiday = getHoliday(day.date);
                  return (
                    <th
                      key={day.date}
                      className={cn(
                        "py-3 px-3 text-center border-r border-chalk/10 last:border-r-0",
                        day.date === "2026-10-07" && "bg-volt-400/5",
                        holiday && "bg-purple-500/10 text-purple-200"
                      )}
                    >
                      <div className="space-y-0.5">
                        <span className="text-[11px] uppercase tracking-wider text-chalk/60 font-mono">
                          {day.dayName}
                        </span>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm font-bold font-mono text-chalk">
                            {day.dayNum}
                          </span>
                          {holiday && (
                            <span className="text-purple-400" title={`Holiday: ${holiday.name}`}>
                              ✦
                            </span>
                          )}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Body: Employees Rows */}
            <tbody className="divide-y divide-chalk/10">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-chalk/5 transition-colors">
                  {/* Sticky Employee Column */}
                  <td className="py-3 px-4 sticky left-0 bg-court-600 z-10 border-r border-chalk/10 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="size-8 rounded-full object-cover border border-chalk/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-chalk text-xs truncate">{emp.name}</p>
                        <p className="text-[10px] text-chalk/50 truncate font-mono">
                          {emp.department.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* 7 Days Cells */}
                  {WEEK_DAYS.map((day) => {
                    const assignment = roster.find(
                      (r) => r.employeeId === emp.id && r.date === day.date
                    );
                    const leave = getApprovedLeave(emp.id, day.date);
                    const holiday = getHoliday(day.date);

                    return (
                      <td
                        key={day.date}
                        onClick={() => handleCellClick(emp, day.date)}
                        className={cn(
                          "py-2 px-2 text-center border-r border-chalk/10 last:border-r-0 cursor-pointer transition-all hover:bg-chalk/10",
                          day.date === "2026-10-07" && "bg-volt-400/5",
                          leave && "bg-rose-500/10 cursor-not-allowed"
                        )}
                      >
                        {leave ? (
                          <div
                            className="rounded-lg border border-dashed border-rose-500/50 bg-rose-500/20 p-2 text-rose-300 text-[11px] font-semibold text-center space-y-0.5"
                            title={`BR-13 RULE: ${emp.name} is on approved ${leave.leaveType} leave on ${day.date}. Roster assignment is locked.`}
                          >
                            <p className="font-bold flex items-center justify-center gap-1">
                              Leave ▒
                            </p>
                            <p className="text-[9px] opacity-80 uppercase">{leave.leaveType}</p>
                          </div>
                        ) : assignment ? (
                          assignment.isOff ? (
                            <div className="rounded-lg border border-chalk/10 bg-court-700/60 p-2 text-chalk/40 text-[11px] font-medium text-center">
                              Weekly Off
                            </div>
                          ) : (
                            <div
                              className={cn(
                                "rounded-lg border p-2 text-[11px] font-medium transition-transform hover:scale-102 text-left space-y-0.5",
                                assignment.color
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-[10px] uppercase truncate">
                                  {assignment.shiftName.split(" ")[0]}
                                </span>
                                <span className="text-[9px] opacity-75 font-mono">
                                  {assignment.startTime}
                                </span>
                              </div>
                              <p className="text-[10px] opacity-70 font-mono">
                                {assignment.startTime} - {assignment.endTime}
                              </p>
                            </div>
                          )
                        ) : (
                          <div className="h-10 rounded-lg border border-dashed border-chalk/10 flex items-center justify-center text-chalk/30 hover:border-volt-400/50 hover:text-volt-400 text-xs">
                            <Plus className="size-3.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/* Bottom Coverage Summary Row */}
            <tfoot className="bg-court-700/90 text-chalk border-t-2 border-chalk/20 text-xs font-semibold">
              {/* Bar Coverage Row */}
              <tr>
                <td className="py-2.5 px-4 sticky left-0 bg-court-700 z-10 border-r border-chalk/10 text-amber-300 font-bold">
                  Bar Staff Coverage
                </td>
                {WEEK_DAYS.map((day) => {
                  const morn = getDeptCoverage("BAR", day.date, "MORNING");
                  const eve = getDeptCoverage("BAR", day.date, "EVENING");
                  const hasGap = eve === 0;

                  return (
                    <td
                      key={day.date}
                      className={cn(
                        "py-2 px-2 text-center border-r border-chalk/10 last:border-r-0",
                        hasGap ? "bg-amber-500/20 text-amber-300" : "text-chalk/80"
                      )}
                    >
                      {hasGap ? (
                        <div
                          className="flex flex-col items-center gap-0.5 text-amber-300 font-bold text-[10px]"
                          title="Coverage Gap: No bar staff assigned for Evening shift!"
                        >
                          <span className="flex items-center gap-1 text-[10px] text-amber-400">
                            <AlertTriangle className="size-3" /> Gap: 0 eve
                          </span>
                          <span className="text-[9px] opacity-80 font-mono">M:{morn} E:{eve}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-emerald-400">
                          M:{morn} · E:{eve}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Front Desk Coverage Row */}
              <tr>
                <td className="py-2.5 px-4 sticky left-0 bg-court-700 z-10 border-r border-chalk/10 text-sky-300 font-bold">
                  Front Desk Coverage
                </td>
                {WEEK_DAYS.map((day) => {
                  const morn = getDeptCoverage("FRONT_DESK", day.date, "MORNING");
                  const eve = getDeptCoverage("FRONT_DESK", day.date, "EVENING");

                  return (
                    <td
                      key={day.date}
                      className="py-2 px-2 text-center border-r border-chalk/10 last:border-r-0 font-mono text-[11px] text-emerald-400"
                    >
                      M:{morn} · E:{eve}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Assign / Edit Shift Modal */}
      <Modal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, employee: null, date: "", existingAssignment: null })}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <CalendarClock className="size-4" />
            </div>
            <span>
              Assign Shift · {assignModal.employee?.name} ({assignModal.date})
            </span>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <p className="text-chalk/80">
            Select a shift template from the standard roster schedules or mark as a weekly off:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            {shiftTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleApplyShift(t.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all hover:scale-102 flex flex-col justify-between gap-1",
                  t.color
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{t.name}</span>
                  <Clock className="size-3.5 opacity-60" />
                </div>
                <p className="text-[11px] font-mono opacity-80">
                  {t.startTime} to {t.endTime} ({t.hours} hrs)
                </p>
              </button>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-chalk/10">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkWeeklyOff}
              className="text-xs"
            >
              Mark Weekly Off
            </Button>

            {assignModal.existingAssignment && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleRemoveAssignment}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="size-3.5" /> Clear Cell
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
