package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.CashShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CashShiftRepository extends JpaRepository<CashShift, UUID> {
    Optional<CashShift> findByStaffUser_IdAndStatus(UUID staffUserId, String status);
    List<CashShift> findByStaffUser_IdOrderByOpenedAtDesc(UUID staffUserId);
    List<CashShift> findByStatusOrderByOpenedAtDesc(String status);
}
