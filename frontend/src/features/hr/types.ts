// Types for CCMS HR & Staff Self-Service Module (Phase 10)

export type Department =
  | "FRONT_DESK"
  | "BAR"
  | "KITCHEN"
  | "SHOP"
  | "MAINTENANCE"
  | "COACHING"
  | "MANAGEMENT";

export type ShiftType = "MORNING" | "EVENING" | "NIGHT" | "GENERAL";

export interface ShiftTemplate {
  id: string;
  name: string;
  type: ShiftType;
  startTime: string; // "06:00"
  endTime: string;   // "14:00"
  department?: Department | undefined;
  color: string;     // Tailwind tint class or hex token
  hours: number;
}

export type LeaveType = "CASUAL" | "SICK" | "EARNED" | "UNPAID";

export interface LeaveBalanceCategory {
  total: number;
  used: number;
}

export interface EmployeeLeaveBalances {
  casual: LeaveBalanceCategory;
  sick: LeaveBalanceCategory;
  earned: LeaveBalanceCategory;
  unpaid: LeaveBalanceCategory;
}

export interface SalaryStructureItem {
  id: string;
  name: string;
  type: "EARNING" | "DEDUCTION";
  isPercentage: boolean;
  value: number; // e.g. 50 (for 50%) or fixed ₹25,000
  amountCalculated: number;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string; // e.g. "98765432104417"
  ifsc: string;
  branch: string;
  encryptedNote?: string | undefined;
}

export interface EmployeeDocument {
  id: string;
  title: string;
  type: "ID_PROOF" | "PAN" | "CONTRACT" | "POLICE_VERIFICATION" | "CERTIFICATION";
  fileName: string;
  uploadDate: string;
  fileSize: string;
  status: "VERIFIED" | "PENDING" | "REJECTED";
}

export interface Employee {
  id: string; // e.g. "EMP-001"
  name: string;
  avatar: string;
  email: string;
  phone: string;
  department: Department;
  roleTitle: string;
  joiningDate: string;
  status: "ACTIVE" | "INACTIVE";
  coachingFlag: boolean; // P2: "Can be assigned to bookings/social sessions"
  baseSalary: number;    // Monthly CTC
  salaryStructure: SalaryStructureItem[];
  bankDetails: BankDetails;
  documents: EmployeeDocument[];
  leaveBalances: EmployeeLeaveBalances;
  assignedPin?: string | undefined;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface RosterAssignment {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  shiftTemplateId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  color: string;
  isOff?: boolean | undefined;
  notes?: string | undefined;
}

export type AttendanceStatus = "PRESENT" | "LATE" | "EARLY" | "ABSENT" | "ON_LEAVE";

export interface AttendanceCorrection {
  id: string;
  correctedBy: string;
  reason: string;
  timestamp: string;
  oldClockIn?: string | undefined;
  oldClockOut?: string | undefined;
  newClockIn: string;
  newClockOut: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string; // YYYY-MM-DD
  shift: string;
  scheduledStart: string;
  scheduledEnd: string;
  clockIn?: string | undefined;
  clockOut?: string | undefined;
  totalHours?: number | undefined;
  status: AttendanceStatus;
  notes?: string | undefined;
  corrections?: AttendanceCorrection[] | undefined;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedAt: string;
  approvedBy?: string | undefined;
  approvalComment?: string | undefined;
  coverageWarning?: string | undefined; // "Wed evening bar would be uncovered"
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  closesBookings: boolean; // blocks court bookings
  description?: string | undefined;
}

export interface PayrollItem {
  employeeId: string;
  employeeName: string;
  department: Department;
  baseMonthlySalary: number;
  attendanceDays: number;
  workingDaysInMonth: number;
  approvedPaidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  basicEarned: number;
  hraEarned: number;
  allowancesEarned: number;
  grossSalary: number;
  pfDeduction: number;
  esiDeduction: number;
  tdsDeduction: number;
  totalDeductions: number;
  netPayable: number;
}

export interface PayrollRun {
  id: string; // e.g. "PR-2026-10"
  month: string; // "October 2026"
  fiscalYear: string; // "2026-2027"
  status: "DRAFT" | "REVIEWED" | "FINALISED";
  items: PayrollItem[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  finalisedAt?: string | undefined;
  finalisedBy?: string | undefined;
  finalisedAuditPinUsed?: boolean | undefined;
  salariesPayablePosted?: boolean | undefined;
}

export interface PayslipItem {
  label: string;
  amount: number;
}

export interface Payslip {
  id: string; // e.g. "PS-2026-10-001"
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  roleTitle: string;
  month: string;
  payPeriod: string;
  payDate: string;
  bankName: string;
  accountNumberMasked: string;
  pfNumber: string;
  pan: string;
  uan: string;
  earnings: PayslipItem[];
  deductions: PayslipItem[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  netPayInWords: string;
  status: "GENERATED" | "PAID";
}
