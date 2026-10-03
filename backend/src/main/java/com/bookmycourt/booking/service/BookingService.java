package com.bookmycourt.booking.service;

import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.dto.CourtAvailabilityResponse;
import com.bookmycourt.booking.dto.CreateBookingRequest;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.booking.engine.Model.BookingCommand;
import com.bookmycourt.booking.engine.Model.BookingResult;
import com.bookmycourt.booking.engine.Model.Channel;
import com.bookmycourt.booking.engine.Model.ClubConfig;
import com.bookmycourt.booking.engine.Model.ConfirmationFailedException;
import com.bookmycourt.booking.engine.SlotMask;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.mapper.BookingMapper;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.pricing.dto.PriceQuoteResponse;
import com.bookmycourt.pricing.service.PricingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
@Service
public class BookingService {
    private final BookingEngine engine;
    private final BookingRepository bookings;
    private final CourtRepository courts;
    private final BookingMapper mapper;
    private final PricingService pricing;
    public BookingService(
            BookingEngine engine,
            BookingRepository bookings,
            CourtRepository courts,
            BookingMapper mapper,
            PricingService pricing) {
        this.engine = engine;
        this.bookings = bookings;
        this.courts = courts;
        this.mapper = mapper;
        this.pricing = pricing;
    }
    public BookingResponse create(CreateBookingRequest request) {
        LocalTime startTime = LocalTime.parse(request.startTime());
        OffsetDateTime start = ZonedDateTime.of(request.date(), startTime, BookingEngine.IST)
                .toOffsetDateTime()
                .withOffsetSameInstant(ZoneOffset.UTC);
        Channel channel = parseChannel(request.channel());
        if ((request.memberId() == null) && (request.guestName() == null || request.guestName().isBlank())) {
            throw new com.bookmycourt.booking.engine.Model.InvalidSlotException(
                    "A member or guest name is required");
        }
        PriceQuoteResponse quote = pricing.quote(request.courtId(), request.memberId(), request.date(), startTime);
        BookingCommand cmd = new BookingCommand(
                request.courtId(),
                request.memberId(),
                request.guestName(),
                request.guestPhone(),
                start,
                channel
        );
        BookingResult result = engine.book(cmd, pricing.toEngineQuote(quote));
        return get(result.bookingId());
    }
    public BookingResponse confirm(UUID bookingId) {
        BookingResponse current = get(bookingId);
        if (!"PENDING".equals(current.status()) || !engine.confirm(bookingId)) {
            throw new ConfirmationFailedException();
        }
        return get(bookingId);
    }
    public BookingResponse cancel(UUID bookingId, String reason) {
        engine.cancel(bookingId, reason);
        return get(bookingId);
    }
    @Transactional
    public BookingResponse checkIn(UUID bookingId) {
        int updated = bookings.markCheckedIn(bookingId);
        if (updated == 0) {
            throw new NotFoundException("Booking cannot be checked in");
        }
        return get(bookingId);
    }
    @Transactional(readOnly = true)
    public BookingResponse get(UUID bookingId) {
        Booking booking = bookings.findDetailedById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));
        return mapper.toResponse(booking);
    }
    @Transactional(readOnly = true)
    public List<BookingResponse> listForMember(UUID memberId) {
        return bookings.findDetailedByMember(memberId).stream()
                .map(mapper::toResponse)
                .toList();
    }
    public List<CourtAvailabilityResponse> availability(String sport, LocalDate date) {
        List<Court> courtList = (sport == null || sport.isBlank())
                ? courts.findByActiveTrueOrderByNameAsc()
                : courts.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(SportMapper.toDbSport(sport));
        ClubConfig cfg = engine.config();
        List<CourtAvailabilityResponse> out = new ArrayList<>();
        for (Court court : courtList) {
            long occupied = engine.occupancy(court.getId(), date);
            List<Integer> starts = engine.startableSlots(court.getId(), date);
            out.add(new CourtAvailabilityResponse(
                    court.getId(),
                    court.getName(),
                    SportMapper.toApiSport(court.getSport()),
                    SportMapper.indoor(court),
                    date.toString(),
                    occupiedHalfHours(occupied, cfg),
                    starts.stream().map(SportMapper::slotToTime).toList()
            ));
        }
        return out;
    }
    public int reapExpiredHolds() {
        return engine.reapExpiredHolds();
    }
    private static Channel parseChannel(String channel) {
        if (channel == null || channel.isBlank()) {
            return Channel.ONLINE;
        }
        try {
            return Channel.valueOf(channel.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            return Channel.ONLINE;
        }
    }
    private static List<String> occupiedHalfHours(long mask, ClubConfig cfg) {
        List<String> times = new ArrayList<>();
        long openRange = SlotMask.range(cfg.openSlot(), cfg.closeSlot());
        long bits = mask & openRange;
        while (bits != 0) {
            int slot = Long.numberOfTrailingZeros(bits);
            times.add(SportMapper.slotToTime(slot));
            bits &= bits - 1;
        }
        return times;
    }
}
