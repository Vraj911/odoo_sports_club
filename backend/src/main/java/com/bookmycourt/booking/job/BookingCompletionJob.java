package com.bookmycourt.booking.job;

import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.booking.service.BookingService;
import com.bookmycourt.common.job.JobRunner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

@Component
public class BookingCompletionJob {

    private static final Logger log = LoggerFactory.getLogger(BookingCompletionJob.class);

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;
    private final JobRunner jobRunner;
    private final Clock clock;

    public BookingCompletionJob(
            BookingRepository bookingRepository,
            BookingService bookingService,
            JobRunner jobRunner,
            Clock clock
    ) {
        this.bookingRepository = bookingRepository;
        this.bookingService = bookingService;
        this.jobRunner = jobRunner;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${booking.completion-job-ms:600000}")
    public void run() {
        jobRunner.run("BookingCompletionJob", () -> {
            OffsetDateTime now = OffsetDateTime.now(clock);

            // 1. Complete CHECKED_IN bookings whose end_time has passed
            List<Booking> checkedInPastEnd = bookingRepository.findByStatusAndEndTimeBefore("CHECKED_IN", now);
            for (Booking b : checkedInPastEnd) {
                try {
                    bookingService.complete(b.getId());
                } catch (Exception ex) {
                    log.warn("Failed to complete booking {}: {}", b.getId(), ex.getMessage());
                }
            }

            // 2. Mark unchecked CONFIRMED bookings whose end_time has passed as NO_SHOW
            List<Booking> confirmedPastEnd = bookingRepository.findByStatusAndEndTimeBefore("CONFIRMED", now);
            for (Booking b : confirmedPastEnd) {
                try {
                    bookingService.markNoShow(b.getId());
                } catch (Exception ex) {
                    log.warn("Failed to mark booking {} as NO_SHOW: {}", b.getId(), ex.getMessage());
                }
            }
        });
    }
}
