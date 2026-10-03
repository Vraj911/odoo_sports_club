package com.bookmycourt.pricing.service;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.pricing.entity.PricingRule;
import com.bookmycourt.pricing.repository.PricingRuleRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
public class PricingEngine {

    private final PricingRuleRepository pricingRuleRepository;
    private final CourtRepository courtRepository;
    private final ClubCalendarService calendarService;

    private final AtomicReference<PricingTable> table = new AtomicReference<>(new PricingTable(List.of()));

    public PricingEngine(PricingRuleRepository pricingRuleRepository,
                         CourtRepository courtRepository,
                         ClubCalendarService calendarService) {
        this.pricingRuleRepository = pricingRuleRepository;
        this.courtRepository = courtRepository;
        this.calendarService = calendarService;
    }

    @PostConstruct
    public void init() {
        rebuild();
    }

    public void rebuild() {
        List<PricingRule> rules = pricingRuleRepository.findByActiveTrue();
        table.set(new PricingTable(rules));
    }

    public PriceQuote quote(Court court, String tier, LocalDate date, LocalTime slotStart) {
        if (court == null) {
            throw new DomainException(ErrorCode.NOT_FOUND, "Court cannot be null");
        }
        if (tier == null || tier.isBlank()) {
            tier = "GUEST";
        }
        ClubCalendarService.DayType dayType = calendarService.dayType(date);
        return table.get().quote(court, tier, date, slotStart, dayType);
    }

    public PriceQuote quote(UUID courtId, String tier, LocalDate date, LocalTime slotStart) {
        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Court not found: " + courtId));
        return quote(court, tier, date, slotStart);
    }
}
