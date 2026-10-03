package com.bookmycourt.booking.service;

import com.bookmycourt.booking.engine.CourtDayCalendar;
import com.bookmycourt.common.event.EventHandlerRunner;
import com.bookmycourt.common.event.events.BookingEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Component
public class AvailabilityPushListener {

    private static final Logger log = LoggerFactory.getLogger(AvailabilityPushListener.class);

    private final CalendarRegistry calendarRegistry;
    private final SimpMessagingTemplate messagingTemplate;
    private final EventHandlerRunner runner;

    public AvailabilityPushListener(
            CalendarRegistry calendarRegistry,
            SimpMessagingTemplate messagingTemplate,
            EventHandlerRunner runner
    ) {
        this.calendarRegistry = calendarRegistry;
        this.messagingTemplate = messagingTemplate;
        this.runner = runner;
    }

    public record AvailabilityUpdate(
            UUID courtId,
            LocalDate date,
            long booked,
            long held,
            long social,
            long blocked
    ) {}

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onBookingChanged(BookingEvents.BookingChanged event) {
        runner.run(event, "availability.push", e -> {
            try {
                CourtDayCalendar cal = calendarRegistry.get(e.courtId(), e.day());
                AvailabilityUpdate update = new AvailabilityUpdate(
                        e.courtId(),
                        e.day(),
                        cal.bookedMask(),
                        cal.heldMask(),
                        cal.socialMask(),
                        cal.blockedMask()
                );
                messagingTemplate.convertAndSend("/topic/availability/" + e.day(), update);
            } catch (Exception ex) {
                log.warn("Failed to push availability update over websocket: {}", ex.getMessage());
            }
        });
    }
}
