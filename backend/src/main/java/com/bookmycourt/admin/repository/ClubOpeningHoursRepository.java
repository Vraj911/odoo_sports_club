package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.ClubOpeningHours;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClubOpeningHoursRepository extends JpaRepository<ClubOpeningHours, Short> {

    Optional<ClubOpeningHours> findByWeekday(short weekday);
}
