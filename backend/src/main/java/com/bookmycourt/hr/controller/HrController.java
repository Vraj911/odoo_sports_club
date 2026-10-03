package com.bookmycourt.hr.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.hr.dto.ApplyLeaveRequest;
import com.bookmycourt.hr.dto.AttendanceResponse;
import com.bookmycourt.hr.dto.CreateEmployeeRequest;
import com.bookmycourt.hr.dto.EmployeeResponse;
import com.bookmycourt.hr.dto.LeaveRequestResponse;
import com.bookmycourt.hr.dto.PayrollRunResponse;
import com.bookmycourt.hr.dto.PayslipResponse;
import com.bookmycourt.hr.dto.RecordAttendanceRequest;
import com.bookmycourt.hr.dto.ShiftScheduleRequest;
import com.bookmycourt.hr.dto.ShiftScheduleResponse;
import com.bookmycourt.hr.dto.UpdateEmployeeRequest;
import com.bookmycourt.hr.entity.LeaveType;
import com.bookmycourt.hr.service.HrAccess;
import com.bookmycourt.hr.service.HrService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr")
public class HrController {

    private final HrService hr;
    private final HrAccess access;

    public HrController(HrService hr, HrAccess access) {
        this.hr = hr;
        this.access = access;
    }

    // ------------------------------------------------------------ employees
    @PostMapping("/employees")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        access.requireHr();
        return ApiResponse.success("Employee created", hr.createEmployee(request));
    }

    @GetMapping("/employees/{id}")
    public ApiResponse<EmployeeResponse> getEmployee(@PathVariable UUID id) {
        access.requireSelfOrHrOrAccountant(id);
        return ApiResponse.success("Employee loaded", hr.getEmployee(id));
    }

    @GetMapping("/employees")
    public ApiResponse<List<EmployeeResponse>> listEmployees(@RequestParam(required = false) String status) {
        access.requireHrOrAccountant();
        return ApiResponse.success("Employees loaded", hr.listEmployees(status));
    }

    @PutMapping("/employees/{id}")
    public ApiResponse<EmployeeResponse> updateEmployee(@PathVariable UUID id, @RequestBody UpdateEmployeeRequest request) {
        access.requireHr();
        return ApiResponse.success("Employee updated", hr.updateEmployee(id, request));
    }

    // ----------------------------------------------------------- attendance
    /**
     * Manual correction by a manager (reason required). Staff use clock-in /
     * clock-out.
     */
    @PostMapping("/attendance")
    public ApiResponse<AttendanceResponse> recordAttendance(@Valid @RequestBody RecordAttendanceRequest request) {
        access.requireHr();
        return ApiResponse.success("Attendance recorded", hr.recordAttendance(request));
    }

    @PostMapping("/attendance/clock-in")
    public ApiResponse<AttendanceResponse> clockIn() {
        return ApiResponse.success("Clocked in", hr.clockIn());
    }

    @PostMapping("/attendance/clock-out")
    public ApiResponse<AttendanceResponse> clockOut() {
        return ApiResponse.success("Clocked out", hr.clockOut());
    }

    @GetMapping("/attendance")
    public ApiResponse<List<AttendanceResponse>> listAttendance(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (employeeId != null) {
            access.requireSelfOrHr(employeeId); 
        }else {
            access.requireHr();
        }
        return ApiResponse.success("Attendance loaded", hr.listAttendance(employeeId, date, from, to));
    }

    @GetMapping("/attendance/today-summary")
    public ApiResponse<Map<String, Object>> getTodayAttendanceSummary() {
        access.requireHr();
        return ApiResponse.success("Today's attendance summary loaded", hr.getTodayAttendanceSummary());
    }

    // ---------------------------------------------------------------- leave
    @PostMapping("/leave-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LeaveRequestResponse> applyLeave(@Valid @RequestBody ApplyLeaveRequest request) {
        access.requireSelfOrHr(request.employeeId());
        return ApiResponse.success("Leave applied", hr.applyLeave(request));
    }

    @GetMapping("/leave-requests")
    public ApiResponse<List<LeaveRequestResponse>> listLeaveRequests(@RequestParam(required = false) UUID employeeId) {
        if (employeeId != null) {
            access.requireSelfOrHr(employeeId); 
        }else {
            access.requireHr();
        }
        return ApiResponse.success("Leave requests loaded", hr.listLeaveRequests(employeeId));
    }

    /**
     * Approver is the logged-in user. (The old approvedByUserId parameter is
     * ignored.) Role rules live in the service.
     */
    @PatchMapping("/leave-requests/{id}/status")
    public ApiResponse<LeaveRequestResponse> updateLeaveStatus(@PathVariable UUID id, @RequestParam String status) {
        return ApiResponse.success("Leave status updated", hr.updateLeaveStatus(id, status));
    }

    @GetMapping("/leave-types")
    public ApiResponse<List<LeaveType>> listLeaveTypes() {
        return ApiResponse.success("Leave types loaded", hr.listLeaveTypes());
    }

    @GetMapping("/leave-balances")
    public ApiResponse<List<HrService.LeaveBalance>> leaveBalances(
            @RequestParam UUID employeeId,
            @RequestParam(required = false) Integer year) {
        access.requireSelfOrHr(employeeId);
        return ApiResponse.success("Leave balances loaded", hr.leaveBalances(employeeId, year));
    }

    // --------------------------------------------------------------- roster
    @PostMapping("/shifts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ShiftScheduleResponse> scheduleShift(@Valid @RequestBody ShiftScheduleRequest request) {
        access.requireHr();
        return ApiResponse.success("Shift scheduled", hr.scheduleShift(request));
    }

    @DeleteMapping("/shifts/{id}")
    public ApiResponse<Void> deleteShift(@PathVariable UUID id) {
        access.requireHr();
        hr.deleteShift(id);
        return ApiResponse.success("Shift removed", null);
    }

    @GetMapping("/shifts")
    public ApiResponse<List<ShiftScheduleResponse>> listShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (employeeId != null) {
            access.requireSelfOrHr(employeeId); 
        }else {
            access.requireHr();
        }
        return ApiResponse.success("Shifts loaded", hr.listShifts(date, employeeId, from, to));
    }

    // -------------------------------------------------------------- payroll
    /**
     * Builds a DRAFT for review. Pass finalise=true to build and finalise in
     * one step.
     */
    @PostMapping("/payroll/run")
    public ApiResponse<PayrollRunResponse> runPayroll(
            @RequestParam String month,
            @RequestParam(defaultValue = "false") boolean finalise) {
        access.requireHrOrAccountant();
        return ApiResponse.success(finalise ? "Payroll run finalised" : "Payroll draft generated",
                hr.generatePayrollRun(month, finalise));
    }

    @PostMapping("/payroll/runs/{id}/finalise")
    public ApiResponse<PayrollRunResponse> finalisePayroll(@PathVariable UUID id) {
        access.requireHrOrAccountant();
        return ApiResponse.success("Payroll run finalised", hr.finalisePayrollRun(id));
    }

    @GetMapping("/payroll/runs")
    public ApiResponse<List<PayrollRunResponse>> listPayrollRuns() {
        access.requireHrOrAccountant();
        return ApiResponse.success("Payroll runs loaded", hr.listPayrollRuns());
    }

    @GetMapping("/payroll/runs/{id}")
    public ApiResponse<PayrollRunResponse> getPayrollRun(@PathVariable UUID id) {
        access.requireHrOrAccountant();
        return ApiResponse.success("Payroll run loaded", hr.getPayrollRun(id));
    }

    @GetMapping("/payroll/payslips")
    public ApiResponse<List<PayslipResponse>> listPayslips(
            @RequestParam(required = false) UUID runId,
            @RequestParam(required = false) UUID employeeId) {
        if (runId == null && employeeId != null) {
            access.requireSelfOrHrOrAccountant(employeeId); 
        }else {
            access.requireHrOrAccountant();
        }
        return ApiResponse.success("Payslips loaded", hr.listPayslips(runId, employeeId));
    }

    @PostMapping("/payroll/payslips/{id}/pay")
    public ApiResponse<PayslipResponse> payPayslip(
            @PathVariable UUID id,
            @RequestParam String method,
            @RequestParam(required = false) String reference) {
        access.requireHrOrAccountant();
        return ApiResponse.success("Payslip paid", hr.markPayslipPaid(id, method, reference));
    }
}
