package com.bookmycourt.booking.job;

import com.bookmycourt.booking.service.BookingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class HoldReaperJob {

    private static final Logger log = LoggerFactory.getLogger(HoldReaperJob.class);
    private final BookingService bookingService;

    public HoldReaperJob(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @Scheduled(fixedDelayString = "${bookmycourt.booking.reaper-ms:15000}")
    public void reap() {
        int released = bookingService.reapExpiredHolds();
        if (released > 0) {
            log.info("Released {} expired unpaid booking hold(s)", released);
        }
    }
}
