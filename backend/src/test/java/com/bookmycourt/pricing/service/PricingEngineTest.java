package com.bookmycourt.pricing.service;

import com.bookmycourt.admin.entity.ClubOpeningHours;
import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.admin.repository.ClubOpeningHoursRepository;
import com.bookmycourt.admin.service.ClubCalendarService;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.pricing.entity.PricingRule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

class PricingEngineTest {

    private PricingTable pricingTable;
    private Court tennisCourt;

    @BeforeEach
    void setUp() {
        tennisCourt = new Court();
        tennisCourt.setId(UUID.randomUUID());
        tennisCourt.setName("Tennis 1");
        tennisCourt.setSport("TENNIS");
        tennisCourt.setIndoorOutdoor("OUTDOOR");

        List<PricingRule> rules = new ArrayList<>();

        // Gold weekday outdoor rule: 0
        PricingRule goldRule = new PricingRule();
        goldRule.setId(UUID.randomUUID());
        goldRule.setCustomerType("GOLD");
        goldRule.setSport("TENNIS");
        goldRule.setIndoorOutdoor("OUTDOOR");
        goldRule.setPrice(BigDecimal.ZERO);
        goldRule.setActive(true);
        rules.add(goldRule);

        // Silver weekday outdoor rule: 300
        PricingRule silverRule = new PricingRule();
        silverRule.setId(UUID.randomUUID());
        silverRule.setCustomerType("SILVER");
        silverRule.setSport("TENNIS");
        silverRule.setIndoorOutdoor("OUTDOOR");
        silverRule.setPrice(new BigDecimal("300.00"));
        silverRule.setActive(true);
        rules.add(silverRule);

        // Guest weekday outdoor rule: 600
        PricingRule guestRule = new PricingRule();
        guestRule.setId(UUID.randomUUID());
        guestRule.setCustomerType("GUEST");
        guestRule.setSport("TENNIS");
        guestRule.setIndoorOutdoor("OUTDOOR");
        guestRule.setPrice(new BigDecimal("600.00"));
        guestRule.setActive(true);
        rules.add(guestRule);

        pricingTable = new PricingTable(rules);
    }

    @Test
    void testGoldMemberQuoteIsZero() {
        LocalDate date = LocalDate.of(2026, 10, 5); // Monday
        LocalTime slot = LocalTime.of(10, 0);

        PriceQuote quote = pricingTable.quote(tennisCourt, "GOLD", date, slot, ClubCalendarService.DayType.WEEKDAY);
        assertEquals(Money.ZERO, quote.amount());
        assertEquals(Money.ofRupees(600), quote.guestPrice());
        assertTrue(quote.breakdown().contains("GOLD"));
    }

    @Test
    void testSilverMemberQuote() {
        LocalDate date = LocalDate.of(2026, 10, 5);
        LocalTime slot = LocalTime.of(10, 0);

        PriceQuote quote = pricingTable.quote(tennisCourt, "SILVER", date, slot, ClubCalendarService.DayType.WEEKDAY);
        assertEquals(Money.ofRupees(300), quote.amount());
        assertEquals(Money.ofRupees(600), quote.guestPrice());
    }

    @Test
    void testGuestQuote() {
        LocalDate date = LocalDate.of(2026, 10, 5);
        LocalTime slot = LocalTime.of(10, 0);

        PriceQuote quote = pricingTable.quote(tennisCourt, "GUEST", date, slot, ClubCalendarService.DayType.WEEKDAY);
        assertEquals(Money.ofRupees(600), quote.amount());
        assertEquals(Money.ofRupees(600), quote.guestPrice());
    }
}
