package com.bookmycourt.admin.service;

import com.bookmycourt.admin.dto.ClubPublicResponse;
import com.bookmycourt.admin.entity.ClubProfile;
import com.bookmycourt.admin.mapper.AdminMapper;
import com.bookmycourt.admin.repository.ClubProfileRepository;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.booking.engine.Model.ClubConfig;
import com.bookmycourt.common.mapping.SportMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;

@Service
public class ClubQueryService {

    public static final String DEFAULT_NAME = "The Champions Club";

    private final ClubProfileRepository profiles;
    private final BookingEngine engine;
    private final ClubCalendarService calendar;
    private final AdminMapper mapper;

    public ClubQueryService(ClubProfileRepository profiles, BookingEngine engine,
                            ClubCalendarService calendar, AdminMapper mapper) {
        this.profiles = profiles;
        this.engine = engine;
        this.calendar = calendar;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public ClubPublicResponse current() {
        ClubConfig cfg = engine.config();
        ClubProfile p = profiles.findAll().stream().findFirst().orElse(null);
        return new ClubPublicResponse(
                p == null ? DEFAULT_NAME : p.getClubName(),
                p == null ? BookingEngine.IST.getId() : p.getTimezone(),
                p == null ? "INR" : p.getCurrency(),
                SportMapper.slotToTime(cfg.openSlot()),
                SportMapper.slotToTime(cfg.closeSlot()),
                cfg.dailyCap(),
                cfg.holdMinutes(),
                p == null ? null : p.getPhone(),
                p == null ? null : p.getEmail(),
                p == null ? null : p.getAddress(),
                p == null ? null : p.getWebsite(),
                p == null ? null : p.getLogoUrl(),
                calendar.weeklySchedule().stream()
                        .sorted(Comparator.comparingInt(h -> h.getWeekday()))
                        .map(mapper::toResponse)
                        .toList());
    }
}