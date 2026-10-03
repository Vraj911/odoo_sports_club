package com.bookmycourt.crm.service;

import com.bookmycourt.crm.dto.CreateQuoteRequest;
import com.bookmycourt.crm.dto.LeadPipelineResponse;
import com.bookmycourt.crm.dto.QuoteLineRequest;
import com.bookmycourt.crm.dto.QuoteResponse;
import com.bookmycourt.crm.entity.Lead;
import com.bookmycourt.crm.mapper.CrmMapper;
import com.bookmycourt.crm.repository.FollowUpRepository;
import com.bookmycourt.crm.repository.LeadRepository;
import com.bookmycourt.crm.repository.QuoteRepository;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CrmServiceTest {

    private LeadRepository leads;
    private FollowUpRepository followUps;
    private QuoteRepository quotes;
    private CrmService service;

    @BeforeEach
    void setUp() {
        leads = Mockito.mock(LeadRepository.class);
        followUps = Mockito.mock(FollowUpRepository.class);
        quotes = Mockito.mock(QuoteRepository.class);
        MemberRepository members = Mockito.mock(MemberRepository.class);
        AppUserRepository users = Mockito.mock(AppUserRepository.class);
        CrmMapper mapper = new CrmMapper();

        service = new CrmService(leads, followUps, members, users, mapper, quotes);
    }

    @Test
    void getPipeline_calculatesCountsAndConversionRate() {
        Lead l1 = new Lead();
        l1.setStatus("NEW");
        l1.setSource("WEBSITE");

        Lead l2 = new Lead();
        l2.setStatus("WON");
        l2.setSource("WEBSITE");

        when(leads.findAll()).thenReturn(List.of(l1, l2));

        LeadPipelineResponse pipeline = service.getPipeline();
        assertNotNull(pipeline);
        assertEquals(2, pipeline.totalLeads());
        assertEquals(1, pipeline.newLeads());
        assertEquals(1, pipeline.wonLeads());
        assertEquals(50.0, pipeline.conversionRatePercent());
        assertEquals(2L, pipeline.leadsBySource().get("WEBSITE"));
    }

    @Test
    void createQuote_calculatesTotalAndSetsLeadStatus() {
        UUID leadId = UUID.randomUUID();
        Lead lead = new Lead();
        lead.setId(leadId);
        lead.setStatus("NEW");

        when(leads.findById(leadId)).thenReturn(Optional.of(lead));

        CreateQuoteRequest req = new CreateQuoteRequest(
                leadId,
                LocalDate.now().plusDays(15),
                "Standard annual membership",
                List.of(
                        new QuoteLineRequest("Annual pass", new BigDecimal("1"), new BigDecimal("1000.00"), new BigDecimal("18.00")),
                        new QuoteLineRequest("Admin fee", new BigDecimal("1"), new BigDecimal("200.00"), BigDecimal.ZERO)
                )
        );

        QuoteResponse quote = service.createQuote(req);
        assertNotNull(quote);
        // line 1: 1000 + 18% = 1180.00; line 2: 200 + 0% = 200.00 => total = 1380.00
        assertEquals(new BigDecimal("1380.00"), quote.total());
        assertEquals("QUOTE_SENT", lead.getStatus());
        verify(quotes).save(any());
        verify(leads).save(lead);
    }
}
