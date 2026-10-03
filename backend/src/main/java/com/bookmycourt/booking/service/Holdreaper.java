package com.bookmycourt.booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Releases unpaid PENDING holds (BKG-12). Replaces the scheduler that lived in
 * BookingEngineConfig. Safe if another job also calls reapExpiredHolds(): it
 * re-checks status under the court-day lock.
 */
@Component
@EnableScheduling
public class HoldReaper {

    private static final Logger log = LoggerFactory.getLogger(HoldReaper.class);

    private final BookingService bookingService;

    public HoldReaper(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedDelayString = "${bookmycourt.booking.reaper-ms:15000}", initialDelay = 20000)
    public void sweep() {
        try {
            int n = bookingService.reapExpiredHolds();
            if (n > 0) {
                log.info("Released {} expired booking holds", n);
            }
        } catch (Exception e) {
            log.error("Hold reaper failed", e);
        }
    }
}
