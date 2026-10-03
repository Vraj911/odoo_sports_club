package com.bookmycourt.crm.repository;

import com.bookmycourt.crm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {
    Optional<Lead> findByLeadNumber(String leadNumber);
    List<Lead> findByStatus(String status);
    List<Lead> findByOrderByCreatedAtDesc();
}
