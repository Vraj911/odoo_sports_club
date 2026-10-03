package com.bookmycourt.facility.repository;

import com.bookmycourt.facility.entity.Court;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourtRepository extends JpaRepository<Court, UUID> {
    List<Court> findByActiveTrueOrderByNameAsc();
    List<Court> findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(String sport);
}
