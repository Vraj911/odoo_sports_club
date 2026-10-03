package com.bookmycourt.membership.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateMembershipRequest(
        @NotNull UUID memberId,
        @NotNull UUID planId,
        BigDecimal pricePaid
) {
}
