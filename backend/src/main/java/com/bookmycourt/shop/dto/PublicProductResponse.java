package com.bookmycourt.shop.dto;

import java.util.List;
import java.util.UUID;

public record PublicProductResponse(
        UUID id,
        String category,
        String name,
        String description,
        String brand,
        List<PublicVariantResponse> variants
) {
}
