package com.bookmycourt.crm.repository;

import com.bookmycourt.crm.entity.Quote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, UUID> {
    List<Quote> findByLead_IdOrderByCreatedAtDesc(UUID leadId);
    List<Quote> findByStatusOrderByCreatedAtDesc(String status);
}
