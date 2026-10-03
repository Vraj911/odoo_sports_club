package com.bookmycourt.hr.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.common.sequence.NumberSeriesService;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.finance.entity.Expense;
import com.bookmycourt.finance.repository.ExpenseRepository;
import com.bookmycourt.finance.service.LedgerService;
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
import com.bookmycourt.hr.entity.Attendance;
import com.bookmycourt.hr.entity.Employee;
import com.bookmycourt.hr.entity.LeaveRequest;
import com.bookmycourt.hr.entity.LeaveType;
import com.bookmycourt.hr.entity.PayrollRun;
import com.bookmycourt.hr.entity.Payslip;
import com.bookmycourt.hr.entity.ShiftSchedule;
import com.bookmycourt.hr.mapper.HrMapper;
import com.bookmycourt.hr.repository.AttendanceRepository;
import com.bookmycourt.hr.repository.EmployeeRepository;
import com.bookmycourt.hr.repository.LeaveRequestRepository;
import com.bookmycourt.hr.repository.LeaveTypeRepository;
import com.bookmycourt.hr.repository.PayrollRunRepository;
import com.bookmycourt.hr.repository.PayslipRepository;
import com.bookmycourt.hr.repository.ShiftScheduleRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class HrService {

    private static final Logger log = LoggerFactory.getLogger(HrService.class);

    private static final Set<String> ATTENDANCE_STATUSES = Set.of("PRESENT", "LATE", "HALF_DAY", "ABSENT", "ON_LEAVE");
    private static final Set<String> EMPLOYMENT_STATUSES = Set.of("ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED");
    private static final Set<String> PAY_METHODS = Set.of("CASH", "CARD", "UPI", "ONLINE");
    private static final Pattern MONTH = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");
    private static final int LATE_GRACE_MINUTES = 10;
    private static final int MAX_SHIFT_MINUTES_PER_DAY = 12 * 60;

    private final EmployeeRepository employees;
    private final AttendanceRepository attendances;
    private final AppUserRepository users;
    private final HrMapper mapper;
    private final LeaveTypeRepository leaveTypes;
    private final LeaveRequestRepository leaveRequests;
    private final ShiftScheduleRepository shifts;
    private final PayrollRunRepository payrollRuns;
    private final PayslipRepository payslips;
    private final HrAccess access;
    private final ClubCalendarService calendar;
    private final ClubSettingRepository settings;
    private final ExpenseRepository expenses;
    private final NumberSeriesService numberSeries;
    private final LedgerService ledger;
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final Clock clock;

    public HrService(
            EmployeeRepository employees,
            AttendanceRepository attendances,
            AppUserRepository users,
            HrMapper mapper,
            LeaveTypeRepository leaveTypes,
            LeaveRequestRepository leaveRequests,
            ShiftScheduleRepository shifts,
            PayrollRunRepository payrollRuns,
            PayslipRepository payslips,
            HrAccess access,
            ClubCalendarService calendar,
            ClubSettingRepository settings,
            ExpenseRepository expenses,
            NumberSeriesService numberSeries,
            LedgerService ledger,
            JdbcClient jdbc,
            ObjectMapper json,
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
        this.access = access;
        this.calendar = calendar;
        this.settings = settings;
        this.expenses = expenses;
        this.numberSeries = numberSeries;
        this.ledger = ledger;
        this.jdbc = jdbc;
        this.json = json;
        this.clock = clock;
    }

    // =====================================================================
    // Helpers
    // =====================================================================
    private LocalDate today() {
        return LocalDate.now(clock.withZone(ClubTime.IST));
    }

    private AppUser currentUser() {
        Actor a = ActorHolder.current();
        return (a == null || a.userId() == null) ? null : users.findById(a.userId()).orElse(null);
    }

    private static String fullName(Employee e) {
        return e.getUser() == null ? "Employee" : e.getUser().getFirstName() + " " + e.getUser().getLastName();
    }

    private Employee requireEmployee(UUID id) {
        return employees.findById(id).orElseThrow(() -> new NotFoundException("Employee not found: " + id));
    }

    private Employee requireActiveEmployee(UUID id) {
        Employee e = requireEmployee(id);
        if (!"ACTIVE".equalsIgnoreCase(e.getEmploymentStatus())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Employee " + e.getEmployeeNumber() + " is not active");
        }
        return e;
    }

    /**
     * Rejects anything that is not a JSON object, so a bad value cannot reach
     * the jsonb column as a 500.
     */
    private String validSalaryJson(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            JsonNode n = json.readTree(raw);
            if (n == null || !n.isObject()) {
                throw new IllegalArgumentException();
            }
            return raw;
        } catch (Exception e) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "salaryStructure must be a valid JSON object");
        }
    }

    // =====================================================================
    // Employees (HR-01)
    // =====================================================================
    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        AppUser user = users.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (employees.findByUser_Id(user.getId()).isPresent()) {
            throw new DomainException(ErrorCode.CONFLICT, "User is already registered as an employee");
        }

        Employee emp = new Employee();
        emp.setUser(user);
        emp.setEmployeeNumber(nextEmployeeNumber());
        emp.setDepartment(request.department());
        emp.setJobTitle(request.jobTitle().trim());
        emp.setJoiningDate(request.joiningDate());
        emp.setEmploymentStatus("ACTIVE");
        if (request.salaryStructure() != null) {
            emp.setSalaryStructure(validSalaryJson(request.salaryStructure()));
        }

        employees.saveAndFlush(emp);
        return mapper.toResponse(emp);
    }

    /**
     * Serialised with an advisory lock; numeric MAX so EMP-10000 sorts after
     * EMP-9999.
     */
    private String nextEmployeeNumber() {
        jdbc.sql("SELECT pg_advisory_xact_lock(hashtextextended('employee-number', 0))").query().listOfRows();
        Integer max = jdbc.sql("""
                SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 5) AS INTEGER)), 0)
                FROM employee WHERE employee_number ~ '^EMP-[0-9]+$'
                """).query(Integer.class).single();
        return String.format("EMP-%04d", (max == null ? 0 : max) + 1);
    }

    @Transactional
    public EmployeeResponse updateEmployee(UUID id, UpdateEmployeeRequest request) {
        Employee emp = requireEmployee(id);
        if (request.department() != null) {
            emp.setDepartment(request.department());
        }
        if (request.jobTitle() != null) {
            emp.setJobTitle(request.jobTitle().trim());
        }
        if (request.employmentStatus() != null) {
            String s = request.employmentStatus().trim().toUpperCase(Locale.ROOT);
            if (!EMPLOYMENT_STATUSES.contains(s)) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "employmentStatus must be one of " + EMPLOYMENT_STATUSES);
            }
            emp.setEmploymentStatus(s);
        }
        if (request.salaryStructure() != null) {
            emp.setSalaryStructure(validSalaryJson(request.salaryStructure()));
        }
        employees.save(emp);
        return mapper.toResponse(emp);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(UUID id) {
        return mapper.toResponse(requireEmployee(id));
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployees(String status) {
        List<Employee> list = (status != null && !status.isBlank())
                ? employees.findByEmploymentStatus(status.trim().toUpperCase(Locale.ROOT))
                : employees.findByOrderByJoiningDateDesc();
        return list.stream().map(mapper::toResponse).toList();
    }

    // =====================================================================
    // Attendance (HR-03)
    // =====================================================================
    /**
     * Manager correction. A reason is mandatory and the approver is the
     * logged-in user, not a request field.
     */
    @Transactional
    public AttendanceResponse recordAttendance(RecordAttendanceRequest request) {
        String status = request.status().trim().toUpperCase(Locale.ROOT);
        if (!ATTENDANCE_STATUSES.contains(status)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "status must be one of " + ATTENDANCE_STATUSES);
        }
        if (request.notes() == null || request.notes().isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A reason (notes) is required for a manual correction");
        }
        if (request.checkInAt() != null && request.checkOutAt() != null && request.checkOutAt().isBefore(request.checkInAt())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Check-out time cannot be before check-in time");
        }
        if (request.attendanceDate().isAfter(today())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Attendance date cannot be in the future");
        }

        Employee emp = requireEmployee(request.employeeId());
        Attendance att = attendances.findByEmployee_IdAndAttendanceDate(emp.getId(), request.attendanceDate())
                .orElseGet(() -> {
                    Attendance a = new Attendance();
                    a.setEmployee(emp);
                    a.setAttendanceDate(request.attendanceDate());
                    return a;
                });

        att.setCheckInAt(request.checkInAt());
        att.setCheckOutAt(request.checkOutAt());
        att.setStatus(status);
        att.setSource("MANUAL");
        att.setNotes(request.notes().trim());
        att.setApprovedBy(currentUser());
        attendances.save(att);
        return mapper.toResponse(att);
    }

    /**
     * Self-service clock in. Uses server time; LATE if later than shift start +
     * grace.
     */
    @Transactional
    public AttendanceResponse clockIn() {
        Employee emp = access.currentEmployee()
                .orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN, "No employee record for this user"));
        requireActiveEmployee(emp.getId());

        ZonedDateTime now = ZonedDateTime.now(clock.withZone(ClubTime.IST));
        LocalDate day = now.toLocalDate();

        Attendance att = attendances.findByEmployee_IdAndAttendanceDate(emp.getId(), day).orElse(null);
        if (att != null && att.getCheckInAt() != null) {
            throw new DomainException(ErrorCode.CONFLICT, "Already clocked in today");
        }

        String status = "PRESENT";
        var todaysShifts = shifts.findByEmployee_IdAndShiftDateOrderByStartTimeAsc(emp.getId(), day);
        if (!todaysShifts.isEmpty()) {
            LocalTime start = todaysShifts.get(0).getStartTime();
            if (now.toLocalTime().isAfter(start.plusMinutes(LATE_GRACE_MINUTES))) {
                status = "LATE";
            }
        }

        if (att == null) {
            att = new Attendance();
            att.setEmployee(emp);
            att.setAttendanceDate(day);
        }
        att.setCheckInAt(now.toInstant());
        att.setStatus(status);
        att.setSource("BUTTON");
        attendances.save(att);
        return mapper.toResponse(att);
    }

    @Transactional
    public AttendanceResponse clockOut() {
        Employee emp = access.currentEmployee()
                .orElseThrow(() -> new DomainException(ErrorCode.FORBIDDEN, "No employee record for this user"));
        LocalDate day = today();

        // Night shifts: the open record may belong to yesterday.
        Attendance att = attendances.findByEmployee_IdAndAttendanceDate(emp.getId(), day)
                .filter(a -> a.getCheckInAt() != null && a.getCheckOutAt() == null)
                .or(() -> attendances.findByEmployee_IdAndAttendanceDate(emp.getId(), day.minusDays(1))
                .filter(a -> a.getCheckInAt() != null && a.getCheckOutAt() == null))
                .orElseThrow(() -> new DomainException(ErrorCode.INVALID_STATE, "No open clock-in to close"));

        att.setCheckOutAt(Instant.now(clock));
        attendances.save(att);
        return mapper.toResponse(att);
    }

    /**
     * End-of-day sweep: scheduled staff with no record become ABSENT, or
     * ON_LEAVE if leave is approved. Idempotent.
     */
    @Transactional
    public int closeDay(LocalDate day) {
        int marked = 0;
        Set<UUID> handled = new HashSet<>();
        for (ShiftSchedule s : shifts.findByShiftDateOrderByStartTimeAsc(day)) {
            Employee emp = s.getEmployee();
            if (!handled.add(emp.getId()) || !"ACTIVE".equalsIgnoreCase(emp.getEmploymentStatus())) {
                continue;
            }
            if (attendances.findByEmployee_IdAndAttendanceDate(emp.getId(), day).isPresent()) {
                continue;
            }

            boolean onLeave = leaveRequests.findByEmployee_IdAndStatusIn(emp.getId(), List.of("APPROVED")).stream()
                    .anyMatch(l -> !day.isBefore(l.getFromDate()) && !day.isAfter(l.getToDate()));

            Attendance a = new Attendance();
            a.setEmployee(emp);
            a.setAttendanceDate(day);
            a.setStatus(onLeave ? "ON_LEAVE" : "ABSENT");
            a.setSource("SYSTEM");
            a.setNotes("Auto-marked at end of day");
            attendances.save(a);
            marked++;
        }
        if (marked > 0) {
            log.info("Attendance close-day {}: marked {} records", day, marked);
        }
        return marked;
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> listAttendance(UUID employeeId, LocalDate date, LocalDate from, LocalDate to) {
        List<Attendance> rows;
        if (date != null) {
            rows = attendances.findByAttendanceDate(date);
            if (employeeId != null) {
                rows = rows.stream().filter(a -> a.getEmployee().getId().equals(employeeId)).toList();
            }
        } else if (from != null || to != null) {
            LocalDate f = from != null ? from : today().withDayOfMonth(1);
            LocalDate t = to != null ? to : today();
            rows = employeeId != null
                    ? attendances.findByEmployee_IdAndAttendanceDateBetweenOrderByAttendanceDateDesc(employeeId, f, t)
                    : attendances.findByAttendanceDateBetweenOrderByAttendanceDateDesc(f, t);
        } else if (employeeId != null) {
            rows = attendances.findByEmployee_IdOrderByAttendanceDateDesc(employeeId);
        } else {
            // No filter used to mean "the whole table"; default to the current month instead.
            rows = attendances.findByAttendanceDateBetweenOrderByAttendanceDateDesc(today().withDayOfMonth(1), today());
        }
        return rows.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTodayAttendanceSummary() {
        LocalDate today = today();
        List<Attendance> records = attendances.findByAttendanceDate(today);
        long totalEmp = employees.findByEmploymentStatus("ACTIVE").size();
        long present = records.stream().filter(a -> "PRESENT".equalsIgnoreCase(a.getStatus())).count();
        long late = records.stream().filter(a -> "LATE".equalsIgnoreCase(a.getStatus())).count();
        long halfDay = records.stream().filter(a -> "HALF_DAY".equalsIgnoreCase(a.getStatus())).count();
        long onLeave = records.stream().filter(a -> "ON_LEAVE".equalsIgnoreCase(a.getStatus())).count();
        long absent = records.stream().filter(a -> "ABSENT".equalsIgnoreCase(a.getStatus())).count();

        // "absent" now means marked ABSENT. Before a shift ends, unmarked staff are "notMarked", not absent.
        Map<String, Object> map = new java.util.HashMap<>();
        map.put("date", today);
        map.put("totalEmployees", totalEmp);
        map.put("present", present);
        map.put("late", late);
        map.put("halfDay", halfDay);
        map.put("onLeave", onLeave);
        map.put("absent", absent);
        map.put("notMarked", Math.max(0, totalEmp - records.size()));
        return map;
    }

    // =====================================================================
    // Leave (HR-04, HR-05, BR-13)
    // =====================================================================
    /**
     * Calendar days in [from, to] on which the club is open. Server-side; the
     * client's day count is ignored.
     */
    private int countLeaveDays(LocalDate from, LocalDate to) {
        int n = 0;
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            if (!calendar.isClosed(d)) {
                n++;
            }
        }
        return n;
    }

    private static int sumDays(List<LeaveRequest> all, UUID typeId, int year, String status, UUID excludeId) {
        return all.stream()
                .filter(l -> l.getLeaveType().getId().equals(typeId)
                && status.equalsIgnoreCase(l.getStatus())
                && l.getFromDate().getYear() == year
                && (excludeId == null || !l.getId().equals(excludeId)))
                .mapToInt(LeaveRequest::getDays).sum();
    }

    @Transactional
    public LeaveRequestResponse applyLeave(ApplyLeaveRequest request) {
        if (request.toDate().isBefore(request.fromDate())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "toDate cannot be before fromDate");
        }
        if (ChronoUnit.DAYS.between(request.fromDate(), request.toDate()) > 120) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A single leave request cannot exceed 120 days");
        }

        Employee emp = requireActiveEmployee(request.employeeId());
        LeaveType lt = leaveTypes.findById(request.leaveTypeId())
                .orElseThrow(() -> new NotFoundException("Leave type not found: " + request.leaveTypeId()));

        List<LeaveRequest> mine = leaveRequests.findByEmployee_IdAndStatusIn(emp.getId(), List.of("PENDING", "APPROVED"));
        for (LeaveRequest el : mine) {
            if (!request.fromDate().isAfter(el.getToDate()) && !request.toDate().isBefore(el.getFromDate())) {
                throw new DomainException(ErrorCode.CONFLICT,
                        "Employee already has a leave request for this period (" + el.getFromDate() + " to " + el.getToDate() + ")");
            }
        }

        int days = countLeaveDays(request.fromDate(), request.toDate());
        if (days <= 0) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Every day in this range is a club closure; no leave is needed");
        }

        // BR-13: balance applies to paid leave only. Pending requests count too, so balance cannot be over-requested.
        if (lt.isPaid()) {
            int year = request.fromDate().getYear();
            int used = sumDays(mine, lt.getId(), year, "APPROVED", null) + sumDays(mine, lt.getId(), year, "PENDING", null);
            if (used + days > lt.getYearlyDays()) {
                throw new DomainException(ErrorCode.LEAVE_BALANCE, "Insufficient leave balance for " + lt.getName()
                        + " (yearly limit: " + lt.getYearlyDays() + ", approved + pending: " + used + ", requested: " + days + ")");
            }
        }

        LeaveRequest lr = new LeaveRequest();
        lr.setEmployee(emp);
        lr.setLeaveType(lt);
        lr.setFromDate(request.fromDate());
        lr.setToDate(request.toDate());
        lr.setDays(days);
        lr.setStatus("PENDING");
        lr.setReason(request.reason());
        leaveRequests.save(lr);
        return toLeaveResponse(lr, null);
    }

    @Transactional(readOnly = true)
    public List<LeaveRequestResponse> listLeaveRequests(UUID employeeId) {
        List<LeaveRequest> list = (employeeId != null)
                ? leaveRequests.findByEmployee_IdOrderByFromDateDesc(employeeId)
                : leaveRequests.findAll().stream().sorted(Comparator.comparing(LeaveRequest::getFromDate).reversed()).toList();
        return list.stream().map(l -> toLeaveResponse(l, null)).toList();
    }

    /**
     * Approve/reject: HR only, never your own request. Cancel: the employee
     * themself or HR. Terminal states are final.
     */
    @Transactional
    public LeaveRequestResponse updateLeaveStatus(UUID requestId, String status) {
        LeaveRequest lr = leaveRequests.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Leave request not found: " + requestId));
        String next = status.trim().toUpperCase(Locale.ROOT);
        String cur = lr.getStatus().toUpperCase(Locale.ROOT);
        UUID ownerEmployeeId = lr.getEmployee().getId();
        boolean owner = access.isSelf(ownerEmployeeId);

        switch (next) {
            case "APPROVED", "REJECTED" -> {
                if (!access.isHr()) {
                    throw new DomainException(ErrorCode.FORBIDDEN, "Only a manager can approve or reject leave");
                }
                if (owner) {
                    throw new DomainException(ErrorCode.FORBIDDEN, "You cannot approve or reject your own leave");
                }
                if (!"PENDING".equals(cur)) {
                    throw new DomainException(ErrorCode.INVALID_STATE, "Only PENDING requests can be " + next.toLowerCase(Locale.ROOT));
                }
            }
            case "CANCELLED" -> {
                if (!access.isHr() && !owner) {
                    throw new DomainException(ErrorCode.FORBIDDEN, "Not allowed");
                }
                if (!"PENDING".equals(cur) && !"APPROVED".equals(cur)) {
                    throw new DomainException(ErrorCode.INVALID_STATE, "A " + cur + " request cannot be cancelled");
                }
                if (owner && !access.isHr() && "APPROVED".equals(cur) && !lr.getFromDate().isAfter(today())) {
                    throw new DomainException(ErrorCode.INVALID_STATE, "Approved leave that has started can only be cancelled by a manager");
                }
            }
            default ->
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Invalid leave status: " + status);
        }

        String warning = null;
        if ("APPROVED".equals(next)) {
            // Balance can change between apply and approve, so check again (paid leave only, BR-13).
            if (lr.getLeaveType().isPaid()) {
                List<LeaveRequest> mine = leaveRequests.findByEmployee_IdAndStatusIn(ownerEmployeeId, List.of("APPROVED"));
                int approved = sumDays(mine, lr.getLeaveType().getId(), lr.getFromDate().getYear(), "APPROVED", lr.getId());
                if (approved + lr.getDays() > lr.getLeaveType().getYearlyDays()) {
                    throw new DomainException(ErrorCode.LEAVE_BALANCE, "Approving this would exceed the yearly "
                            + lr.getLeaveType().getName() + " balance of " + lr.getLeaveType().getYearlyDays());
                }
            }
            int clashes = shifts.findByEmployee_IdAndShiftDateBetweenOrderByShiftDateAscStartTimeAsc(
                    ownerEmployeeId, lr.getFromDate(), lr.getToDate()).size();
            if (clashes > 0) {
                warning = clashes + " scheduled shift(s) fall inside this leave; arrange cover";
            }
        }

        lr.setStatus(next);
        if (!"CANCELLED".equals(next)) {
            lr.setApprovedBy(currentUser());
        }
        leaveRequests.save(lr);
        return toLeaveResponse(lr, warning);
    }

    @Transactional(readOnly = true)
    public List<LeaveType> listLeaveTypes() {
        return leaveTypes.findAll();
    }

    public record LeaveBalance(UUID leaveTypeId, String leaveTypeName, boolean paid, int yearlyDays,
            int used, int pending, int remaining) {

    }

    @Transactional(readOnly = true)
    public List<LeaveBalance> leaveBalances(UUID employeeId, Integer year) {
        requireEmployee(employeeId);
        int y = year != null ? year : today().getYear();
        List<LeaveRequest> mine = leaveRequests.findByEmployee_IdAndStatusIn(employeeId, List.of("PENDING", "APPROVED"));
        return leaveTypes.findAll().stream().map(t -> {
            int used = sumDays(mine, t.getId(), y, "APPROVED", null);
            int pending = sumDays(mine, t.getId(), y, "PENDING", null);
            return new LeaveBalance(t.getId(), t.getName(), t.isPaid(), t.getYearlyDays(), used, pending,
                    Math.max(0, t.getYearlyDays() - used - pending));
        }).toList();
    }

    // =====================================================================
    // Shifts / roster (HR-02, BR-13)
    // =====================================================================
    private static long minuteOf(LocalDate d, LocalTime t) {
        return d.toEpochDay() * 1440L + t.toSecondOfDay() / 60;
    }

    /**
     * Minutes in a shift; an end earlier than the start means it runs past
     * midnight.
     */
    private static long duration(LocalTime start, LocalTime end) {
        long m = (end.toSecondOfDay() - start.toSecondOfDay()) / 60;
        return m <= 0 ? m + 1440 : m;
    }

    @Transactional
    public ShiftScheduleResponse scheduleShift(ShiftScheduleRequest request) {
        if (request.startTime().equals(request.endTime())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Shift start and end cannot be the same");
        }
        Employee emp = requireActiveEmployee(request.employeeId());

        // BR-13: approved leave blocks roster assignment.
        boolean onLeave = leaveRequests.findByEmployee_IdAndStatusIn(emp.getId(), List.of("APPROVED")).stream()
                .anyMatch(l -> !request.shiftDate().isBefore(l.getFromDate()) && !request.shiftDate().isAfter(l.getToDate()));
        if (onLeave) {
            throw new DomainException(ErrorCode.CONFLICT, fullName(emp) + " is on approved leave on " + request.shiftDate());
        }

        long newStart = minuteOf(request.shiftDate(), request.startTime());
        long newEnd = newStart + duration(request.startTime(), request.endTime());
        long sameDayMinutes = duration(request.startTime(), request.endTime());

        // Look one day either side so a night shift that spills over midnight is caught.
        for (ShiftSchedule ex : shifts.findByEmployee_IdAndShiftDateBetweenOrderByShiftDateAscStartTimeAsc(
                emp.getId(), request.shiftDate().minusDays(1), request.shiftDate().plusDays(1))) {
            long exStart = minuteOf(ex.getShiftDate(), ex.getStartTime());
            long exEnd = exStart + duration(ex.getStartTime(), ex.getEndTime());
            if (newStart < exEnd && exStart < newEnd) {
                throw new DomainException(ErrorCode.CONFLICT, "Overlaps an existing shift (" + ex.getShiftDate() + " "
                        + ex.getStartTime() + "-" + ex.getEndTime() + ")");
            }
            if (ex.getShiftDate().equals(request.shiftDate())) {
                sameDayMinutes += duration(ex.getStartTime(), ex.getEndTime());
            }
        }
        if (sameDayMinutes > MAX_SHIFT_MINUTES_PER_DAY) {
            throw new DomainException(ErrorCode.CONFLICT, "Total scheduled time for " + request.shiftDate() + " would exceed 12 hours");
        }

        ShiftSchedule s = new ShiftSchedule();
        s.setEmployee(emp);
        s.setShiftDate(request.shiftDate());
        s.setStartTime(request.startTime());
        s.setEndTime(request.endTime());
        s.setRoleAssigned(request.roleAssigned() != null ? request.roleAssigned() : emp.getJobTitle());
        shifts.save(s);
        return toShiftResponse(s);
    }

    @Transactional
    public void deleteShift(UUID shiftId) {
        if (!shifts.existsById(shiftId)) {
            throw new NotFoundException("Shift not found: " + shiftId);
        }
        shifts.deleteById(shiftId);
    }

    @Transactional(readOnly = true)
    public List<ShiftScheduleResponse> listShifts(LocalDate date, UUID employeeId, LocalDate from, LocalDate to) {
        List<ShiftSchedule> list;
        if (employeeId != null && date != null) {
            list = shifts.findByEmployee_IdAndShiftDateOrderByStartTimeAsc(employeeId, date);
        } else if (from != null && to != null) {
            list = employeeId != null
                    ? shifts.findByEmployee_IdAndShiftDateBetweenOrderByShiftDateAscStartTimeAsc(employeeId, from, to)
                    : shifts.findByShiftDateBetweenOrderByShiftDateAscStartTimeAsc(from, to);
        } else if (employeeId != null) {
            list = shifts.findByEmployee_IdOrderByShiftDateDesc(employeeId);
        } else if (date != null) {
            list = shifts.findByShiftDateOrderByStartTimeAsc(date);
        } else {
            // default: this week instead of the whole table
            LocalDate t = today();
            list = shifts.findByShiftDateBetweenOrderByShiftDateAscStartTimeAsc(t, t.plusDays(6));
        }
        return list.stream().map(this::toShiftResponse).toList();
    }

    // =====================================================================
    // Payroll (HR-06, HR-07, HR-08, AC-15)
    // =====================================================================
    /**
     * Builds (or rebuilds) the DRAFT for a month so the accountant can review
     * it. With finalise=true it also finalises. A FINALISED month is locked.
     */
    @Transactional
    public PayrollRunResponse generatePayrollRun(String month, boolean finalise) {
        if (month == null || !MONTH.matcher(month).matches()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "month must be in the form YYYY-MM");
        }
        YearMonth ym = YearMonth.parse(month);
        if (ym.isAfter(YearMonth.from(today()))) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Cannot run payroll for a future month");
        }

        PayrollRun run = payrollRuns.findByMonth(month).orElse(null);
        if (run != null && !"DRAFT".equalsIgnoreCase(run.getStatus())) {
            throw new DomainException(ErrorCode.PAYROLL_FINALISED, "Payroll for " + month + " is already finalised");
        }
        if (run == null) {
            run = new PayrollRun();
            run.setMonth(month);
            run.setStatus("DRAFT");
        } else {
            // Mutate the managed list. Replacing it with a new list on an orphanRemoval collection throws in Hibernate.
            run.getPayslips().clear();
            payrollRuns.saveAndFlush(run);
        }

        LocalDate mEnd = ym.atEndOfMonth();
        List<Employee> eligible = employees.findByEmploymentStatus("ACTIVE").stream()
                .filter(e -> !e.getJoiningDate().isAfter(mEnd))
                .toList();
        if (eligible.isEmpty()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "No active employees to pay for " + month);
        }

        List<String> missing = new ArrayList<>();
        List<Payslip> slips = new ArrayList<>();
        BigDecimal pfDefault = settingPercent("payroll.pf_percent");
        BigDecimal esiDefault = settingPercent("payroll.esi_percent");
        BigDecimal tdsDefault = settingPercent("payroll.tds_percent");

        for (Employee emp : eligible) {
            Payslip slip = buildPayslip(run, emp, ym, pfDefault, esiDefault, tdsDefault);
            if (slip == null) {
                missing.add(emp.getEmployeeNumber()); 
            }else {
                slips.add(slip);
            }
        }
        if (!missing.isEmpty()) {
            // No invented salaries: the run fails loudly instead of paying a default amount.
            throw new DomainException(ErrorCode.VALIDATION_FAILED,
                    "Set a salary structure (basic/baseSalary/gross) for: " + String.join(", ", missing));
        }

        BigDecimal gross = BigDecimal.ZERO, ded = BigDecimal.ZERO, net = BigDecimal.ZERO;
        for (Payslip p : slips) {
            gross = gross.add(p.getGrossSalary());
            ded = ded.add(p.getDeductions());
            net = net.add(p.getNetSalary());
        }
        run.getPayslips().addAll(slips);
        run.setTotalGross(gross);
        run.setTotalDeductions(ded);
        run.setTotalNet(net);
        run.setStatus("DRAFT");

        try {
            payrollRuns.saveAndFlush(run);
        } catch (DataIntegrityViolationException e) {
            throw new DomainException(ErrorCode.CONFLICT, "Payroll for " + month + " is being generated by someone else");
        }

        return finalise ? finalisePayrollRun(run.getId()) : toRunResponse(run);
    }

    @Transactional
    public PayrollRunResponse finalisePayrollRun(UUID runId) {
        PayrollRun run = payrollRuns.findById(runId)
                .orElseThrow(() -> new NotFoundException("Payroll run not found: " + runId));
        if (!"DRAFT".equalsIgnoreCase(run.getStatus())) {
            throw new DomainException(ErrorCode.PAYROLL_FINALISED, "Payroll for " + run.getMonth() + " is already finalised");
        }
        if (run.getPayslips().isEmpty()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payroll run has no payslips");
        }

        run.setStatus("FINALISED");
        run.setFinalisedAt(OffsetDateTime.now(clock));
        payrollRuns.save(run);

        // HR-08 / AC-15: salaries payable posted to finance.
        ledger.postPayrollAccrual(run.getId(), run.getMonth(), run.getTotalGross(), run.getTotalDeductions(), run.getTotalNet());
        return toRunResponse(run);
    }

    /**
     * Pays one payslip: records the salary expense (FIN-12) and the cash/bank
     * movement (HR-08).
     */
    @Transactional
    public PayslipResponse markPayslipPaid(UUID payslipId, String methodRaw, String referenceRaw) {
        String method = methodRaw == null ? "" : methodRaw.trim().toUpperCase(Locale.ROOT);
        if (!PAY_METHODS.contains(method)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Payment method must be one of " + PAY_METHODS);
        }
        String reference = (referenceRaw == null || referenceRaw.isBlank()) ? null : referenceRaw.trim();
        if (!"CASH".equals(method) && reference == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "A reference number is required for " + method + " payments");
        }

        Payslip slip = payslips.findById(payslipId)
                .orElseThrow(() -> new NotFoundException("Payslip not found: " + payslipId));
        if (!"FINALISED".equalsIgnoreCase(slip.getPayrollRun().getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Finalise the payroll run before paying payslips");
        }
        if (!"PENDING".equalsIgnoreCase(slip.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Payslip is already " + slip.getStatus());
        }

        slip.setStatus("PAID");
        payslips.save(slip);

        Expense exp = new Expense();
        exp.setExpenseNumber(numberSeries.nextExpenseNumber());
        exp.setExpenseType("SALARY");
        exp.setDescription("Salary " + slip.getPayrollRun().getMonth() + " - " + slip.getEmployee().getEmployeeNumber());
        exp.setAmount(slip.getNetSalary());
        exp.setPaymentMethod(method);
        exp.setIncurredAt(Instant.now(clock));
        exp.setNotes(reference);
        exp.setRecordedBy(currentUser());
        expenses.save(exp);

        ledger.postSalaryPayout(slip.getId(), "Salary " + slip.getPayrollRun().getMonth() + " - "
                + slip.getEmployee().getEmployeeNumber(), method, slip.getNetSalary());
        return toPayslipResponse(slip);
    }

    private BigDecimal settingPercent(String key) {
        return settings.findByKey(key).map(s -> {
            try {
                return new BigDecimal(s.getValue());
            } catch (Exception e) {
                return BigDecimal.ZERO;
            }
        }).orElse(BigDecimal.ZERO);
    }

    private static BigDecimal num(JsonNode n, String field) {
        JsonNode v = n.get(field);
        if (v == null || !v.isNumber()) {
            return null;
        }
        return v.decimalValue();
    }

    private static BigDecimal pct(BigDecimal amount, BigDecimal percent) {
        return amount.multiply(percent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /**
     * salaryStructure keys: basic | baseSalary | gross, hra, allowances, bonus,
     * deductions (fixed), pfPercent, esiPercent, tdsPercent (override the
     * payroll.* club settings). Returns null when the employee has no usable
     * salary.
     */
    private Payslip buildPayslip(PayrollRun run, Employee emp, YearMonth ym,
            BigDecimal pfDefault, BigDecimal esiDefault, BigDecimal tdsDefault) {
        JsonNode s;
        try {
            s = json.readTree(emp.getSalaryStructure() == null ? "{}" : emp.getSalaryStructure());
        } catch (Exception e) {
            return null;
        }
        BigDecimal basic = num(s, "basic");
        if (basic == null) {
            basic = num(s, "baseSalary");
        }
        BigDecimal grossKey = num(s, "gross");
        if (basic == null && grossKey == null) {
            return null;
        }

        BigDecimal hra = orZero(num(s, "hra"));
        BigDecimal allowances = orZero(num(s, "allowances"));
        BigDecimal bonus = orZero(num(s, "bonus"));
        BigDecimal fixedDeductions = orZero(num(s, "deductions"));

        BigDecimal fullMonthly = grossKey != null ? grossKey : basic.add(hra).add(allowances);
        BigDecimal basicFull = basic != null ? basic : fullMonthly;
        if (fullMonthly.signum() <= 0) {
            return null;
        }

        BigDecimal pfPct = s.has("pfPercent") ? num(s, "pfPercent") : pfDefault;
        BigDecimal esiPct = s.has("esiPercent") ? num(s, "esiPercent") : esiDefault;
        BigDecimal tdsPct = s.has("tdsPercent") ? num(s, "tdsPercent") : tdsDefault;
        if (pfPct == null) {
            pfPct = BigDecimal.ZERO;
        }
        if (esiPct == null) {
            esiPct = BigDecimal.ZERO;
        }
        if (tdsPct == null) {
            tdsPct = BigDecimal.ZERO;
        }

        int dim = ym.lengthOfMonth();
        LocalDate mStart = ym.atDay(1);
        LocalDate mEnd = ym.atEndOfMonth();
        LocalDate from = emp.getJoiningDate().isAfter(mStart) ? emp.getJoiningDate() : mStart;

        // Pro-rate for a mid-month joiner (they were not employed, which is not "loss of pay").
        BigDecimal employedDays = BigDecimal.valueOf(ChronoUnit.DAYS.between(from, mEnd) + 1);
        BigDecimal ratio = employedDays.divide(BigDecimal.valueOf(dim), 6, RoundingMode.HALF_UP);

        // Loss-of-pay days: approved UNPAID leave plus ABSENT days (HALF_DAY = 0.5). A day is never counted twice.
        Set<LocalDate> unpaid = new HashSet<>();
        for (LeaveRequest l : leaveRequests.findByEmployee_IdAndStatusIn(emp.getId(), List.of("APPROVED"))) {
            if (l.getLeaveType().isPaid()) {
                continue;
            }
            LocalDate a = l.getFromDate().isBefore(from) ? from : l.getFromDate();
            LocalDate b = l.getToDate().isAfter(mEnd) ? mEnd : l.getToDate();
            for (LocalDate d = a; !d.isAfter(b); d = d.plusDays(1)) {
                if (!calendar.isClosed(d)) {
                    unpaid.add(d);
                }
            }
        }
        BigDecimal lopDays = BigDecimal.valueOf(unpaid.size());
        for (Attendance at : attendances.findByEmployee_IdAndAttendanceDateBetweenOrderByAttendanceDateDesc(emp.getId(), from, mEnd)) {
            if (unpaid.contains(at.getAttendanceDate())) {
                continue;
            }
            if ("ABSENT".equalsIgnoreCase(at.getStatus())) {
                lopDays = lopDays.add(BigDecimal.ONE); 
            }else if ("HALF_DAY".equalsIgnoreCase(at.getStatus())) {
                lopDays = lopDays.add(new BigDecimal("0.5"));
            }
        }

        BigDecimal gross = fullMonthly.multiply(ratio).add(bonus).setScale(2, RoundingMode.HALF_UP);
        BigDecimal dailyFull = fullMonthly.divide(BigDecimal.valueOf(dim), 6, RoundingMode.HALF_UP);
        BigDecimal lopAmount = dailyFull.multiply(lopDays).setScale(2, RoundingMode.HALF_UP);

        BigDecimal basicDaily = basicFull.divide(BigDecimal.valueOf(dim), 6, RoundingMode.HALF_UP);
        BigDecimal basicEarned = basicFull.multiply(ratio).subtract(basicDaily.multiply(lopDays)).max(BigDecimal.ZERO);
        BigDecimal payable = gross.subtract(lopAmount).max(BigDecimal.ZERO);

        BigDecimal deductions = lopAmount
                .add(pct(basicEarned, pfPct))
                .add(pct(payable, esiPct))
                .add(pct(payable, tdsPct))
                .add(fixedDeductions)
                .setScale(2, RoundingMode.HALF_UP)
                .min(gross); // never deduct more than was earned, so gross = net + deductions always balances

        Payslip slip = new Payslip();
        slip.setPayrollRun(run);
        slip.setEmployee(emp);
        slip.setGrossSalary(gross);
        slip.setDeductions(deductions);
        slip.setNetSalary(gross.subtract(deductions));
        slip.setStatus("PENDING");
        return slip;
    }

    private static BigDecimal orZero(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    @Transactional(readOnly = true)
    public List<PayrollRunResponse> listPayrollRuns() {
        return payrollRuns.findAll().stream()
                .sorted(Comparator.comparing(PayrollRun::getMonth).reversed())
                .map(this::toRunResponse).toList();
    }

    @Transactional(readOnly = true)
    public PayrollRunResponse getPayrollRun(UUID id) {
        return toRunResponse(payrollRuns.findById(id)
                .orElseThrow(() -> new NotFoundException("Payroll run not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<PayslipResponse> listPayslips(UUID payrollRunId, UUID employeeId) {
        List<Payslip> list;
        if (payrollRunId != null) {
            list = payslips.findByPayrollRun_Id(payrollRunId); 
        }else if (employeeId != null) {
            list = payslips.findByEmployee_IdOrderByCreatedAtDesc(employeeId); 
        }else {
            list = payslips.findAll();
        }
        return list.stream().map(this::toPayslipResponse).toList();
    }

    // =====================================================================
    // Mapping
    // =====================================================================
    private PayrollRunResponse toRunResponse(PayrollRun r) {
        return new PayrollRunResponse(r.getId(), r.getMonth(), r.getStatus(), r.getTotalGross(),
                r.getTotalDeductions(), r.getTotalNet(), r.getFinalisedAt(),
                r.getPayslips() != null ? r.getPayslips().size() : 0);
    }

    private LeaveRequestResponse toLeaveResponse(LeaveRequest lr, String warning) {
        return new LeaveRequestResponse(
                lr.getId(),
                lr.getEmployee().getId(),
                fullName(lr.getEmployee()),
                lr.getLeaveType().getId(),
                lr.getLeaveType().getName(),
                lr.getFromDate(),
                lr.getToDate(),
                lr.getDays(),
                lr.getStatus(),
                lr.getReason(),
                lr.getApprovedBy() != null ? lr.getApprovedBy().getId() : null,
                warning
        );
    }

    private ShiftScheduleResponse toShiftResponse(ShiftSchedule s) {
        return new ShiftScheduleResponse(
                s.getId(),
                s.getEmployee().getId(),
                fullName(s.getEmployee()),
                s.getShiftDate(),
                s.getStartTime(),
                s.getEndTime(),
                s.getRoleAssigned()
        );
    }

    private PayslipResponse toPayslipResponse(Payslip p) {
        return new PayslipResponse(
                p.getId(),
                p.getPayrollRun().getId(),
                p.getEmployee().getId(),
                fullName(p.getEmployee()),
                p.getEmployee().getJobTitle(),
                p.getGrossSalary(),
                p.getDeductions(),
                p.getNetSalary(),
                p.getStatus()
        );
    }
}
