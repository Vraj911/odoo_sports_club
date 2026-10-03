package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.BarTab;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BarTabRepository extends JpaRepository<BarTab, UUID> {
    List<BarTab> findByStatusOrderByOpenedAtAsc(String status);

    boolean existsByMember_IdAndStatus(UUID memberId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from BarTab t where t.id = :id")
    Optional<BarTab> findByIdForUpdate(@Param("id") UUID id);
}
