package com.bookmycourt.booking.service;

import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.common.event.EventHandlerRunner;
import com.bookmycourt.common.event.events.BookingEvents;
import com.bookmycourt.social.entity.Waitlist;
import com.bookmycourt.social.repository.WaitlistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;

@Component
public class WaitlistListener {

    private static final Logger log = LoggerFactory.getLogger(WaitlistListener.class);

    private final WaitlistRepository waitlistRepository;
    private final BookingService bookingService;
    private final EventHandlerRunner runner;
    private final Clock clock;

    public WaitlistListener(
            WaitlistRepository waitlistRepository,
            BookingService bookingService,
            EventHandlerRunner runner,
            Clock clock
    ) {
        this.waitlistRepository = waitlistRepository;
        this.bookingService = bookingService;
        this.runner = runner;
        this.clock = clock;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onSlotReleased(BookingEvents.SlotReleased event) {
        runner.run(event, "waitlist.onSlotReleased", e -> {
            List<Waitlist> waiting = waitlistRepository.findByCourt_IdAndStatusOrderByCreatedAtAsc(e.courtId(), "WAITING");

            for (Waitlist entry : waiting) {
                if (entry.getMember() == null) {
                    continue;
                }

                int hour = e.startSlot() / 2;
                int min = (e.startSlot() % 2) * 30;
                String timeStr = String.format("%02d:%02d", hour, min);

                try {
                    // Try to auto-create a pending hold booking
                    bookingService.create(new CreateBookingRequest(
                            e.courtId(),
                            entry.getMember().getId(),
                            null,
                            null,
                            e.day(),
                            timeStr,
                            "ONLINE",
                            "PAY_NOW",
                            false,
                            null,
                            "WAITLIST_OFFER"
                    ));

                    entry.setStatus("OFFERED");
                    entry.setOfferedAt(OffsetDateTime.now(clock));
                    entry.setOfferExpiresAt(OffsetDateTime.now(clock).plusMinutes(5));
                    waitlistRepository.save(entry);
                    log.info("Waitlist offer created for member {} on court {} date {}", entry.getMember().getId(), e.courtId(), e.day());
                    break;
                } catch (Exception ex) {
                    log.debug("Waitlist candidate not eligible: {}", ex.getMessage());
                }
            }
        });
    }
}
