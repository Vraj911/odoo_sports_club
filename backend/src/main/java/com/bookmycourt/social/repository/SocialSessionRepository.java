package com.bookmycourt.social.repository;

import com.bookmycourt.social.entity.SocialSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SocialSessionRepository extends JpaRepository<SocialSession, UUID> {
    List<SocialSession> findByCourt_IdOrderByStartAtAsc(UUID courtId);
    List<SocialSession> findByStartAtAfterOrderByStartAtAsc(Instant after);
    List<SocialSession> findByOrderByStartAtDesc();
}
