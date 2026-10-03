package com.bookmycourt.hr.service;

import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.hr.dto.AttendanceResponse;
import com.bookmycourt.hr.dto.CreateEmployeeRequest;
import com.bookmycourt.hr.dto.EmployeeResponse;
import com.bookmycourt.hr.dto.RecordAttendanceRequest;
import com.bookmycourt.hr.dto.UpdateEmployeeRequest;
import com.bookmycourt.hr.entity.Attendance;
import com.bookmycourt.hr.entity.Employee;
import com.bookmycourt.hr.mapper.HrMapper;
import com.bookmycourt.hr.repository.AttendanceRepository;
import com.bookmycourt.hr.repository.EmployeeRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class HrService {

    private final EmployeeRepository employees;
    private final AttendanceRepository attendances;
    private final AppUserRepository users;
    private final HrMapper mapper;

    public HrService(
            EmployeeRepository employees,
            AttendanceRepository attendances,
            AppUserRepository users,
            HrMapper mapper) {
        this.employees = employees;
        this.attendances = attendances;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        AppUser user = users.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (employees.findByUser_Id(user.getId()).isPresent()) {
            throw new IllegalArgumentException("User is already registered as an employee");
        }

        Employee emp = new Employee();
        emp.setUser(user);
        emp.setEmployeeNumber("EMP-" + String.format("%04d", employees.count() + 1));
        emp.setDepartment(request.department());
        emp.setJobTitle(request.jobTitle());
        emp.setJoiningDate(request.joiningDate());
        emp.setEmploymentStatus("ACTIVE");
        if (request.salaryStructure() != null) {
            emp.setSalaryStructure(request.salaryStructure());
        }

        employees.save(emp);
        return mapper.toResponse(emp);
    }

    @Transactional
    public EmployeeResponse updateEmployee(UUID id, UpdateEmployeeRequest request) {
        Employee emp = employees.findById(id).orElseThrow(() -> new NotFoundException("Employee not found"));
        if (request.department() != null) emp.setDepartment(request.department());
        if (request.jobTitle() != null) emp.setJobTitle(request.jobTitle());
        if (request.employmentStatus() != null) emp.setEmploymentStatus(request.employmentStatus());
        if (request.salaryStructure() != null) emp.setSalaryStructure(request.salaryStructure());
        employees.save(emp);
        return mapper.toResponse(emp);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(UUID id) {
        Employee emp = employees.findById(id).orElseThrow(() -> new NotFoundException("Employee not found"));
        return mapper.toResponse(emp);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployees(String status) {
        List<Employee> list = (status != null && !status.isBlank())
                ? employees.findByEmploymentStatus(status)
                : employees.findByOrderByJoiningDateDesc();
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public AttendanceResponse recordAttendance(RecordAttendanceRequest request) {
        Employee emp = employees.findById(request.employeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        Attendance att = attendances.findByEmployee_IdAndAttendanceDate(emp.getId(), request.attendanceDate())
                .orElseGet(() -> {
                    Attendance newAtt = new Attendance();
                    newAtt.setEmployee(emp);
                    newAtt.setAttendanceDate(request.attendanceDate());
                    return newAtt;
                });

        att.setCheckInAt(request.checkInAt());
        att.setCheckOutAt(request.checkOutAt());
        att.setStatus(request.status());
        if (request.source() != null) att.setSource(request.source());
        att.setNotes(request.notes());

        if (request.approvedByUserId() != null) {
            AppUser u = users.findById(request.approvedByUserId()).orElse(null);
            att.setApprovedBy(u);
        }

        attendances.save(att);
        return mapper.toResponse(att);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> listAttendance(UUID employeeId, LocalDate date) {
        if (employeeId != null) {
            return attendances.findByEmployee_IdOrderByAttendanceDateDesc(employeeId).stream().map(mapper::toResponse).toList();
        }
        if (date != null) {
            return attendances.findByAttendanceDate(date).stream().map(mapper::toResponse).toList();
        }
        return attendances.findAll().stream().map(mapper::toResponse).toList();
    }
}
