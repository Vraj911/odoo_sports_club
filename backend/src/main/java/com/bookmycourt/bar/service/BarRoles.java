package com.bookmycourt.bar.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;

public final class BarRoles {

    private static final Set<String> MANAGERS = Set.of("ROLE_MANAGER", "ROLE_ADMIN", "ROLE_OWNER");

    private BarRoles() {
    }

    public static boolean isManager() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        return a != null && a.getAuthorities().stream().anyMatch(g -> MANAGERS.contains(g.getAuthority()));
    }
}
