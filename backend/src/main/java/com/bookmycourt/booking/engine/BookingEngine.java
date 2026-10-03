package com.bookmycourt.booking.engine;

/**
 * Minimal BookingEngine contract used by other modules. The real implementation
 * lives elsewhere; this interface provides the static IST ZoneId and the
 * config() accessor used across the application.
 */
public interface BookingEngine {
    java.time.ZoneId IST = java.time.ZoneId.of("Asia/Kolkata");

    Model.ClubConfig config();
}
