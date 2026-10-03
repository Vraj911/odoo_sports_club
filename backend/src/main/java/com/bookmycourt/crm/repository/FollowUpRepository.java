package com.bookmycourt.crm.repository;

import com.bookmycourt.crm.entity.FollowUp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FollowUpRepository extends JpaRepository<FollowUp, UUID> {
    List<FollowUp> findByLead_IdOrderByDueAtAsc(UUID leadId);
    List<FollowUp> findByStatusOrderByDueAtAsc(String status);
}
