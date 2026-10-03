package com.bookmycourt.admin.dto;

import java.util.List;

public record AuditLogPage(
        List<AuditLogResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
