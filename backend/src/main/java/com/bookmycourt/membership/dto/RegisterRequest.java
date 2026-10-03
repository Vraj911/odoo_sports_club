package com.bookmycourt.membership.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        String email,
        String phone,
        @NotBlank String password,
        LocalDate dateOfBirth,
        String guardianName,
        String guardianPhone,
        String guardianEmail
) {
}
