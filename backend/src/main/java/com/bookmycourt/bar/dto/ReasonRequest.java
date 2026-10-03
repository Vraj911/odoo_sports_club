package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Used by void / comp / move-to-account / day reopen (BAR-14, BAR-07, BR-14). */
public record ReasonRequest(@NotBlank @Size(max = 255) String reason) {
}
