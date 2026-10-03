package com.bookmycourt.crm.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ConvertLeadRequest(
        @NotNull UUID memberId
) {
}
