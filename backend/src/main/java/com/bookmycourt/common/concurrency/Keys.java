package com.bookmycourt.common.concurrency;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

public final class Keys {

    private Keys() {
    }

    public record CourtDay(UUID courtId, LocalDate day) {
    }

    public record MemberDay(UUID memberId, LocalDate day) {
    }

    public record SessionKey(UUID sessionId) {
    }

    public record VariantKey(UUID variantId) {
    }

    public record TabKey(UUID tabId) {
    }

    public record PayableKey(String type, UUID id) {
    }

    public record NumberSeriesKey(String series) {
    }

    public record EmployeeKey(UUID employeeId) {
    }

    public record PayrollMonthKey(YearMonth month) {
    }

    public record BarDayKey(LocalDate date) {
    }

    public record LedgerRefKey(String refType, UUID refId, String kind) {
    }

    public record DueKey(UUID dueId) {
    }

    public record RefundKey(UUID paymentId) {
    }

    public record LeadKey(UUID leadId) {
    }
}
