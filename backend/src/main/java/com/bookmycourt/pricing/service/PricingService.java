package com.bookmycourt.pricing.service;

import com.bookmycourt.booking.engine.Model.PriceQuote;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.pricing.dto.PriceQuoteResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

@Service
public class PricingService {

    private final CourtRepository courts;
    private final MembershipRepository memberships;
    private final PricingEngine pricingEngine;

    public PricingService(
            CourtRepository courts,
            MembershipRepository memberships,
            PricingEngine pricingEngine) {
        this.courts = courts;
        this.memberships = memberships;
        this.pricingEngine = pricingEngine;
    }

    @Transactional(readOnly = true)
    public PriceQuoteResponse quote(UUID courtId, UUID memberId, LocalDate date, LocalTime start) {
        Court court = courts.findById(courtId).orElseThrow(() -> new NotFoundException("Court not found"));
        String customerType = "GUEST";
        if (memberId != null) {
            Membership current = memberships.findCurrent(memberId, date).orElse(null);
            if (current != null && current.getPlan() != null) {
                customerType = current.getPlan().getName();
            }
        }
        com.bookmycourt.pricing.service.PriceQuote quote = pricingEngine.quote(court, customerType, date, start);
        BigDecimal youPay = quote.amount().toRupees();
        BigDecimal guestRate = quote.guestPrice() != null ? quote.guestPrice().toRupees() : youPay;
        BigDecimal discount = guestRate.subtract(youPay).max(BigDecimal.ZERO);
        UUID ruleId = quote.ruleId();
        return new PriceQuoteResponse(guestRate, discount, customerType, ruleId, youPay, quote.breakdown());
    }

    public PriceQuote toEngineQuote(PriceQuoteResponse response) {
        return new PriceQuote(response.youPay(), response.breakdown());
    }
}
