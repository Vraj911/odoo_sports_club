// CCMS HR Store using useSyncExternalStore for reactive client-side HR & Payroll state

import { useSyncExternalStore, useMemo } from "react";
import type {
  Employee,
  ShiftTemplate,
  RosterAssignment,
  AttendanceRecord,
  LeaveRequest,
  Holiday,
  PayrollRun,
  Payslip,
  Department,
  LeaveType,
  ShiftType,
} from "./types";
import {
  SHIFT_TEMPLATES,
  INITIAL_EMPLOYEES,
  INITIAL_ROSTER,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_HOLIDAYS,
  INITIAL_PAYROLL_RUNS,
  INITIAL_PAYSLIPS,
} from "./sampleData";
import { toast } from "sonner";

interface HrStoreState {
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  roster: RosterAssignment[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];
  payrollRuns: PayrollRun[];
  payslips: Payslip[];
  activeClockSessions: Record<string, { clockInTime: string; method: string }>; // employeeId -> session
}

let state: HrStoreState = {
  employees: INITIAL_EMPLOYEES,
  shiftTemplates: SHIFT_TEMPLATES,
  roster: INITIAL_ROSTER,
  attendance: INITIAL_ATTENDANCE,
  leaveRequests: INITIAL_LEAVE_REQUESTS,
  holidays: INITIAL_HOLIDAYS,
  payrollRuns: INITIAL_PAYROLL_RUNS,
  payslips: INITIAL_PAYSLIPS,
  activeClockSessions: {
    "EMP-001": { clockInTime: "13:54", method: "BUTTON" },
    "EMP-003": { clockInTime: "14:00", method: "PIN" },
    "EMP-005": { clockInTime: "09:25", method: "BUTTON" },
  },
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): HrStoreState {
  return state;
}

// ─── Number to Words Helper (Indian Numbering) ──────────────────────────
export function convertNumberToWords(amount: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n] ?? "";
    if (n < 100) return (b[Math.floor(n / 10)] ?? "") + (n % 10 !== 0 ? " " + (a[n % 10] ?? "") : "");
    if (n < 1000)
      return (
        (a[Math.floor(n / 100)] ?? "") + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  }

  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero Rupees Only";
  return inWords(rounded) + " Rupees Only";
}

// ─── Format Currency ────────────────────────────────────────────────────
export function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

// ─── Coverage Rule Calculator ───────────────────────────────────────────
// Department minimums required per shift
const MIN_DEPARTMENT_REQUIREMENTS: Record<Department, Partial<Record<ShiftType, number>>> = {
  FRONT_DESK: { MORNING: 1, EVENING: 1 },
  BAR: { MORNING: 1, EVENING: 1, NIGHT: 1 },
  KITCHEN: { GENERAL: 1, MORNING: 1 },
  SHOP: { GENERAL: 1, MORNING: 1 },
  MAINTENANCE: { MORNING: 1 },
  COACHING: {},
  MANAGEMENT: {},
};

export interface CoverageGap {
  department: Department;
  shiftType: ShiftType;
  required: number;
  assigned: number;
  date: string;
  message: string;
}

export function detectCoverageGaps(date: string): CoverageGap[] {
  const gaps: CoverageGap[] = [];
  const assignmentsOnDate = state.roster.filter((r) => r.date === date && !r.isOff);

  const departments: Department[] = ["FRONT_DESK", "BAR", "KITCHEN", "SHOP", "MAINTENANCE"];

  departments.forEach((dept) => {
    const rules = MIN_DEPARTMENT_REQUIREMENTS[dept];
    Object.entries(rules).forEach(([shiftKey, required]) => {
      const shiftType = shiftKey as ShiftType;
      const count = assignmentsOnDate.filter((a) => {
        const emp = state.employees.find((e) => e.id === a.employeeId);
        if (!emp || emp.department !== dept) return false;
        const tmpl = state.shiftTemplates.find((t) => t.id === a.shiftTemplateId);
        return tmpl?.type === shiftType;
      }).length;

      if (count < (required || 1)) {
        gaps.push({
          department: dept,
          shiftType,
          required: required || 1,
          assigned: count,
          date,
          message: `Gap: no ${dept.replace("_", " ").toLowerCase()} staff for ${shiftType.toLowerCase()} shift on ${date}!`,
        });
      }
    });
  });

  return gaps;
}

// ─── Time Clock Functions ───────────────────────────────────────────────
export function clockIn(
  employeeId: string,
  method: "BUTTON" | "PIN" | "QR" = "BUTTON"
): { success: boolean; message: string } {
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return { success: false, message: "Employee not found." };

  const today = new Date().toISOString().split("T")[0] || "";
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit" });

  // Update session
  state = {
    ...state,
    activeClockSessions: {
      ...state.activeClockSessions,
      [employeeId]: { clockInTime: timeStr, method },
    },
  };

  // Check existing attendance record for today
  const existingIndex = state.attendance.findIndex((a) => a.employeeId === employeeId && a.date === today);

  if (existingIndex >= 0) {
    const updated = [...state.attendance];
    const rec = updated[existingIndex]!;
    updated[existingIndex] = {
      ...rec,
      clockIn: timeStr,
      status: "PRESENT",
    };
    state = { ...state, attendance: updated };
  } else {
    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId,
      employeeName: emp.name,
      department: emp.department,
      date: today,
      shift: "Assigned Shift",
      scheduledStart: "09:00",
      scheduledEnd: "18:00",
      clockIn: timeStr,
      status: "PRESENT",
    };
    state = { ...state, attendance: [newRecord, ...state.attendance] };
  }

  emitChange();
  toast.success(`Clocked in successfully at ${timeStr} for ${emp.name}!`);
  return { success: true, message: `Clocked in at ${timeStr}` };
}

export function clockOut(
  employeeId: string,
  notes?: string
): { success: boolean; message: string } {
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return { success: false, message: "Employee not found." };

  const today = new Date().toISOString().split("T")[0] || "";
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit" });

  const session = state.activeClockSessions[employeeId];
  let hoursWorked = 8.0;

  if (session) {
    const [inH, inM] = session.clockInTime.split(":").map(Number);
    const [outH, outM] = timeStr.split(":").map(Number);
    if (inH !== undefined && inM !== undefined && outH !== undefined && outM !== undefined) {
      const diffMins = outH * 60 + outM - (inH * 60 + inM);
      hoursWorked = Math.max(0.5, Math.round((diffMins / 60) * 10) / 10);
    }
  }

  const newSessions = { ...state.activeClockSessions };
  delete newSessions[employeeId];

  // Update attendance
  const updatedAttendance = state.attendance.map((a) => {
    if (a.employeeId === employeeId && a.date === today) {
      return {
        ...a,
        clockOut: timeStr,
        totalHours: hoursWorked,
        notes: notes || a.notes,
      };
    }
    return a;
  });

  state = {
    ...state,
    activeClockSessions: newSessions,
    attendance: updatedAttendance,
  };

  emitChange();
  toast.success(`Clocked out at ${timeStr} (${hoursWorked} hrs recorded). Have a great rest!`);
  return { success: true, message: `Clocked out at ${timeStr}` };
}

export function correctAttendance(
  attendanceId: string,
  newClockIn: string,
  newClockOut: string,
  reason: string,
  correctedBy: string = "Admin"
): { success: boolean; error?: string } {
  if (!reason.trim()) {
    toast.error("Mandatory audit reason is required for attendance correction.");
    return { success: false, error: "Reason required" };
  }

  const record = state.attendance.find((a) => a.id === attendanceId);
  if (!record) return { success: false, error: "Record not found" };

  const correction = {
    id: `corr-${Date.now()}`,
    correctedBy,
    reason: reason.trim(),
    timestamp: new Date().toISOString(),
    oldClockIn: record.clockIn,
    oldClockOut: record.clockOut,
    newClockIn,
    newClockOut,
  };

  const updated = state.attendance.map((a) => {
    if (a.id !== attendanceId) return a;
    return {
      ...a,
      clockIn: newClockIn,
      clockOut: newClockOut,
      status: "PRESENT" as const,
      corrections: [...(a.corrections || []), correction],
    };
  });

  state = { ...state, attendance: updated };
  emitChange();
  toast.success(`Attendance for ${record.employeeName} corrected & audited.`);
  return { success: true };
}

// ─── Roster & Scheduling Functions ──────────────────────────────────────
export function assignShift(
  employeeId: string,
  date: string,
  shiftTemplateId: string,
  notes?: string
): { success: boolean; error?: string; message?: string } {
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return { success: false, error: "EMP_NOT_FOUND" };

  // BR-13 RULE: Approved leave blocks roster assignment!
  const hasApprovedLeave = state.leaveRequests.some(
    (lv) =>
      lv.employeeId === employeeId &&
      lv.status === "APPROVED" &&
      date >= lv.startDate &&
      date <= lv.endDate
  );

  if (hasApprovedLeave) {
    const msg = `Assignment blocked: ${emp.name} is on approved leave on ${date} (BR-13).`;
    toast.error(msg);
    return { success: false, error: "ON_APPROVED_LEAVE", message: msg };
  }

  // Check Holiday closure
  const holiday = state.holidays.find((h) => h.date === date && h.closesBookings);
  if (holiday) {
    toast.info(`Note: ${date} is marked as Holiday "${holiday.name}" (Facility closed).`);
  }

  const tmpl = state.shiftTemplates.find((t) => t.id === shiftTemplateId);
  if (!tmpl) return { success: false, error: "TEMPLATE_NOT_FOUND" };

  // Remove existing assignment on that date if any
  const filtered = state.roster.filter((r) => !(r.employeeId === employeeId && r.date === date));

  const newAssignment: RosterAssignment = {
    id: `rst-${Date.now()}`,
    employeeId,
    date,
    shiftTemplateId: tmpl.id,
    shiftName: tmpl.name,
    startTime: tmpl.startTime,
    endTime: tmpl.endTime,
    color: tmpl.color,
    notes,
  };

  state = {
    ...state,
    roster: [...filtered, newAssignment],
  };

  emitChange();
  toast.success(`${tmpl.name} assigned to ${emp.name} for ${date}!`);
  return { success: true };
}

export function markRosterOff(
  employeeId: string,
  date: string
): { success: boolean } {
  const emp = state.employees.find((e) => e.id === employeeId);
  const filtered = state.roster.filter((r) => !(r.employeeId === employeeId && r.date === date));

  const offAssignment: RosterAssignment = {
    id: `rst-${Date.now()}`,
    employeeId,
    date,
    shiftTemplateId: "SHIFT-OFF",
    shiftName: "Weekly Off",
    startTime: "—",
    endTime: "—",
    color: "bg-chalk/10 text-chalk/50 border-chalk/14",
    isOff: true,
  };

  state = {
    ...state,
    roster: [...filtered, offAssignment],
  };

  emitChange();
  toast.success(`Weekly Off marked for ${emp?.name || "Employee"} on ${date}`);
  return { success: true };
}

export function removeShift(assignmentId: string): { success: boolean } {
  state = {
    ...state,
    roster: state.roster.filter((r) => r.id !== assignmentId),
  };
  emitChange();
  toast.info("Shift assignment removed.");
  return { success: true };
}

// ─── Leave Management Functions ─────────────────────────────────────────
export function applyLeave(data: {
  employeeId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
}): { success: boolean; error?: string; message?: string } {
  const emp = state.employees.find((e) => e.id === data.employeeId);
  if (!emp) return { success: false, error: "Employee not found" };

  if (data.daysCount <= 0) {
    toast.error("Invalid leave duration.");
    return { success: false, error: "Invalid days count" };
  }

  // BR-13 RULE: Leave cannot exceed balance except unpaid!
  if (data.leaveType !== "UNPAID") {
    const key = data.leaveType.toLowerCase() as "casual" | "sick" | "earned";
    const balance = emp.leaveBalances[key];
    const available = balance.total - balance.used;

    if (data.daysCount > available) {
      const msg = `Cannot apply for ${data.daysCount} days. Available ${data.leaveType} balance is only ${available} days (BR-13). Please choose Unpaid leave if needed.`;
      toast.error(msg);
      return { success: false, error: "EXCEEDS_BALANCE", message: msg };
    }
  }

  // Check if approving would cause a roster coverage gap on those dates
  let coverageWarning: string | undefined = undefined;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dStr = d.toISOString().split("T")[0] || "";
    // Check if other staff in this dept are available
    const deptEmployees = state.employees.filter(
      (e) => e.department === emp.department && e.id !== emp.id && e.status === "ACTIVE"
    );
    const assignedPeers = state.roster.filter((r) => r.date === dStr && deptEmployees.some((p) => p.id === r.employeeId));

    if (assignedPeers.length === 0) {
      coverageWarning = `Warning: ${emp.department.replace("_", " ")} would have zero active staff scheduled on ${dStr}!`;
      break;
    }
  }

  const newRequest: LeaveRequest = {
    id: `LV-${new Date().getFullYear()}-${String(state.leaveRequests.length + 86).padStart(3, "0")}`,
    employeeId: emp.id,
    employeeName: emp.name,
    department: emp.department,
    leaveType: data.leaveType,
    startDate: data.startDate,
    endDate: data.endDate,
    daysCount: data.daysCount,
    reason: data.reason.trim(),
    status: "PENDING",
    appliedAt: new Date().toISOString(),
    coverageWarning,
  };

  state = {
    ...state,
    leaveRequests: [newRequest, ...state.leaveRequests],
  };

  emitChange();
  toast.success(`Leave request submitted for ${data.daysCount} day(s). Awaiting Admin approval.`);
  return { success: true };
}

export function approveLeave(
  leaveId: string,
  approvedBy: string = "Admin",
  comment?: string
): { success: boolean; error?: string } {
  const req = state.leaveRequests.find((l) => l.id === leaveId);
  if (!req) return { success: false, error: "Request not found" };

  const emp = state.employees.find((e) => e.id === req.employeeId);
  if (!emp) return { success: false, error: "Employee not found" };

  // 1. Decrement balance
  const key = req.leaveType.toLowerCase() as "casual" | "sick" | "earned" | "unpaid";
  const updatedBalances = {
    ...emp.leaveBalances,
    [key]: {
      ...emp.leaveBalances[key],
      used: emp.leaveBalances[key].used + req.daysCount,
    },
  };

  const updatedEmployees = state.employees.map((e) => {
    if (e.id !== emp.id) return e;
    return { ...e, leaveBalances: updatedBalances };
  });

  // 2. Insert Leave Block ▒ in Roster on those dates
  const newRosterItems: RosterAssignment[] = [];
  const start = new Date(req.startDate);
  const end = new Date(req.endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dStr = d.toISOString().split("T")[0] || "";
    newRosterItems.push({
      id: `rst-leave-${Date.now()}-${dStr}`,
      employeeId: emp.id,
      date: dStr,
      shiftTemplateId: "SHIFT-LEAVE",
      shiftName: `Leave ▒ (${req.leaveType})`,
      startTime: "—",
      endTime: "—",
      color: "bg-rose-500/20 text-rose-300 border-rose-500/40 border-dashed",
      notes: req.reason,
    });
  }

  // Remove existing shift assignments that overlap with approved leave (BR-13)
  const cleanedRoster = state.roster.filter(
    (r) => !(r.employeeId === emp.id && r.date >= req.startDate && r.date <= req.endDate)
  );

  // 3. Mark request APPROVED
  const updatedRequests = state.leaveRequests.map((l) => {
    if (l.id !== leaveId) return l;
    return {
      ...l,
      status: "APPROVED" as const,
      approvedBy,
      approvalComment: comment || "Approved by Management",
    };
  });

  state = {
    ...state,
    employees: updatedEmployees,
    roster: [...cleanedRoster, ...newRosterItems],
    leaveRequests: updatedRequests,
  };

  emitChange();
  toast.success(`Leave request approved for ${emp.name}! Balance updated and roster locked.`);
  return { success: true };
}

export function rejectLeave(
  leaveId: string,
  rejectedBy: string = "Admin",
  reason: string
): { success: boolean; error?: string } {
  const req = state.leaveRequests.find((l) => l.id === leaveId);
  if (!req) return { success: false, error: "Request not found" };

  const updatedRequests = state.leaveRequests.map((l) => {
    if (l.id !== leaveId) return l;
    return {
      ...l,
      status: "REJECTED" as const,
      approvedBy: rejectedBy,
      approvalComment: reason || "Rejected due to operational staffing constraints.",
    };
  });

  state = { ...state, leaveRequests: updatedRequests };
  emitChange();
  toast.info(`Leave request rejected.`);
  return { success: true };
}

// ─── Employee Management Functions ──────────────────────────────────────
export function updateEmployee(
  employeeId: string,
  updates: Partial<Employee>
): { success: boolean } {
  state = {
    ...state,
    employees: state.employees.map((e) => {
      if (e.id !== employeeId) return e;
      return { ...e, ...updates };
    }),
  };
  emitChange();
  toast.success("Employee profile updated successfully.");
  return { success: true };
}

export function toggleEmployeeStatus(
  employeeId: string,
  reason: string
): { success: boolean } {
  const emp = state.employees.find((e) => e.id === employeeId);
  if (!emp) return { success: false };

  const newStatus = emp.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  state = {
    ...state,
    employees: state.employees.map((e) => {
      if (e.id !== employeeId) return e;
      return { ...e, status: newStatus };
    }),
  };
  emitChange();
  toast.success(`Employee marked ${newStatus}. (Reason: ${reason})`);
  return { success: true };
}

// ─── Holiday Calendar Functions ─────────────────────────────────────────
export function addHoliday(data: {
  name: string;
  date: string;
  closesBookings: boolean;
  description?: string | undefined;
}): { success: boolean } {
  const newHoliday: Holiday = {
    id: `HOL-${Date.now()}`,
    name: data.name.trim(),
    date: data.date,
    closesBookings: data.closesBookings,
    description: data.description?.trim(),
  };

  state = {
    ...state,
    holidays: [...state.holidays, newHoliday],
  };

  emitChange();
  toast.success(`Holiday "${data.name}" added to club calendar!`);
  return { success: true };
}

export function removeHoliday(holidayId: string): { success: boolean } {
  state = {
    ...state,
    holidays: state.holidays.filter((h) => h.id !== holidayId),
  };
  emitChange();
  toast.info("Holiday removed.");
  return { success: true };
}

// ─── Payroll Engine Functions ───────────────────────────────────────────
export function updatePayrollItem(
  runId: string,
  employeeId: string,
  updates: { overtimeHours?: number; overtimePay?: number; bonus?: number }
): { success: boolean } {
  const run = state.payrollRuns.find((r) => r.id === runId);
  if (!run || run.status === "FINALISED") {
    toast.error("Cannot modify a finalised payroll run.");
    return { success: false };
  }

  const updatedItems = run.items.map((item) => {
    if (item.employeeId !== employeeId) return item;

    const overtimeHours = updates.overtimeHours !== undefined ? updates.overtimeHours : item.overtimeHours;
    const overtimePay = updates.overtimePay !== undefined ? updates.overtimePay : item.overtimePay;
    const bonus = updates.bonus !== undefined ? updates.bonus : item.bonus;

    const grossSalary = item.basicEarned + item.hraEarned + item.allowancesEarned + overtimePay + bonus;
    const totalDeductions = item.pfDeduction + item.esiDeduction + item.tdsDeduction;
    const netPayable = grossSalary - totalDeductions;

    return {
      ...item,
      overtimeHours,
      overtimePay,
      bonus,
      grossSalary,
      totalDeductions,
      netPayable,
    };
  });

  const totalGross = updatedItems.reduce((acc, i) => acc + i.grossSalary, 0);
  const totalDeductions = updatedItems.reduce((acc, i) => acc + i.totalDeductions, 0);
  const totalNet = totalGross - totalDeductions;

  const updatedRuns = state.payrollRuns.map((r) => {
    if (r.id !== runId) return r;
    return {
      ...r,
      items: updatedItems,
      totalGross,
      totalDeductions,
      totalNet,
      status: "REVIEWED" as const,
    };
  });

  state = { ...state, payrollRuns: updatedRuns };
  emitChange();
  return { success: true };
}

export function finalisePayroll(
  runId: string,
  finalisedBy: string = "Finance Head / Admin",
  pinUsed: boolean = true
): { success: boolean; payslipsGenerated: number } {
  const run = state.payrollRuns.find((r) => r.id === runId);
  if (!run) return { success: false, payslipsGenerated: 0 };
  if (run.status === "FINALISED") {
    toast.info("Payroll run is already finalised.");
    return { success: true, payslipsGenerated: 0 };
  }

  // 1. Generate payslips for all employees in the run
  const newPayslips: Payslip[] = run.items.map((item, idx) => {
    const emp = state.employees.find((e) => e.id === item.employeeId);
    const maskedAcc = emp?.bankDetails.accountNumber
      ? `•••• •••• •••• ${emp.bankDetails.accountNumber.slice(-4)}`
      : "•••• •••• •••• 0000";

    return {
      id: `PS-${run.month.replace(" ", "-")}-${String(idx + 1).padStart(3, "0")}`,
      payrollRunId: run.id,
      employeeId: item.employeeId,
      employeeName: item.employeeName,
      department: item.department,
      roleTitle: emp?.roleTitle || "Staff",
      month: run.month,
      payPeriod: `01-${run.month.slice(0, 3)}-2026 to 31-${run.month.slice(0, 3)}-2026`,
      payDate: new Date().toISOString().split("T")[0] || "",
      bankName: emp?.bankDetails.bankName || "HDFC Bank",
      accountNumberMasked: maskedAcc,
      pfNumber: `MH/BAN/0049281/000/${String(100 + idx)}`,
      pan: `ABCDE${String(1000 + idx)}F`,
      uan: `100928174${String(600 + idx)}`,
      earnings: [
        { label: "Basic Salary", amount: item.basicEarned },
        { label: "House Rent Allowance (HRA)", amount: item.hraEarned },
        { label: "Special Allowance", amount: item.allowancesEarned },
        ...(item.overtimePay > 0
          ? [{ label: `Overtime Pay (${item.overtimeHours} hrs)`, amount: item.overtimePay }]
          : []),
        ...(item.bonus > 0 ? [{ label: "Performance / Festival Bonus", amount: item.bonus }] : []),
      ],
      deductions: [
        { label: "Employees Provident Fund (EPF)", amount: item.pfDeduction },
        ...(item.esiDeduction > 0 ? [{ label: "Employee State Insurance (ESI)", amount: item.esiDeduction }] : []),
        ...(item.tdsDeduction > 0 ? [{ label: "TDS / Income Tax Deduction", amount: item.tdsDeduction }] : []),
        { label: "Maharashtra Professional Tax (PT)", amount: 200 },
      ],
      grossEarnings: item.grossSalary,
      totalDeductions: item.totalDeductions,
      netPay: item.netPayable,
      netPayInWords: convertNumberToWords(item.netPayable),
      status: "GENERATED",
    };
  });

  // 2. Mark run FINALISED
  const updatedRuns = state.payrollRuns.map((r) => {
    if (r.id !== runId) return r;
    return {
      ...r,
      status: "FINALISED" as const,
      finalisedAt: new Date().toISOString(),
      finalisedBy,
      finalisedAuditPinUsed: pinUsed,
      salariesPayablePosted: true,
    };
  });

  state = {
    ...state,
    payrollRuns: updatedRuns,
    payslips: [...newPayslips, ...state.payslips],
  };

  emitChange();
  toast.success(
    `Payroll for ${run.month} finalised! Generated ${newPayslips.length} payslips. Posted ₹${run.totalNet.toLocaleString(
      "en-IN"
    )} to Salaries Payable banner.`
  );
  return { success: true, payslipsGenerated: newPayslips.length };
}

// ─── React Hook ─────────────────────────────────────────────────────────
export function useHrStore() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({
      ...store,
      getEmployee: (id: string) => store.employees.find((e) => e.id === id),
      getEmployeeByEmail: (email: string) => store.employees.find((e) => e.email === email),
      clockIn,
      clockOut,
      correctAttendance,
      assignShift,
      markRosterOff,
      removeShift,
      applyLeave,
      approveLeave,
      rejectLeave,
      updateEmployee,
      toggleEmployeeStatus,
      addHoliday,
      removeHoliday,
      updatePayrollItem,
      finalisePayroll,
      detectCoverageGaps,
    }),
    [store]
  );
}
