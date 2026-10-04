package com.bookmycourt.membership.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public record MemberResponse(
        UUID id,
        UUID userId,
        String memberCode,
        UUID qrToken,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        String planName,
        int maxBookingsPerDay,
        int advanceBookingDays
) {
    @JsonProperty("fullName")
    public String fullName() {
        return ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
    }

    @JsonProperty("memberNumber")
    public String memberNumber() {
        return memberCode != null ? memberCode : "";
    }

    @JsonProperty("tier")
    public String tier() {
        if (planName != null && planName.toLowerCase().contains("silver")) return "Silver";
        if (planName != null && planName.toLowerCase().contains("junior")) return "Junior";
        return "Gold";
    }

    @JsonProperty("status")
    public String status() {
        return "ACTIVE";
    }
}

