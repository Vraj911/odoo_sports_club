package com.bookmycourt.booking.mapper;

import com.bookmycourt.booking.dto.AlternativeSlotResponse;
import com.bookmycourt.booking.dto.BookingResponse;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.booking.engine.Model.Slot;
import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.Member;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Component
public class BookingMapper {

    private final CourtRepository courts;

    public BookingMapper(CourtRepository courts) {
        this.courts = courts;
    }

    public BookingResponse toResponse(Booking booking) {
        Court court = booking.getCourt();
        Member member = booking.getMember();
        var localStart = booking.getStartTime().atZoneSameInstant(BookingEngine.IST);
        Instant hold = booking.getExpiresAt() == null ? null : booking.getExpiresAt().toInstant();
        String memberName = member == null
                ? booking.getGuestName()
                : member.getFirstName() + " " + member.getLastName();
        return new BookingResponse(
                booking.getId(),
                court.getId(),
                court.getName(),
                SportMapper.toApiSport(court.getSport()),
                SportMapper.indoor(court),
                localStart.toLocalDate(),
                SportMapper.localTime(booking.getStartTime()),
                SportMapper.localTime(booking.getEndTime()),
                booking.getStatus(),
                booking.getPriceCharged(),
                memberName,
                member == null ? null : member.getId(),
                booking.getGuestName(),
                booking.getGuestPhone(),
                booking.getPaymentStatus(),
                booking.getCreatedAt(),
                hold,
                booking.getNotes()
        );
    }

    public List<AlternativeSlotResponse> toAlternatives(List<Slot> slots, LocalDate date) {
        return slots.stream().map(slot -> {
            Court court = courts.findById(slot.courtId()).orElse(null);
            String name = court == null ? slot.courtId().toString() : court.getName();
            return new AlternativeSlotResponse(slot.courtId(), name, SportMapper.slotToTime(slot.startSlot()), date);
        }).toList();
    }
}
