package com.bookmycourt.admin.dto;

public record UpdateClubProfileRequest(
        String clubName,
        String legalName,
        String phone,
        String email,
        String address,
        String website,
        String currency,
        String timezone
) {
}
