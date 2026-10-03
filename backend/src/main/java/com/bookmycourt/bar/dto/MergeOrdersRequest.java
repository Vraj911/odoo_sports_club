package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MergeOrdersRequest(@NotNull UUID targetOrderId) {
}
