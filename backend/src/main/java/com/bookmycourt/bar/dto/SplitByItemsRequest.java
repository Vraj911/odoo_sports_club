package com.bookmycourt.bar.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

/** Each inner list = the line ids one guest pays for. Every non-void line must appear exactly once. */
public record SplitByItemsRequest(@NotEmpty List<List<UUID>> groups) {
}
