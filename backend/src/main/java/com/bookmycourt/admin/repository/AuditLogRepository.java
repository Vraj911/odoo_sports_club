package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {

    /** Fetches the actor in the same query (avoids N+1 when mapping actorName). */
    @Override
    @EntityGraph(attributePaths = "actor")
    Page<AuditLog> findAll(Specification<AuditLog> spec, Pageable pageable);
}