package com.bookmycourt.bar.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record AddOrderItemsRequest(
        @NotEmpty List<@Valid BarOrderLineRequest> items
) {
}
