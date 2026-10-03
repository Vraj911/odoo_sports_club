package com.bookmycourt.hr.mapper;

import com.bookmycourt.hr.dto.AttendanceResponse;
import com.bookmycourt.hr.dto.EmployeeResponse;
import com.bookmycourt.hr.entity.Attendance;
import com.bookmycourt.hr.entity.Employee;
import org.springframework.stereotype.Component;

@Component
public class HrMapper {

    public EmployeeResponse toResponse(Employee e) {
        String fullName = e.getUser().getFirstName() + " " + e.getUser().getLastName();
        return new EmployeeResponse(
                e.getId(),
                e.getUser().getId(),
                e.getEmployeeNumber(),
                fullName,
                e.getUser().getEmail(),
                e.getUser().getPhone(),
                e.getDepartment(),
                e.getJobTitle(),
                e.getJoiningDate(),
                e.getEmploymentStatus(),
                e.getSalaryStructure(),
                e.getCreatedAt()
        );
    }

    public AttendanceResponse toResponse(Attendance a) {
        String employeeName = a.getEmployee().getUser().getFirstName() + " " + a.getEmployee().getUser().getLastName();
        String approvedBy = null;
        if (a.getApprovedBy() != null) {
            approvedBy = a.getApprovedBy().getFirstName() + " " + a.getApprovedBy().getLastName();
        }
        return new AttendanceResponse(
                a.getId(),
                a.getEmployee().getId(),
                employeeName,
                a.getEmployee().getEmployeeNumber(),
                a.getAttendanceDate(),
                a.getCheckInAt(),
                a.getCheckOutAt(),
                a.getStatus(),
                a.getSource(),
                a.getNotes(),
                approvedBy,
                a.getCreatedAt()
        );
    }
}
