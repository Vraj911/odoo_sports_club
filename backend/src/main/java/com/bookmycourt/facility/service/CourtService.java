package com.bookmycourt.facility.service;

import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.facility.dto.CourtResponse;
import com.bookmycourt.facility.mapper.CourtMapper;
import com.bookmycourt.facility.repository.CourtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CourtService {

    private final CourtRepository courts;
    private final CourtMapper mapper;

    public CourtService(CourtRepository courts, CourtMapper mapper) {
        this.courts = courts;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<CourtResponse> list(String sport) {
        var rows = (sport == null || sport.isBlank())
                ? courts.findByActiveTrueOrderByNameAsc()
                : courts.findBySportIgnoreCaseAndActiveTrueOrderByNameAsc(SportMapper.toDbSport(sport));
        return rows.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CourtResponse get(UUID id) {
        return courts.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new NotFoundException("Court not found"));
    }
}
