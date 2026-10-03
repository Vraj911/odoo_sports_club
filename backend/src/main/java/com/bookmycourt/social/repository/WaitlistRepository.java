package com.bookmycourt.social.repository;

import com.bookmycourt.social.entity.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface WaitlistRepository extends JpaRepository<Waitlist, UUID> {
    List<Waitlist> findBySession_IdAndStatusOrderByPositionAsc(UUID sessionId, String status);
    List<Waitlist> findByCourt_IdAndStatusOrderByPositionAsc(UUID courtId, String status);
    long countBySession_IdAndStatus(UUID sessionId, String status);
    List<Waitlist> findByCourt_IdAndStatusOrderByCreatedAtAsc(UUID courtId, String status);
    List<Waitlist> findByCourt_IdAndCourtSlotStartAndStatusOrderByCreatedAtAsc(UUID courtId, OffsetDateTime courtSlotStart, String status);
    List<Waitlist> findByMember_IdAndStatus(UUID memberId, String status);
}
