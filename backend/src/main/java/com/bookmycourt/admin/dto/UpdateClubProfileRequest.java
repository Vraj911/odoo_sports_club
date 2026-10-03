package com.bookmycourt.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Partial update: null = leave unchanged, "" = clear (optional fields only). */
public record UpdateClubProfileRequest(
        @Size(max = 150) String clubName,
        @Size(max = 200) String legalName,
        @Size(max = 20) String phone,
        @Email String email,
        @Size(max = 500) String address,
        @Size(max = 200) String website,
        @Size(max = 500) String logoUrl,
        @Pattern(regexp = "^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$", message = "Invalid GSTIN") String gstin,
        @Size(min = 3, max = 3) String currency,
        String timezone,
        @Pattern(regexp = "^[A-Z0-9\\-]{1,10}$", message = "1-10 chars: A-Z, 0-9, -") String invoicePrefix,
        @Pattern(regexp = "^[A-Z0-9\\-]{1,10}$", message = "1-10 chars: A-Z, 0-9, -") String receiptPrefix,
        @Pattern(regexp = "^[A-Z0-9\\-]{1,10}$", message = "1-10 chars: A-Z, 0-9, -") String billPrefix
) {
}