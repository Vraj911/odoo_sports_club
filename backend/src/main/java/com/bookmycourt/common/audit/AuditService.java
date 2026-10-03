package com.bookmycourt.common.audit;

import com.bookmycourt.admin.entity.AuditLog;
import com.bookmycourt.admin.repository.AuditLogRepository;
import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.membership.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.util.Map;
import java.util.UUID;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final AppUserRepository appUserRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public AuditService(AuditLogRepository auditLogRepository,
                        AppUserRepository appUserRepository,
                        @Autowired(required = false) ObjectMapper objectMapper,
                        Clock clock) {
        this.auditLogRepository = auditLogRepository;
        this.appUserRepository = appUserRepository;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String entityType, UUID entityId, Map<String, Object> details) {
        Actor actor = ActorHolder.current();
        AuditLog auditLog = new AuditLog();
        auditLog.setAction(action);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setOccurredAt(clock.instant());

        if (actor.userId() != null) {
            appUserRepository.findById(actor.userId()).ifPresent(auditLog::setActor);
        }

        String jsonDetails = "{}";
        if (details != null && !details.isEmpty()) {
            try {
                jsonDetails = objectMapper.writeValueAsString(details);
            } catch (Exception e) {
                log.error("Failed to serialize audit log details for {}: {}", action, details, e);
                jsonDetails = "{\"error\":\"Serialization failed\"}";
            }
        }
        auditLog.setDetails(jsonDetails);

        try {
            auditLogRepository.save(auditLog);
            log.info("Audit logged: action={}, entityType={}, entityId={}, actor={}",
                    action, entityType, entityId, actor.name());
        } catch (Exception e) {
            log.error("Failed to write audit log: action={}, entityType={}, entityId={}", action, entityType, entityId, e);
        }
    }
}
