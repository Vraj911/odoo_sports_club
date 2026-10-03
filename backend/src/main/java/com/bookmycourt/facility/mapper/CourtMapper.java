package com.bookmycourt.facility.mapper;

import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.facility.dto.CourtResponse;
import com.bookmycourt.facility.entity.Court;
import org.springframework.stereotype.Component;

@Component
public class CourtMapper {

    public CourtResponse toResponse(Court court) {
        return new CourtResponse(
                court.getId(),
                court.getName(),
                SportMapper.toApiSport(court.getSport()),
                SportMapper.indoor(court),
                court.getLocation(),
                court.getSlotDurationMinutes(),
                court.getSlotIntervalMinutes(),
                court.isActive()
        );
    }
}
