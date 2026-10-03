package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    List<AuditLog> findByEntityTypeOrderByOccurredAtDesc(String entityType);
    List<AuditLog> findByOrderByOccurredAtDesc();
}
