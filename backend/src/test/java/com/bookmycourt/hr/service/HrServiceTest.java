package com.bookmycourt.hr.service;

import com.bookmycourt.hr.dto.PayrollRunResponse;
import com.bookmycourt.hr.entity.Attendance;
import com.bookmycourt.hr.entity.Employee;
import com.bookmycourt.hr.entity.PayrollRun;
import com.bookmycourt.hr.mapper.HrMapper;
import com.bookmycourt.hr.repository.AttendanceRepository;
import com.bookmycourt.hr.repository.EmployeeRepository;
import com.bookmycourt.hr.repository.LeaveRequestRepository;
import com.bookmycourt.hr.repository.LeaveTypeRepository;
import com.bookmycourt.hr.repository.PayrollRunRepository;
import com.bookmycourt.hr.repository.PayslipRepository;
import com.bookmycourt.hr.repository.ShiftScheduleRepository;
import com.bookmycourt.membership.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class HrServiceTest {

    private EmployeeRepository employees;
    private AttendanceRepository attendances;
    private PayrollRunRepository payrollRuns;
    private HrService service;

    @BeforeEach
    void setUp() {
        employees = Mockito.mock(EmployeeRepository.class);
        attendances = Mockito.mock(AttendanceRepository.class);
        AppUserRepository users = Mockito.mock(AppUserRepository.class);
        LeaveTypeRepository leaveTypes = Mockito.mock(LeaveTypeRepository.class);
        LeaveRequestRepository leaveRequests = Mockito.mock(LeaveRequestRepository.class);
        ShiftScheduleRepository shifts = Mockito.mock(ShiftScheduleRepository.class);
        payrollRuns = Mockito.mock(PayrollRunRepository.class);
        PayslipRepository payslips = Mockito.mock(PayslipRepository.class);
        HrMapper mapper = new HrMapper();

        service = new HrService(
                employees, attendances, users, mapper,
                leaveTypes, leaveRequests, shifts, payrollRuns, payslips
        );
    }

    @Test
    void getTodayAttendanceSummary_calculatesCorrectBreakdown() {
        Employee e1 = new Employee();
        Employee e2 = new Employee();
        Employee e3 = new Employee();
        when(employees.findByEmploymentStatus("ACTIVE")).thenReturn(List.of(e1, e2, e3));

        Attendance a1 = new Attendance();
        a1.setStatus("PRESENT");
        Attendance a2 = new Attendance();
        a2.setStatus("ON_LEAVE");

        when(attendances.findByAttendanceDate(LocalDate.now())).thenReturn(List.of(a1, a2));

        Map<String, Object> summary = service.getTodayAttendanceSummary();
        assertNotNull(summary);
        assertEquals(3L, summary.get("totalEmployees"));
        assertEquals(1L, summary.get("present"));
        assertEquals(1L, summary.get("onLeave"));
        assertEquals(1L, summary.get("absent")); // 3 - (1 + 1) = 1
    }

    @Test
    void generatePayrollRun_createsPayslipsAndTotals() {
        String month = "2026-10";
        when(payrollRuns.findByMonth(month)).thenReturn(Optional.empty());

        Employee e1 = new Employee();
        Employee e2 = new Employee();
        when(employees.findByEmploymentStatus("ACTIVE")).thenReturn(List.of(e1, e2));

        PayrollRunResponse resp = service.generatePayrollRun(month);
        assertNotNull(resp);
        assertEquals(month, resp.month());
        assertEquals("FINALISED", resp.status());
        assertEquals(2, resp.employeeCount());
        // 2 employees * 25000 = 50000 gross; 2 * 1000 = 2000 deductions; 48000 net
        assertEquals(new BigDecimal("50000"), resp.totalGross());
        assertEquals(new BigDecimal("2000"), resp.totalDeductions());
        assertEquals(new BigDecimal("48000"), resp.totalNet());

        verify(payrollRuns).save(any(PayrollRun.class));
    }
}
