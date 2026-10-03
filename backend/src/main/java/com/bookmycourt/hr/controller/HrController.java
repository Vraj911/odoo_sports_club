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
}
