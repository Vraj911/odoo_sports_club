package com.bookmycourt.admin.service;

import com.bookmycourt.admin.dto.ClubPublicResponse;
import com.bookmycourt.admin.entity.ClubProfile;
import com.bookmycourt.admin.repository.ClubProfileRepository;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.booking.engine.Model.ClubConfig;
import com.bookmycourt.common.mapping.SportMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClubQueryService {

    private final ClubProfileRepository profiles;
    private final BookingEngine engine;

    public ClubQueryService(ClubProfileRepository profiles, BookingEngine engine) {
        this.profiles = profiles;
        this.engine = engine;
    }

    @Transactional(readOnly = true)
    public ClubPublicResponse current() {
        ClubConfig cfg = engine.config();
        ClubProfile profile = profiles.findAll().stream().findFirst().orElse(null);
        String name = profile == null ? "The Champions Club" : profile.getClubName();
        String tz = profile == null ? BookingEngine.IST.getId() : profile.getTimezone();
        String currency = profile == null ? "INR" : profile.getCurrency();
        return new ClubPublicResponse(
                name,
                tz,
                currency,
                SportMapper.slotToTime(cfg.openSlot()),
                SportMapper.slotToTime(cfg.closeSlot()),
                cfg.dailyCap(),
                cfg.holdMinutes()
        );
    }
}
