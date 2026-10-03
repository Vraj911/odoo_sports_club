package com.bookmycourt.social.repository;

import com.bookmycourt.social.entity.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WaitlistRepository extends JpaRepository<Waitlist, UUID> {
    List<Waitlist> findBySession_IdAndStatusOrderByPositionAsc(UUID sessionId, String status);
    List<Waitlist> findByCourt_IdAndStatusOrderByPositionAsc(UUID courtId, String status);
    long countBySession_IdAndStatus(UUID sessionId, String status);
}
