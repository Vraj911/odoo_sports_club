package com.bookmycourt.booking.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "bookmycourt.booking")
public class BookingProperties {

    /** Half-hour index: 12 = 06:00 IST */
    private int openSlot = 12;
    /** Half-hour index: 44 = 22:00 IST */
    private int closeSlot = 44;
    private int dailyCap = 2;
    private int holdMinutes = 5;
    private long reaperMs = 15_000;

    public int getOpenSlot() { return openSlot; }
    public void setOpenSlot(int openSlot) { this.openSlot = openSlot; }
    public int getCloseSlot() { return closeSlot; }
    public void setCloseSlot(int closeSlot) { this.closeSlot = closeSlot; }
    public int getDailyCap() { return dailyCap; }
    public void setDailyCap(int dailyCap) { this.dailyCap = dailyCap; }
    public int getHoldMinutes() { return holdMinutes; }
    public void setHoldMinutes(int holdMinutes) { this.holdMinutes = holdMinutes; }
    public long getReaperMs() { return reaperMs; }
    public void setReaperMs(long reaperMs) { this.reaperMs = reaperMs; }
}
