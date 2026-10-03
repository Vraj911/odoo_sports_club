package com.bookmycourt.admin.service;

import com.bookmycourt.admin.dto.AuditLogPage;
import com.bookmycourt.admin.entity.AuditLog;
import com.bookmycourt.admin.mapper.AdminMapper;
import com.bookmycourt.admin.repository.AuditLogRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Single entry point for writing audit entries (AUTH-06). Other modules (booking overrides, refunds,
 * stock adjustment, payroll, role change...) should inject THIS instead of calling an HTTP endpoint.
 * The actor and user-agent always come from the current request - never from client input.
 */
@Service("adminAuditService")
public class AuditService {

    private static final TypeReference<Map<String, Object>> MAP = new TypeReference<>() {
    };

    private final AuditLogRepository repo;
    private final AppUserRepository users;
    private final AdminMapper mapper;
    private final ObjectMapper json;

    public AuditService(AuditLogRepository repo, AppUserRepository users, AdminMapper mapper, ObjectMapper json) {
        this.repo = repo;
        this.users = users;
        this.mapper = mapper;
        this.json = json;
    }

    /** Joins the caller's transaction, so the audit row rolls back together with the change it describes. */
    @Transactional
    public void record(String action, String entityType, UUID entityId, Object before, Object after, String reason) {
        AuditLog a = new AuditLog();
        UUID actorId = currentActorId();
        if (actorId != null) {
            AppUser u = users.findById(actorId).orElse(null);
            a.setActor(u);
        }
        a.setAction(action);
        a.setEntityType(entityType);
        a.setEntityId(entityId);
        a.setUserAgent(currentUserAgent());
        a.setReason(reason == null || reason.isBlank() ? null : reason.trim());
        a.setBeforeValue(snapshot(before));
        a.setAfterValue(snapshot(after));
        repo.save(a);
    }

    public void record(String action, String entityType, UUID entityId, Object before, Object after) {
        record(action, entityType, entityId, before, after, null);
    }

    @Transactional(readOnly = true)
    public AuditLogPage search(String entityType, String action, UUID actorUserId,
                               Instant from, Instant to, int page, int size) {
        Specification<AuditLog> spec = (root, q, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (entityType != null && !entityType.isBlank()) p.add(cb.equal(root.get("entityType"), entityType));
            if (action != null && !action.isBlank()) p.add(cb.equal(root.get("action"), action));
            if (actorUserId != null) p.add(cb.equal(root.get("actor").get("id"), actorUserId));
            if (from != null) p.add(cb.greaterThanOrEqualTo(root.get("occurredAt"), from));
            if (to != null) p.add(cb.lessThan(root.get("occurredAt"), to));
            return cb.and(p.toArray(Predicate[]::new));
        };
        int safeSize = Math.min(Math.max(size, 1), 200);
        Page<AuditLog> result = repo.findAll(spec,
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "occurredAt")));
        return new AuditLogPage(
                result.getContent().stream().map(mapper::toResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    /**
     * ASSUMPTION: the JWT subject / principal name is the app_user UUID.
     * If your JwtFilter stores the email instead, resolve it here with your AppUserRepository.
     */
    public UUID currentActorId() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || !a.isAuthenticated() || a instanceof AnonymousAuthenticationToken) return null;
        try {
            return UUID.fromString(a.getName());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private String currentUserAgent() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes sra) {
            return sra.getRequest().getHeader("User-Agent");
        }
        return null;
    }

    private Map<String, Object> snapshot(Object o) {
        if (o == null) return null;
        Object src = (o instanceof Collection<?>) ? Map.of("items", o) : o;
        return json.convertValue(src, MAP);
    }
}