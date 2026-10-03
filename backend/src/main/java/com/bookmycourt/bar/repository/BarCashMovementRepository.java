package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarCashMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.UUID;

public interface BarCashMovementRepository extends JpaRepository<BarCashMovement, UUID> {

    @Query("select coalesce(sum(m.amount), 0) from BarCashMovement m where m.cashShift.id = :shiftId and m.type = :type")
    BigDecimal sumByShiftAndType(@Param("shiftId") UUID shiftId, @Param("type") String type);
}
