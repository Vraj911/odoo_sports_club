package com.bookmycourt.hr.service;

import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    private final Clock clock;

    @Autowired
    public HrService(
            EmployeeRepository employees,
            AttendanceRepository attendances,
            AppUserRepository users,
            HrMapper mapper,
            com.bookmycourt.hr.repository.LeaveTypeRepository leaveTypes,
            com.bookmycourt.hr.repository.LeaveRequestRepository leaveRequests,
            com.bookmycourt.hr.repository.ShiftScheduleRepository shifts,
            com.bookmycourt.hr.repository.PayrollRunRepository payrollRuns,
            com.bookmycourt.hr.repository.PayslipRepository payslips,
            Clock clock) {
        this.employees = employees;
        this.attendances = attendances;
        this.users = users;
        this.mapper = mapper;
        this.leaveTypes = leaveTypes;
        this.leaveRequests = leaveRequests;
        this.shifts = shifts;
        this.payrollRuns = payrollRuns;
        this.payslips = payslips;
        this.clock = clock;
    }

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
        this(employees, attendances, users, mapper, leaveTypes, leaveRequests, shifts, payrollRuns, payslips, Clock.systemDefaultZone());
    }

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        AppUser user = users.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (employees.findByUser_Id(user.getId()).isPresent()) {
            throw new IllegalArgumentException("User is already registered as an employee");
        }

        String maxNum = employees.findMaxEmployeeNumber();
        int nextId = 1;
        if (maxNum != null && maxNum.startsWith("EMP-")) {
            try {
                nextId = Integer.parseInt(maxNum.substring(4)) + 1;
            } catch (NumberFormatException ignored) {}
        }

        Employee emp = new Employee();
        emp.setUser(user);
        emp.setEmployeeNumber(String.format("EMP-%04d", nextId));
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
        if (request.checkInAt() != null && request.checkOutAt() != null && request.checkOutAt().isBefore(request.checkInAt())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Check-out time cannot be before check-in time");
        }
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        if (request.attendanceDate().isAfter(today)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Attendance date cannot be in the future");
        }

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
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
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
        if (request.toDate().isBefore(request.fromDate())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "toDate cannot be before fromDate");
        }

        Employee emp = employees.findById(request.employeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found: " + request.employeeId()));
        com.bookmycourt.hr.entity.LeaveType lt = leaveTypes.findById(request.leaveTypeId())
                .orElseThrow(() -> new NotFoundException("Leave type not found: " + request.leaveTypeId()));

        // Check overlapping leave requests
        List<com.bookmycourt.hr.entity.LeaveRequest> existingLeaves = leaveRequests.findByEmployee_IdAndStatusIn(
                emp.getId(), List.of("PENDING", "APPROVED")
        );
        for (com.bookmycourt.hr.entity.LeaveRequest el : existingLeaves) {
            if (!request.fromDate().isAfter(el.getToDate()) && !request.toDate().isBefore(el.getFromDate())) {
                throw new DomainException(ErrorCode.CONFLICT, "Employee already has a leave request for this period (" + el.getFromDate() + " to " + el.getToDate() + ")");
            }
        }

        int days = request.days() > 0 ? request.days() : (int) java.time.temporal.ChronoUnit.DAYS.between(request.fromDate(), request.toDate()) + 1;
        if (days <= 0) days = 1;

        // Check yearly balance for this leave type
        int leaveYear = request.fromDate().getYear();
        int approvedDays = existingLeaves.stream()
                .filter(l -> l.getLeaveType().getId().equals(lt.getId()) && "APPROVED".equalsIgnoreCase(l.getStatus()) && l.getFromDate().getYear() == leaveYear)
                .mapToInt(com.bookmycourt.hr.entity.LeaveRequest::getDays)
                .sum();
        if (approvedDays + days > lt.getYearlyDays()) {
            throw new DomainException(ErrorCode.LEAVE_BALANCE, "Insufficient leave balance for " + lt.getName() + " (yearly limit: " + lt.getYearlyDays() + ", used: " + approvedDays + ")");
        }

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
        String newStatus = status.toUpperCase();
        if (!List.of("APPROVED", "REJECTED", "CANCELLED").contains(newStatus)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Invalid leave status: " + status);
        }
        if ("APPROVED".equalsIgnoreCase(lr.getStatus()) && "APPROVED".equalsIgnoreCase(newStatus)) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Leave request is already approved");
        }
        lr.setStatus(newStatus);
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
        com.bookmycourt.hr.entity.PayrollRun existingRun = payrollRuns.findByMonth(month).orElse(null);
        if (existingRun != null && "FINALISED".equalsIgnoreCase(existingRun.getStatus())) {
            throw new DomainException(
                    ErrorCode.PAYROLL_FINALISED,
                    "Payroll for " + month + " has already been generated");
        }

        com.bookmycourt.hr.entity.PayrollRun run = existingRun;
        if (run == null) {
            com.bookmycourt.hr.entity.PayrollRun newRun = new com.bookmycourt.hr.entity.PayrollRun();
            newRun.setMonth(month);
            newRun.setStatus("DRAFT");
            run = newRun;
        } else {
            // Re-running a draft month: remove previous payslips to prevent duplicate constraints
            List<com.bookmycourt.hr.entity.Payslip> existingSlips = payslips.findByPayrollRun_Id(run.getId());
            if (!existingSlips.isEmpty()) {
                payslips.deleteAll(existingSlips);
            }
        }

        List<Employee> activeEmps = employees.findByEmploymentStatus("ACTIVE");
        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        YearMonth ym = YearMonth.parse(month);
        LocalDate mStart = ym.atDay(1);
        LocalDate mEnd = ym.atEndOfMonth();

        List<com.bookmycourt.hr.entity.Payslip> generatedPayslips = new java.util.ArrayList<>();
        for (Employee emp : activeEmps) {
            BigDecimal baseSalary = parseSalaryField(emp.getSalaryStructure(), "basic",
                    parseSalaryField(emp.getSalaryStructure(), "baseSalary",
                            parseSalaryField(emp.getSalaryStructure(), "gross", BigDecimal.valueOf(25000))));
            BigDecimal deductions = parseSalaryField(emp.getSalaryStructure(), "deductions", BigDecimal.valueOf(1000));

            // Factor in approved unpaid leaves during the month
            long unpaidDays = leaveRequests.findByEmployee_IdAndStatusIn(emp.getId(), List.of("APPROVED")).stream()
                    .filter(l -> !l.getLeaveType().isPaid() && !l.getFromDate().isAfter(mEnd) && !l.getToDate().isBefore(mStart))
                    .mapToLong(com.bookmycourt.hr.entity.LeaveRequest::getDays)
                    .sum();
            if (unpaidDays > 0) {
                BigDecimal dailyRate = baseSalary.divide(BigDecimal.valueOf(ym.lengthOfMonth()), 2, RoundingMode.HALF_UP);
                deductions = deductions.add(dailyRate.multiply(BigDecimal.valueOf(unpaidDays)));
            }

            BigDecimal net = baseSalary.subtract(deductions).max(BigDecimal.ZERO);

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
        run.setFinalisedAt(OffsetDateTime.now(clock));
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

    private BigDecimal parseSalaryField(String json, String field, BigDecimal fallback) {
        if (json == null || json.isBlank() || json.equals("{}")) return fallback;
        try {
            Pattern p = Pattern.compile("\"" + field + "\"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)");
            Matcher m = p.matcher(json);
            if (m.find()) {
                return new BigDecimal(m.group(1));
            }
        } catch (Exception ignored) {}
        return fallback;
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
    public com.bookmycourt.hr.dto.PayrollRunResponse getPayrollRun(UUID id) {
        com.bookmycourt.hr.entity.PayrollRun r = payrollRuns.findById(id)
                .orElseThrow(() -> new NotFoundException("Payroll run not found: " + id));
        return new com.bookmycourt.hr.dto.PayrollRunResponse(
                r.getId(),
                r.getMonth(),
                r.getStatus(),
                r.getTotalGross(),
                r.getTotalDeductions(),
                r.getTotalNet(),
                r.getFinalisedAt(),
                r.getPayslips() != null ? r.getPayslips().size() : 0
        );
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.hr.dto.PayslipResponse> listPayslips(UUID payrollRunId, UUID employeeId) {
        List<com.bookmycourt.hr.entity.Payslip> list;
        if (payrollRunId != null) {
            list = payslips.findByPayrollRun_Id(payrollRunId);
        } else if (employeeId != null) {
            list = payslips.findByEmployee_IdOrderByCreatedAtDesc(employeeId);
        } else {
            list = payslips.findAll();
        }
        return list.stream().map(this::toPayslipResponse).toList();
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

    private com.bookmycourt.hr.dto.PayslipResponse toPayslipResponse(com.bookmycourt.hr.entity.Payslip p) {
        String empName = p.getEmployee() != null && p.getEmployee().getUser() != null
                ? p.getEmployee().getUser().getFirstName() + " " + p.getEmployee().getUser().getLastName()
                : "Employee";
        return new com.bookmycourt.hr.dto.PayslipResponse(
                p.getId(),
                p.getPayrollRun().getId(),
                p.getEmployee().getId(),
                empName,
                p.getEmployee() != null ? p.getEmployee().getJobTitle() : null,
                p.getGrossSalary(),
                p.getDeductions(),
                p.getNetSalary(),
                p.getStatus()
        );
    }
}
