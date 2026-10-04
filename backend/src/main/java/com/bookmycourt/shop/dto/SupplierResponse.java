package com.bookmycourt.shop.dto;

import java.util.UUID;

public record SupplierResponse(UUID id, String name, String gstin, String phone, String email, String address, boolean active) {
}
