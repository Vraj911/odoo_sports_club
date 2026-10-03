import { apiClient } from "@/lib/axios";

export interface AttendanceSummaryDto {
  presentCount: number;
  absentCount: number;
  onLeaveCount: number;
  totalEmployees: number;
}

export interface LeaveRequestDto {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveTypeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  createdAt: string;
}

export interface ShiftScheduleDto {
  id: string;
  employeeId: string;
  employeeName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  roleAssigned?: string;
}

export interface PayrollRunDto {
  id: string;
  month: string;
  status: "DRAFT" | "COMPLETED";
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  payslipCount: number;
}

export const hrApi = {
  getTodayAttendance: () =>
    apiClient.get<AttendanceSummaryDto>("/api/hr/attendance/today-summary"),

  checkIn: (employeeId?: string) =>
    apiClient.post<{ attendanceId: string; checkInTime: string }>("/api/hr/attendance/check-in", {
      employeeId,
    }),

  checkOut: (employeeId?: string) =>
    apiClient.post<{ attendanceId: string; checkOutTime: string }>("/api/hr/attendance/check-out", {
      employeeId,
    }),

  listLeaveRequests: () =>
    apiClient.get<LeaveRequestDto[]>("/api/hr/leave-requests"),

  createLeaveRequest: (data: {
    employeeId: string;
    leaveTypeId: string;
    fromDate: string;
    toDate: string;
    days: number;
    reason?: string;
  }) => apiClient.post<LeaveRequestDto>("/api/hr/leave-requests", data),

  approveLeave: (id: string) =>
    apiClient.post<{ id: string; status: string }>(`/api/hr/leave-requests/${id}/approve`),

  rejectLeave: (id: string, reason?: string) =>
    apiClient.post<{ id: string; status: string }>(`/api/hr/leave-requests/${id}/reject`, { reason }),

  listShifts: (fromDate?: string, toDate?: string) =>
    apiClient.get<ShiftScheduleDto[]>("/api/hr/shifts", { fromDate, toDate }),

  runPayroll: (month: string) =>
    apiClient.post<PayrollRunDto>("/api/hr/payroll/run", { month }),

  listPayslips: (payrollRunId?: string) =>
    apiClient.get<Record<string, unknown>[]>("/api/hr/payroll/payslips", payrollRunId ? { payrollRunId } : undefined),
};
