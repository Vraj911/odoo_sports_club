package com.bookmycourt.pricing.service;

import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.pricing.entity.PricingRule;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public final class PricingTable {

    private final List<PricingRule> rules;

    public PricingTable(List<PricingRule> rules) {
        this.rules = rules != null ? List.copyOf(rules) : List.of();
    }

    public PriceQuote quote(Court court,
                            String tier,
                            LocalDate date,
                            LocalTime slotStart,
                            ClubCalendarService.DayType dayType) {
        PricingRule bestRule = findBestRule(court, tier, date, slotStart, dayType)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND,
                        "No pricing rule matches court=" + court.getName() + ", tier=" + tier + ", date=" + date + ", slot=" + slotStart));

        Money amount = Money.ofRupees(bestRule.getPrice());

        // Also calculate guest price
        Money guestPrice = amount;
        if (!"GUEST".equalsIgnoreCase(tier)) {
            guestPrice = findBestRule(court, "GUEST", date, slotStart, dayType)
                    .map(r -> Money.ofRupees(r.getPrice()))
                    .orElse(amount);
        }

        String ruleShortId = bestRule.getId() != null ? bestRule.getId().toString().substring(0, 8) : "default";
        String breakdown = String.format("%s, %s, %s-%s, %s: rule #%s = %s; guest price would be %s",
                tier.toUpperCase(),
                dayType.name(),
                bestRule.getTimeStart() != null ? bestRule.getTimeStart() : "any",
                bestRule.getTimeEnd() != null ? bestRule.getTimeEnd() : "any",
                court.getIndoorOutdoor(),
                ruleShortId,
                amount,
                guestPrice);

        return new PriceQuote(amount, bestRule.getId(), breakdown, guestPrice);
    }

    private Optional<PricingRule> findBestRule(Court court,
                                              String tier,
                                              LocalDate date,
                                              LocalTime slotStart,
                                              ClubCalendarService.DayType dayType) {
        List<ScoredRule> candidates = new ArrayList<>();
        for (PricingRule r : rules) {
            if (!r.isActive()) continue;
            if (r.getValidFrom() != null && date.isBefore(r.getValidFrom())) continue;
            if (r.getValidTo() != null && date.isAfter(r.getValidTo())) continue;
            if (!r.getCustomerType().equalsIgnoreCase(tier)) continue;

            if (r.getDayType() != null && !r.getDayType().isBlank() && !r.getDayType().equalsIgnoreCase("ANY")
                    && !r.getDayType().equalsIgnoreCase(dayType.name())) {
                continue;
            }
            if (r.getIndoorOutdoor() != null && !r.getIndoorOutdoor().isBlank() && !r.getIndoorOutdoor().equalsIgnoreCase("ANY")
                    && !r.getIndoorOutdoor().equalsIgnoreCase(court.getIndoorOutdoor())) {
                continue;
            }
            if (r.getSport() != null && !r.getSport().isBlank() && !r.getSport().equalsIgnoreCase("ANY")
                    && !r.getSport().equalsIgnoreCase(court.getSport())) {
                continue;
            }
            if (r.getTimeStart() != null && r.getTimeEnd() != null) {
                if (slotStart.isBefore(r.getTimeStart()) || !slotStart.isBefore(r.getTimeEnd())) {
                    continue;
                }
            }

            int score = 0;
            if (r.getDayType() != null && !r.getDayType().isBlank() && !r.getDayType().equalsIgnoreCase("ANY")) score += 100;
            if (r.getIndoorOutdoor() != null && !r.getIndoorOutdoor().isBlank() && !r.getIndoorOutdoor().equalsIgnoreCase("ANY")) score += 100;
            if (r.getSport() != null && !r.getSport().isBlank() && !r.getSport().equalsIgnoreCase("ANY")) score += 100;
            if (r.getTimeStart() != null && r.getTimeEnd() != null) score += 100;
            score += r.getPriority();

            candidates.add(new ScoredRule(r, score));
        }

        return candidates.stream()
                .max(Comparator.comparingInt(ScoredRule::score))
                .map(ScoredRule::rule);
    }

    private record ScoredRule(PricingRule rule, int score) {
    }
}
