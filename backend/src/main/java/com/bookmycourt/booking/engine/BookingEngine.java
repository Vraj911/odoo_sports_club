package com.bookmycourt.booking.engine;

/**
 * Minimal BookingEngine contract used by other modules. The real implementation
 * lives elsewhere; this interface provides the static IST ZoneId and the
 * config() accessor used across the application.
 */
public interface BookingEngine {
    java.time.ZoneId IST = java.time.ZoneId.of("Asia/Kolkata");

    Model.ClubConfig config();

    /**
     * Return an occupancy mask for the given court/day where each bit represents a 30-min slot.
     */
    long occupancy(java.util.UUID courtId, java.time.LocalDate day);

    /**
     * Return a list of startable slot indices for the court/day (0..47).
     */
    java.util.List<Integer> startableSlots(java.util.UUID courtId, java.time.LocalDate day);
}
