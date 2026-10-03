package com.bookmycourt.social.repository;

import com.bookmycourt.social.entity.SocialParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SocialParticipantRepository extends JpaRepository<SocialParticipant, UUID> {
    List<SocialParticipant> findBySession_Id(UUID sessionId);
    Optional<SocialParticipant> findBySession_IdAndMember_Id(UUID sessionId, UUID memberId);
    long countBySession_IdAndStatus(UUID sessionId, String status);
}
