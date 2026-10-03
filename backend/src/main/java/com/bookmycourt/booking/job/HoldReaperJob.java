package com.bookmycourt.booking.job;

import com.bookmycourt.booking.service.BookingService;
import com.bookmycourt.common.job.JobRunner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class HoldReaperJob {

    private static final Logger log = LoggerFactory.getLogger(HoldReaperJob.class);

    private final BookingService bookingService;
    private final JobRunner jobRunner;

    public HoldReaperJob(BookingService bookingService, JobRunner jobRunner) {
        this.bookingService = bookingService;
        this.jobRunner = jobRunner;
    }

    @Scheduled(fixedDelayString = "${booking.hold-reaper-ms:30000}")
    public void reap() {
        jobRunner.run("HoldReaperJob", () -> {
            int released = bookingService.reapExpiredHolds();
            if (released > 0) {
                log.info("Released {} expired unpaid booking hold(s)", released);
            }
        });
    }
}
