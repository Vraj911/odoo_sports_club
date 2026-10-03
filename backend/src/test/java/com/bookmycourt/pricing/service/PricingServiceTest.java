package com.bookmycourt.pricing.service;

import com.bookmycourt.common.money.Money;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.pricing.dto.PriceQuoteResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PricingServiceTest {

    private CourtRepository courts;
    private MembershipRepository memberships;
    private PricingEngine pricingEngine;
    private PricingService service;

    @BeforeEach
    void setUp() {
        courts = Mockito.mock(CourtRepository.class);
        memberships = Mockito.mock(MembershipRepository.class);
        pricingEngine = Mockito.mock(PricingEngine.class);

        service = new PricingService(courts, memberships, pricingEngine);
    }

    @Test
    void quote_delegatesDirectlyToPricingEngine() {
        UUID courtId = UUID.randomUUID();
        Court court = new Court();
        court.setId(courtId);
        court.setSport("BADMINTON");

        when(courts.findById(courtId)).thenReturn(Optional.of(court));

        UUID ruleId = UUID.randomUUID();
        PriceQuote mockQuote = new PriceQuote(
                Money.ofRupees(400),
                ruleId,
                "Base Badminton rate",
                Money.ofRupees(600)
        );
        when(pricingEngine.quote(eq(court), eq("GUEST"), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(mockQuote);

        LocalDate date = LocalDate.of(2026, 10, 5);
        LocalTime start = LocalTime.of(18, 0);

        PriceQuoteResponse response = service.quote(courtId, null, date, start);

        assertNotNull(response);
        assertEquals(new BigDecimal("400.00"), response.youPay());
        assertEquals("Base Badminton rate", response.breakdown());
        verify(pricingEngine).quote(eq(court), eq("GUEST"), eq(date), eq(start));
    }
}
