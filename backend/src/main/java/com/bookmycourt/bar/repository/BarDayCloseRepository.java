package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarDayClose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface BarDayCloseRepository extends JpaRepository<BarDayClose, UUID> {
    Optional<BarDayClose> findByBusinessDate(LocalDate businessDate);
}
