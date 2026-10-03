package com.bookmycourt.membership.dto;

import java.time.LocalDate;

public record UpdateMemberRequest(
        String firstName,
        String lastName,
        String email,
        String phone,
        String address,
        LocalDate dateOfBirth,
        String guardianName,
        String guardianPhone,
        String guardianEmail
) {
}
