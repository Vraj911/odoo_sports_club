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
    private final com.bookmycourt.hr.repository.LeaveTypeRepository leaveTypes;
    private final com.bookmycourt.hr.repository.LeaveRequestRepository leaveRequests;
    private final com.bookmycourt.hr.repository.ShiftScheduleRepository shifts;
    private final com.bookmycourt.hr.repository.PayrollRunRepository payrollRuns;
    private final com.bookmycourt.hr.repository.PayslipRepository payslips;

    public HrService(
            EmployeeRepository employees,
            AttendanceRepository attendances,
            AppUserRepository users,
            HrMapper mapper,
            com.bookmycourt.hr.repository.LeaveTypeRepository leaveTypes,
            com.bookmycourt.hr.repository.LeaveRequestRepository leaveRequests,
            com.bookmycourt.hr.repository.ShiftScheduleRepository shifts,
            com.bookmycourt.hr.repository.PayrollRunRepository payrollRuns,
            com.bookmycourt.hr.repository.PayslipRepository payslips) {
        this.employees = employees;
        this.attendances = attendances;
        this.users = users;
        this.mapper = mapper;
        this.leaveTypes = leaveTypes;
        this.leaveRequests = leaveRequests;
        this.shifts = shifts;
        this.payrollRuns = payrollRuns;
        this.payslips = payslips;
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

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getTodayAttendanceSummary() {
        LocalDate today = LocalDate.now();
        List<Attendance> todayRecords = attendances.findByAttendanceDate(today);
        long totalEmp = employees.findByEmploymentStatus("ACTIVE").size();
        long present = todayRecords.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
        long late = todayRecords.stream().filter(a -> "LATE".equalsIgnoreCase(a.getStatus())).count();
        long halfDay = todayRecords.stream().filter(a -> "HALF_DAY".equalsIgnoreCase(a.getStatus())).count();
        long onLeave = todayRecords.stream().filter(a -> "ON_LEAVE".equalsIgnoreCase(a.getStatus())).count();
        long absent = totalEmp - (present + late + halfDay + onLeave);
        if (absent < 0) absent = 0;

        java.util.Map<String, Object> map = new java.util.HashMap<>();
        map.put("date", today);
        map.put("totalEmployees", totalEmp);
        map.put("present", present);
        map.put("late", late);
        map.put("halfDay", halfDay);
        map.put("onLeave", onLeave);
        map.put("absent", absent);
        return map;
    }

    @Transactional
    public com.bookmycourt.hr.dto.LeaveRequestResponse applyLeave(com.bookmycourt.hr.dto.ApplyLeaveRequest request) {
        Employee emp = employees.findById(request.employeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found: " + request.employeeId()));
        com.bookmycourt.hr.entity.LeaveType lt = leaveTypes.findById(request.leaveTypeId())
                .orElseThrow(() -> new NotFoundException("Leave type not found: " + request.leaveTypeId()));

        int days = request.days() > 0 ? request.days() : (int) java.time.temporal.ChronoUnit.DAYS.between(request.fromDate(), request.toDate()) + 1;
        if (days <= 0) days = 1;

        com.bookmycourt.hr.entity.LeaveRequest lr = new com.bookmycourt.hr.entity.LeaveRequest();
        lr.setEmployee(emp);
        lr.setLeaveType(lt);
        lr.setFromDate(request.fromDate());
        lr.setToDate(request.toDate());
        lr.setDays(days);
        lr.setStatus("PENDING");
        lr.setReason(request.reason());
        leaveRequests.save(lr);

        return toLeaveResponse(lr);
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.hr.dto.LeaveRequestResponse> listLeaveRequests(UUID employeeId) {
        List<com.bookmycourt.hr.entity.LeaveRequest> list = (employeeId != null)
                ? leaveRequests.findByEmployee_IdOrderByFromDateDesc(employeeId)
                : leaveRequests.findAll();
        return list.stream().map(this::toLeaveResponse).toList();
    }

    @Transactional
    public com.bookmycourt.hr.dto.LeaveRequestResponse updateLeaveStatus(UUID requestId, String status, UUID approvedByUserId) {
        com.bookmycourt.hr.entity.LeaveRequest lr = leaveRequests.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Leave request not found: " + requestId));
        lr.setStatus(status.toUpperCase());
        if (approvedByUserId != null) {
            users.findById(approvedByUserId).ifPresent(lr::setApprovedBy);
        }
        leaveRequests.save(lr);
        return toLeaveResponse(lr);
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.hr.entity.LeaveType> listLeaveTypes() {
        return leaveTypes.findAll();
    }

    @Transactional
    public com.bookmycourt.hr.dto.ShiftScheduleResponse scheduleShift(com.bookmycourt.hr.dto.ShiftScheduleRequest request) {
        Employee emp = employees.findById(request.employeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found: " + request.employeeId()));

        com.bookmycourt.hr.entity.ShiftSchedule s = new com.bookmycourt.hr.entity.ShiftSchedule();
        s.setEmployee(emp);
        s.setShiftDate(request.shiftDate());
        s.setStartTime(request.startTime());
        s.setEndTime(request.endTime());
        s.setRoleAssigned(request.roleAssigned() != null ? request.roleAssigned() : emp.getJobTitle());
        shifts.save(s);

        return toShiftResponse(s);
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.hr.dto.ShiftScheduleResponse> listShifts(LocalDate date, UUID employeeId) {
        List<com.bookmycourt.hr.entity.ShiftSchedule> list;
        if (employeeId != null && date != null) {
            list = shifts.findByEmployee_IdAndShiftDateOrderByStartTimeAsc(employeeId, date);
        } else if (employeeId != null) {
            list = shifts.findByEmployee_IdOrderByShiftDateDesc(employeeId);
        } else if (date != null) {
            list = shifts.findByShiftDateOrderByStartTimeAsc(date);
        } else {
            list = shifts.findAll();
        }
        return list.stream().map(this::toShiftResponse).toList();
    }

    @Transactional
    public com.bookmycourt.hr.dto.PayrollRunResponse generatePayrollRun(String month) {
        com.bookmycourt.hr.entity.PayrollRun run = payrollRuns.findByMonth(month).orElseGet(() -> {
            com.bookmycourt.hr.entity.PayrollRun newRun = new com.bookmycourt.hr.entity.PayrollRun();
            newRun.setMonth(month);
            newRun.setStatus("DRAFT");
            return newRun;
        });

        List<Employee> activeEmps = employees.findByEmploymentStatus("ACTIVE");
        java.math.BigDecimal totalGross = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalDeductions = java.math.BigDecimal.ZERO;
        java.math.BigDecimal totalNet = java.math.BigDecimal.ZERO;

        List<com.bookmycourt.hr.entity.Payslip> generatedPayslips = new java.util.ArrayList<>();
        for (Employee emp : activeEmps) {
            java.math.BigDecimal baseSalary = java.math.BigDecimal.valueOf(25000);
            java.math.BigDecimal deductions = java.math.BigDecimal.valueOf(1000);
            java.math.BigDecimal net = baseSalary.subtract(deductions);

            com.bookmycourt.hr.entity.Payslip slip = new com.bookmycourt.hr.entity.Payslip();
            slip.setPayrollRun(run);
            slip.setEmployee(emp);
            slip.setGrossSalary(baseSalary);
            slip.setDeductions(deductions);
            slip.setNetSalary(net);
            slip.setStatus("PENDING");
            generatedPayslips.add(slip);

            totalGross = totalGross.add(baseSalary);
            totalDeductions = totalDeductions.add(deductions);
            totalNet = totalNet.add(net);
        }

        run.setTotalGross(totalGross);
        run.setTotalDeductions(totalDeductions);
        run.setTotalNet(totalNet);
        run.setStatus("FINALISED");
        run.setFinalisedAt(java.time.OffsetDateTime.now());
        run.setPayslips(generatedPayslips);
        payrollRuns.save(run);

        return new com.bookmycourt.hr.dto.PayrollRunResponse(
                run.getId(),
                run.getMonth(),
                run.getStatus(),
                run.getTotalGross(),
                run.getTotalDeductions(),
                run.getTotalNet(),
                run.getFinalisedAt(),
                activeEmps.size()
        );
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.hr.dto.PayrollRunResponse> listPayrollRuns() {
        return payrollRuns.findAll().stream().map(r -> new com.bookmycourt.hr.dto.PayrollRunResponse(
                r.getId(),
                r.getMonth(),
                r.getStatus(),
                r.getTotalGross(),
                r.getTotalDeductions(),
                r.getTotalNet(),
                r.getFinalisedAt(),
                r.getPayslips() != null ? r.getPayslips().size() : 0
        )).toList();
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.hr.dto.PayslipResponse> listPayslips(UUID runId, UUID employeeId) {
        List<com.bookmycourt.hr.entity.Payslip> list;
        if (runId != null) {
            list = payslips.findByPayrollRun_Id(runId);
        } else if (employeeId != null) {
            list = payslips.findByEmployee_IdOrderByCreatedAtDesc(employeeId);
        } else {
            list = payslips.findAll();
        }
        return list.stream().map(p -> new com.bookmycourt.hr.dto.PayslipResponse(
                p.getId(),
                p.getPayrollRun().getId(),
                p.getEmployee().getId(),
                p.getEmployee().getUser() != null ? p.getEmployee().getUser().getFirstName() + " " + p.getEmployee().getUser().getLastName() : "Employee",
                p.getEmployee().getJobTitle(),
                p.getGrossSalary(),
                p.getDeductions(),
                p.getNetSalary(),
                p.getStatus()
        )).toList();
    }

    private com.bookmycourt.hr.dto.LeaveRequestResponse toLeaveResponse(com.bookmycourt.hr.entity.LeaveRequest lr) {
        String empName = lr.getEmployee() != null && lr.getEmployee().getUser() != null
                ? lr.getEmployee().getUser().getFirstName() + " " + lr.getEmployee().getUser().getLastName()
                : "Employee";
        return new com.bookmycourt.hr.dto.LeaveRequestResponse(
                lr.getId(),
                lr.getEmployee().getId(),
                empName,
                lr.getLeaveType().getId(),
                lr.getLeaveType().getName(),
                lr.getFromDate(),
                lr.getToDate(),
                lr.getDays(),
                lr.getStatus(),
                lr.getReason(),
                lr.getApprovedBy() != null ? lr.getApprovedBy().getId() : null
        );
    }

    private com.bookmycourt.hr.dto.ShiftScheduleResponse toShiftResponse(com.bookmycourt.hr.entity.ShiftSchedule s) {
        String empName = s.getEmployee() != null && s.getEmployee().getUser() != null
                ? s.getEmployee().getUser().getFirstName() + " " + s.getEmployee().getUser().getLastName()
                : "Employee";
        return new com.bookmycourt.hr.dto.ShiftScheduleResponse(
                s.getId(),
                s.getEmployee().getId(),
                empName,
                s.getShiftDate(),
                s.getStartTime(),
                s.getEndTime(),
                s.getRoleAssigned()
        );
    }
}
