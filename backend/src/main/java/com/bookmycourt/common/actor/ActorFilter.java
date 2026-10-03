package com.bookmycourt.common.actor;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ActorFilter extends OncePerRequestFilter {

    public static final String ACTOR_ID_HEADER = "X-Actor-Id";
    public static final String ACTOR_ROLE_HEADER = "X-Actor-Role";
    public static final String ACTOR_NAME_HEADER = "X-Actor-Name";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String actorIdStr = request.getHeader(ACTOR_ID_HEADER);
        String actorRoleStr = request.getHeader(ACTOR_ROLE_HEADER);
        String actorName = request.getHeader(ACTOR_NAME_HEADER);

        Actor actor = Actor.SYSTEM;

        if (actorIdStr != null && !actorIdStr.isBlank()) {
            try {
                UUID actorId = UUID.fromString(actorIdStr.trim());
                ActorRole role = ActorRole.MEMBER;
                if (actorRoleStr != null && !actorRoleStr.isBlank()) {
                    try {
                        role = ActorRole.valueOf(actorRoleStr.trim().toUpperCase());
                    } catch (IllegalArgumentException ignored) {
                    }
                }
                String name = (actorName != null && !actorName.isBlank()) ? actorName.trim() : "User-" + actorIdStr.substring(0, Math.min(8, actorIdStr.length()));
                actor = new Actor(actorId, name, role);
            } catch (IllegalArgumentException ignored) {
                // Invalid UUID, fall back to SYSTEM
            }
        }

        ActorHolder.set(actor);
        try {
            filterChain.doFilter(request, response);
        } finally {
            ActorHolder.clear();
        }
    }
}
