package com.bookmycourt.membership.repository;

import com.bookmycourt.membership.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    List<Membership> findByMember_IdOrderByStartDateDesc(UUID memberId);
    List<Membership> findByStatusIn(List<String> statuses);

    long countByStatusIn(List<String> statuses);
    long countByStatusInAndEndDateBetween(List<String> statuses, LocalDate from, LocalDate to);

    @Query("""
            SELECT m FROM Membership m
            JOIN FETCH m.plan
            WHERE m.member.id = :memberId
              AND m.status IN ('ACTIVE', 'EXPIRING_SOON')
              AND m.startDate <= :onDate
              AND m.endDate >= :onDate
            ORDER BY m.endDate DESC
            """)
    List<Membership> findActiveOnDate(@Param("memberId") UUID memberId, @Param("onDate") LocalDate onDate);

    default Optional<Membership> findCurrent(UUID memberId, LocalDate onDate) {
        List<Membership> list = findActiveOnDate(memberId, onDate);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}
