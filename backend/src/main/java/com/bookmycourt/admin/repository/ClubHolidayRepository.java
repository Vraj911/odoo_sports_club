package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.ClubHoliday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface ClubHolidayRepository extends JpaRepository<ClubHoliday, UUID> {
    Optional<ClubHoliday> findByHolidayDate(LocalDate holidayDate);

    boolean existsByHolidayDateAndActiveTrue(LocalDate holidayDate);
}
