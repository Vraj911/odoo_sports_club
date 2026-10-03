package com.bookmycourt.social.repository;

import com.bookmycourt.social.entity.SocialParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SocialParticipantRepository extends JpaRepository<SocialParticipant, UUID> {
    List<SocialParticipant> findBySession_Id(UUID sessionId);
    Optional<SocialParticipant> findBySession_IdAndMember_Id(UUID sessionId, UUID memberId);
    long countBySession_IdAndStatus(UUID sessionId, String status);

    @Query("""
            SELECT COUNT(p) FROM SocialParticipant p
            JOIN p.session s
            WHERE p.member.id = :memberId
              AND s.startAt >= :from
              AND s.startAt < :to
              AND p.status IN ('REGISTERED', 'JOINED')
            """)
    int countJoinedForMemberDay(
            @Param("memberId") UUID memberId,
            @Param("from") Instant from,
            @Param("to") Instant to);
}
