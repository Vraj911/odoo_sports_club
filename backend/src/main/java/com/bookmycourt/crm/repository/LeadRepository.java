package com.bookmycourt.crm.repository;

import com.bookmycourt.crm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {
    Optional<Lead> findByLeadNumber(String leadNumber);
    Optional<Lead> findByEmailIgnoreCase(String email);
    Optional<Lead> findByPhone(String phone);
    List<Lead> findByStatus(String status);
    List<Lead> findByOrderByCreatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT MAX(l.leadNumber) FROM Lead l")
    String findMaxLeadNumber();
}
