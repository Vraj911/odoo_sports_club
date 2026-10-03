package com.bookmycourt.hr.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.hr.dto.AttendanceResponse;
import com.bookmycourt.hr.dto.CreateEmployeeRequest;
import com.bookmycourt.hr.dto.EmployeeResponse;
import com.bookmycourt.hr.dto.RecordAttendanceRequest;
import com.bookmycourt.hr.dto.UpdateEmployeeRequest;
import com.bookmycourt.hr.service.HrService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr")
public class HrController {

    private final HrService hr;

    public HrController(HrService hr) {
        this.hr = hr;
    }

    @PostMapping("/employees")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EmployeeResponse> createEmployee(@Valid @RequestBody CreateEmployeeRequest request) {
        return ApiResponse.success("Employee created", hr.createEmployee(request));
    }

    @GetMapping("/employees/{id}")
    public ApiResponse<EmployeeResponse> getEmployee(@PathVariable UUID id) {
        return ApiResponse.success("Employee loaded", hr.getEmployee(id));
    }

    @GetMapping("/employees")
    public ApiResponse<List<EmployeeResponse>> listEmployees(@RequestParam(required = false) String status) {
        return ApiResponse.success("Employees loaded", hr.listEmployees(status));
    }

    @PutMapping("/employees/{id}")
    public ApiResponse<EmployeeResponse> updateEmployee(
            @PathVariable UUID id,
            @RequestBody UpdateEmployeeRequest request) {
        return ApiResponse.success("Employee updated", hr.updateEmployee(id, request));
    }

    @PostMapping("/attendance")
    public ApiResponse<AttendanceResponse> recordAttendance(@Valid @RequestBody RecordAttendanceRequest request) {
        return ApiResponse.success("Attendance recorded", hr.recordAttendance(request));
    }

    @GetMapping("/attendance")
    public ApiResponse<List<AttendanceResponse>> listAttendance(
            @RequestParam(required = false) UUID employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Attendance loaded", hr.listAttendance(employeeId, date));
    }

    @GetMapping("/attendance/today-summary")
    public ApiResponse<java.util.Map<String, Object>> getTodayAttendanceSummary() {
        return ApiResponse.success("Today's attendance summary loaded", hr.getTodayAttendanceSummary());
    }

    @PostMapping("/leave-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<com.bookmycourt.hr.dto.LeaveRequestResponse> applyLeave(@Valid @RequestBody com.bookmycourt.hr.dto.ApplyLeaveRequest request) {
        return ApiResponse.success("Leave applied", hr.applyLeave(request));
    }

    @GetMapping("/leave-requests")
    public ApiResponse<List<com.bookmycourt.hr.dto.LeaveRequestResponse>> listLeaveRequests(@RequestParam(required = false) UUID employeeId) {
        return ApiResponse.success("Leave requests loaded", hr.listLeaveRequests(employeeId));
    }

    @PatchMapping("/leave-requests/{id}/status")
    public ApiResponse<com.bookmycourt.hr.dto.LeaveRequestResponse> updateLeaveStatus(
            @PathVariable UUID id,
            @RequestParam String status,
            @RequestParam(required = false) UUID approvedByUserId) {
        return ApiResponse.success("Leave status updated", hr.updateLeaveStatus(id, status, approvedByUserId));
    }

    @GetMapping("/leave-types")
    public ApiResponse<List<com.bookmycourt.hr.entity.LeaveType>> listLeaveTypes() {
        return ApiResponse.success("Leave types loaded", hr.listLeaveTypes());
    }

    @PostMapping("/shifts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<com.bookmycourt.hr.dto.ShiftScheduleResponse> scheduleShift(@Valid @RequestBody com.bookmycourt.hr.dto.ShiftScheduleRequest request) {
        return ApiResponse.success("Shift scheduled", hr.scheduleShift(request));
    }

    @GetMapping("/shifts")
    public ApiResponse<List<com.bookmycourt.hr.dto.ShiftScheduleResponse>> listShifts(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) UUID employeeId) {
        return ApiResponse.success("Shifts loaded", hr.listShifts(date, employeeId));
    }

    @PostMapping("/payroll/run")
    public ApiResponse<com.bookmycourt.hr.dto.PayrollRunResponse> runPayroll(@RequestParam String month) {
        return ApiResponse.success("Payroll run completed", hr.generatePayrollRun(month));
    }

    @GetMapping("/payroll/runs")
    public ApiResponse<List<com.bookmycourt.hr.dto.PayrollRunResponse>> listPayrollRuns() {
        return ApiResponse.success("Payroll runs loaded", hr.listPayrollRuns());
    }

    @GetMapping("/payroll/payslips")
    public ApiResponse<List<com.bookmycourt.hr.dto.PayslipResponse>> listPayslips(
            @RequestParam(required = false) UUID runId,
            @RequestParam(required = false) UUID employeeId) {
        return ApiResponse.success("Payslips loaded", hr.listPayslips(runId, employeeId));
    }
}
