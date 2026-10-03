package com.bookmycourt.admin.dto;

/** Full (admin-only) club profile. The public subset is ClubPublicResponse. */
public record ClubProfileResponse(
        String clubName,
        String legalName,
        String phone,
        String email,
        String address,
        String website,
        String logoUrl,
        String gstin,
        String currency,
        String timezone,
        String invoicePrefix,
        String receiptPrefix,
        String billPrefix
) {
}
