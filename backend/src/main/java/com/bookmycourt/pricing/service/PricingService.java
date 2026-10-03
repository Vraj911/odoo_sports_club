package com.bookmycourt.pricing.service;

import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.booking.engine.Model.PriceQuote;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.pricing.dto.PriceQuoteResponse;
import com.bookmycourt.pricing.entity.PricingRule;
import com.bookmycourt.pricing.repository.PricingRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class PricingService {

    private final CourtRepository courts;
    private final MembershipRepository memberships;
    private final ClubHolidayRepository holidays;
    private final PricingRuleRepository rules;

    public PricingService(
            CourtRepository courts,
            MembershipRepository memberships,
            ClubHolidayRepository holidays,
            PricingRuleRepository rules) {
        this.courts = courts;
        this.memberships = memberships;
        this.holidays = holidays;
        this.rules = rules;
    }

    @Transactional(readOnly = true)
    public PriceQuoteResponse quote(UUID courtId, UUID memberId, LocalDate date, LocalTime start) {
        Court court = courts.findById(courtId).orElseThrow(() -> new NotFoundException("Court not found"));
        String customerType = "GUEST";
        UUID planId = null;
        if (memberId != null) {
            Membership current = memberships.findCurrent(memberId, date).orElse(null);
            if (current != null) {
                customerType = current.getPlan().getName();
                planId = current.getPlan().getId();
            }
        }
        String dayType = dayType(date);
        PricingRule matched = matchRule(planId, customerType, dayType, court.getIndoorOutdoor(), start, date);
        BigDecimal youPay = matched != null ? matched.getPrice() : fallbackPrice(court.getSport(), customerType);
        BigDecimal guestRate = guestRate(court.getSport(), dayType, court.getIndoorOutdoor(), start, date);
        BigDecimal discount = guestRate.subtract(youPay).max(BigDecimal.ZERO);
        UUID ruleId = matched == null ? null : matched.getId();
        String breakdown = customerType + " · " + dayType + " · " + court.getSport() + " @ " + start;
        return new PriceQuoteResponse(guestRate, discount, customerType, ruleId, youPay, breakdown);
    }

    public PriceQuote toEngineQuote(PriceQuoteResponse response) {
        return new PriceQuote(response.youPay(), response.breakdown());
    }

    private PricingRule matchRule(
            UUID planId,
            String customerType,
            String dayType,
            String indoorOutdoor,
            LocalTime start,
            LocalDate date) {
        List<PricingRule> found = rules.findMatching(planId, customerType, dayType, indoorOutdoor, start, date);
        return found.isEmpty() ? null : found.get(0);
    }

    private BigDecimal guestRate(String sport, String dayType, String indoorOutdoor, LocalTime start, LocalDate date) {
        List<PricingRule> found = rules.findMatching(null, "GUEST", dayType, indoorOutdoor, start, date);
        if (!found.isEmpty()) {
            return found.get(0).getPrice();
        }
        return fallbackPrice(sport, "GUEST");
    }

    private String dayType(LocalDate date) {
        if (holidays.existsByHolidayDateAndActiveTrue(date)) {
            return "HOLIDAY";
        }
        DayOfWeek dow = date.getDayOfWeek();
        return (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) ? "WEEKEND" : "WEEKDAY";
    }

    private BigDecimal fallbackPrice(String sport, String customerType) {
        String key = sport == null ? "" : sport.toUpperCase(Locale.ROOT).replace('-', '_');
        int guest = switch (key) {
            case "TENNIS" -> 600;
            case "PADEL" -> 800;
            case "BADMINTON" -> 400;
            case "CRICKET_NET" -> 1000;
            default -> 500;
        };
        int amount = switch (customerType.toUpperCase(Locale.ROOT)) {
            case "GOLD" -> 0;
            case "SILVER" -> guest / 2;
            case "JUNIOR" -> guest / 3;
            default -> guest;
        };
        return BigDecimal.valueOf(amount);
    }
}
