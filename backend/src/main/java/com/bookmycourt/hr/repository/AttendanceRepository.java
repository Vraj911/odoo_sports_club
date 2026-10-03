package com.bookmycourt.hr.repository;

import com.bookmycourt.hr.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttendanceRepository extends JpaRepository<Attendance, UUID> {
    Optional<Attendance> findByEmployee_IdAndAttendanceDate(UUID employeeId, LocalDate date);
    List<Attendance> findByEmployee_IdOrderByAttendanceDateDesc(UUID employeeId);
    List<Attendance> findByAttendanceDate(LocalDate date);
}
