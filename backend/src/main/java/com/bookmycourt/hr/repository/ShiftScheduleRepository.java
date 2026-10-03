package com.bookmycourt.hr.repository;

import com.bookmycourt.hr.entity.ShiftSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ShiftScheduleRepository extends JpaRepository<ShiftSchedule, UUID> {
    List<ShiftSchedule> findByShiftDateOrderByStartTimeAsc(LocalDate shiftDate);
    List<ShiftSchedule> findByEmployee_IdAndShiftDateOrderByStartTimeAsc(UUID employeeId, LocalDate shiftDate);
    List<ShiftSchedule> findByEmployee_IdOrderByShiftDateDesc(UUID employeeId);
    List<ShiftSchedule> findByEmployee_IdAndShiftDateBetweenOrderByShiftDateAscStartTimeAsc(UUID employeeId, LocalDate from, LocalDate to);
    List<ShiftSchedule> findByShiftDateBetweenOrderByShiftDateAscStartTimeAsc(LocalDate from, LocalDate to);
}
