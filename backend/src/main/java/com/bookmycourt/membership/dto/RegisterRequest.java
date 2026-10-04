package com.bookmycourt.membership.dto;

import java.time.LocalDate;

public record RegisterRequest(
        String firstName,
        String lastName,
        String fullName,
        String email,
        String phone,
        String password,
        LocalDate dateOfBirth,
        String guardianName,
        String guardianPhone,
        String guardianEmail
) {
}
