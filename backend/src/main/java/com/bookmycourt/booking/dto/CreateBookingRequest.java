package com.bookmycourt.booking.dto;

import java.time.LocalDate;
import java.util.UUID;

public class CreateBookingRequest {
    private Object courtId;
    private Object memberId;
    private String guestName;
    private String guestPhone;
    private LocalDate date;
    private String startTime;
    private String channel;
    private String paymentPolicy;
    private Boolean overrideCap;
    private String overrideReason;
    private String source;

    public CreateBookingRequest() {}

    public CreateBookingRequest(
            Object courtId,
            Object memberId,
            String guestName,
            String guestPhone,
            LocalDate date,
            String startTime,
            String channel,
            String paymentPolicy,
            Boolean overrideCap,
            String overrideReason,
            String source
    ) {
        this.courtId = courtId;
        this.memberId = memberId;
        this.guestName = guestName;
        this.guestPhone = guestPhone;
        this.date = date;
        this.startTime = startTime;
        this.channel = channel;
        this.paymentPolicy = paymentPolicy;
        this.overrideCap = overrideCap;
        this.overrideReason = overrideReason;
        this.source = source;
    }

    public CreateBookingRequest(
            UUID courtId,
            UUID memberId,
            String guestName,
            String guestPhone,
            LocalDate date,
            String startTime,
            String channel
    ) {
        this(courtId, memberId, guestName, guestPhone, date, startTime, channel, "PAY_NOW", false, null, "DIRECT");
    }

    public UUID courtId() {
        if (courtId == null) return null;
        if (courtId instanceof UUID u) return u;
        String s = courtId.toString().trim().toLowerCase();
        return switch (s) {
            case "tc-1", "tennis-1" -> UUID.fromString("6869edd3-d75d-4d32-9d70-2e641af5bf60");
            case "tc-2", "tennis-2" -> UUID.fromString("0c0b020a-8926-469d-89ec-61ae84bf8a22");
            case "tc-3" -> UUID.fromString("6869edd3-d75d-4d32-9d70-2e641af5bf60");
            case "pd-1", "padel-1" -> UUID.fromString("ca6feb00-b627-420a-833e-c20f70b2e499");
            case "pd-2" -> UUID.fromString("ca6feb00-b627-420a-833e-c20f70b2e499");
            case "bd-1", "badminton-1" -> UUID.fromString("8d6085df-2915-4fb3-93bc-ed2c5c587f81");
            case "bd-2" -> UUID.fromString("8d6085df-2915-4fb3-93bc-ed2c5c587f81");
            case "cn-1", "cricket-1", "cricket-net-1" -> UUID.fromString("5a16e67f-4787-4c69-b81b-358217218e5a");
            default -> {
                try {
                    yield UUID.fromString(s);
                } catch (Exception e) {
                    yield UUID.fromString("6869edd3-d75d-4d32-9d70-2e641af5bf60");
                }
            }
        };
    }

    public UUID memberId() {
        if (memberId == null) return null;
        if (memberId instanceof UUID u) return u;
        String s = memberId.toString().trim();
        if (s.isBlank() || "self".equalsIgnoreCase(s) || "null".equalsIgnoreCase(s)) return null;
        try {
            return UUID.fromString(s);
        } catch (Exception e) {
            return null;
        }
    }

    public Object getCourtId() { return courtId; }
    public void setCourtId(Object courtId) { this.courtId = courtId; }
    public Object getMemberId() { return memberId; }
    public void setMemberId(Object memberId) { this.memberId = memberId; }
    public String guestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }
    public String guestPhone() { return guestPhone; }
    public void setGuestPhone(String guestPhone) { this.guestPhone = guestPhone; }
    public LocalDate date() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String startTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String channel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String paymentPolicy() { return paymentPolicy; }
    public void setPaymentPolicy(String paymentPolicy) { this.paymentPolicy = paymentPolicy; }
    public Boolean overrideCap() { return overrideCap; }
    public void setOverrideCap(Boolean overrideCap) { this.overrideCap = overrideCap; }
    public String overrideReason() { return overrideReason; }
    public void setOverrideReason(String overrideReason) { this.overrideReason = overrideReason; }
    public String source() { return source; }
    public void setSource(String source) { this.source = source; }

    public boolean isOverrideCap() {
        return Boolean.TRUE.equals(overrideCap);
    }
}

