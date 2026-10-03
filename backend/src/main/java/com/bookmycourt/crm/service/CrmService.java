package com.bookmycourt.crm.service;

import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.crm.dto.CompleteFollowUpRequest;
import com.bookmycourt.crm.dto.ConvertLeadRequest;
import com.bookmycourt.crm.dto.CreateFollowUpRequest;
import com.bookmycourt.crm.dto.CreateLeadRequest;
import com.bookmycourt.crm.dto.FollowUpResponse;
import com.bookmycourt.crm.dto.LeadResponse;
import com.bookmycourt.crm.dto.UpdateLeadStatusRequest;
import com.bookmycourt.crm.entity.FollowUp;
import com.bookmycourt.crm.entity.Lead;
import com.bookmycourt.crm.mapper.CrmMapper;
import com.bookmycourt.crm.repository.FollowUpRepository;
import com.bookmycourt.crm.repository.LeadRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class CrmService {

    private final LeadRepository leads;
    private final FollowUpRepository followUps;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final CrmMapper mapper;
    private final com.bookmycourt.crm.repository.QuoteRepository quotes;

    public CrmService(
            LeadRepository leads,
            FollowUpRepository followUps,
            MemberRepository members,
            AppUserRepository users,
            CrmMapper mapper,
            com.bookmycourt.crm.repository.QuoteRepository quotes) {
        this.leads = leads;
        this.followUps = followUps;
        this.members = members;
        this.users = users;
        this.mapper = mapper;
        this.quotes = quotes;
    }

    @Transactional
    public LeadResponse createLead(CreateLeadRequest request) {
        Lead lead = new Lead();
        lead.setLeadNumber("LEAD-" + System.currentTimeMillis());
        lead.setFirstName(request.firstName());
        lead.setLastName(request.lastName());
        lead.setEmail(request.email());
        lead.setPhone(request.phone());
        lead.setSource(request.source());
        lead.setStatus("NEW");
        lead.setNotes(request.notes());

        if (request.assignedToUserId() != null) {
            AppUser u = users.findById(request.assignedToUserId()).orElse(null);
            lead.setAssignedTo(u);
        }

        leads.save(lead);
        return mapper.toResponse(lead);
    }

    @Transactional
    public LeadResponse updateStatus(UUID leadId, UpdateLeadStatusRequest request) {
        Lead lead = leads.findById(leadId).orElseThrow(() -> new NotFoundException("Lead not found"));

        if ("LOST".equalsIgnoreCase(request.status()) && (request.lostReason() == null || request.lostReason().isBlank())) {
            throw new IllegalArgumentException("Lost reason is required when status is LOST");
        }

        lead.setStatus(request.status());
        if (request.lostReason() != null) {
            lead.setLostReason(request.lostReason());
        }
        if (request.notes() != null) {
            lead.setNotes(request.notes());
        }
        lead.setLastContactAt(Instant.now());
        leads.save(lead);
        return mapper.toResponse(lead);
    }

    @Transactional
    public LeadResponse convertLead(UUID leadId, ConvertLeadRequest request) {
        Lead lead = leads.findById(leadId).orElseThrow(() -> new NotFoundException("Lead not found"));
        Member member = members.findById(request.memberId()).orElseThrow(() -> new NotFoundException("Member not found"));

        lead.setMember(member);
        lead.setStatus("WON");
        lead.setConvertedAt(Instant.now());
        leads.save(lead);
        return mapper.toResponse(lead);
    }

    @Transactional(readOnly = true)
    public LeadResponse getLead(UUID id) {
        Lead lead = leads.findById(id).orElseThrow(() -> new NotFoundException("Lead not found"));
        return mapper.toResponse(lead);
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> listLeads(String status) {
        List<Lead> list = (status != null && !status.isBlank())
                ? leads.findByStatus(status)
                : leads.findByOrderByCreatedAtDesc();
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public FollowUpResponse createFollowUp(CreateFollowUpRequest request) {
        Lead lead = leads.findById(request.leadId()).orElseThrow(() -> new NotFoundException("Lead not found"));

        FollowUp f = new FollowUp();
        f.setLead(lead);
        f.setDueAt(request.dueAt());
        f.setSubject(request.subject());
        f.setNotes(request.notes());
        f.setStatus("OPEN");

        if (request.assignedToUserId() != null) {
            AppUser u = users.findById(request.assignedToUserId()).orElse(null);
            f.setAssignedTo(u);
        }

        followUps.save(f);

        lead.setNextFollowUpAt(request.dueAt());
        leads.save(lead);

        return mapper.toResponse(f);
    }

    @Transactional
    public FollowUpResponse completeFollowUp(UUID followUpId, CompleteFollowUpRequest request) {
        FollowUp f = followUps.findById(followUpId).orElseThrow(() -> new NotFoundException("Follow-up not found"));
        f.setStatus("COMPLETED");
        f.setCompletedAt(Instant.now());
        if (request.completedByUserId() != null) {
            AppUser u = users.findById(request.completedByUserId()).orElse(null);
            f.setCompletedBy(u);
        }
        if (request.notes() != null) {
            f.setNotes(request.notes());
        }
        followUps.save(f);
        return mapper.toResponse(f);
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> listFollowUps(UUID leadId, String status) {
        if (leadId != null) {
            return followUps.findByLead_IdOrderByDueAtAsc(leadId).stream().map(mapper::toResponse).toList();
        }
        if (status != null && !status.isBlank()) {
            return followUps.findByStatusOrderByDueAtAsc(status).stream().map(mapper::toResponse).toList();
        }
        return followUps.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getOverdueFollowUps() {
        return followUps.findByStatusOrderByDueAtAsc("OPEN").stream()
                .filter(f -> f.getDueAt() != null && f.getDueAt().isBefore(Instant.now()))
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public com.bookmycourt.crm.dto.LeadPipelineResponse getPipeline() {
        List<Lead> all = leads.findAll();
        long total = all.size();
        long newL = all.stream().filter(l -> "NEW".equalsIgnoreCase(l.getStatus())).count();
        long contacted = all.stream().filter(l -> "CONTACTED".equalsIgnoreCase(l.getStatus())).count();
        long quoteSent = all.stream().filter(l -> "QUOTE_SENT".equalsIgnoreCase(l.getStatus())).count();
        long trial = all.stream().filter(l -> "TRIAL_BOOKED".equalsIgnoreCase(l.getStatus())).count();
        long won = all.stream().filter(l -> "WON".equalsIgnoreCase(l.getStatus())).count();
        long lost = all.stream().filter(l -> "LOST".equalsIgnoreCase(l.getStatus())).count();

        double conversion = total > 0 ? (won * 100.0) / total : 0.0;
        java.util.Map<String, Long> bySource = all.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        l -> l.getSource() != null ? l.getSource() : "OTHER",
                        java.util.stream.Collectors.counting()
                ));

        return new com.bookmycourt.crm.dto.LeadPipelineResponse(
                total,
                newL,
                contacted,
                quoteSent,
                trial,
                won,
                lost,
                conversion,
                bySource
        );
    }

    @Transactional
    public com.bookmycourt.crm.dto.QuoteResponse createQuote(com.bookmycourt.crm.dto.CreateQuoteRequest request) {
        Lead lead = leads.findById(request.leadId())
                .orElseThrow(() -> new NotFoundException("Lead not found: " + request.leadId()));

        com.bookmycourt.crm.entity.Quote q = new com.bookmycourt.crm.entity.Quote();
        q.setLead(lead);
        q.setValidUntil(request.validUntil());
        q.setStatus("DRAFT");
        q.setNotes(request.notes());

        java.math.BigDecimal subtotal = java.math.BigDecimal.ZERO;
        List<com.bookmycourt.crm.entity.QuoteLine> lineList = new java.util.ArrayList<>();

        for (com.bookmycourt.crm.dto.QuoteLineRequest lr : request.lines()) {
            java.math.BigDecimal taxRate = lr.taxPercent() != null ? lr.taxPercent() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal net = lr.quantity().multiply(lr.unitPrice());
            java.math.BigDecimal tax = net.multiply(taxRate).divide(java.math.BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
            java.math.BigDecimal lineTotal = net.add(tax);

            com.bookmycourt.crm.entity.QuoteLine line = new com.bookmycourt.crm.entity.QuoteLine();
            line.setQuote(q);
            line.setDescription(lr.description());
            line.setQuantity(lr.quantity());
            line.setUnitPrice(lr.unitPrice());
            line.setTaxPercent(taxRate);
            line.setLineTotal(lineTotal);
            lineList.add(line);

            subtotal = subtotal.add(lineTotal);
        }

        q.setTotal(subtotal);
        q.setLines(lineList);
        quotes.save(q);

        lead.setStatus("QUOTE_SENT");
        leads.save(lead);

        return toQuoteResponse(q);
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.crm.dto.QuoteResponse> listQuotes(UUID leadId) {
        List<com.bookmycourt.crm.entity.Quote> list = (leadId != null)
                ? quotes.findByLead_IdOrderByCreatedAtDesc(leadId)
                : quotes.findAll();
        return list.stream().map(this::toQuoteResponse).toList();
    }

    @Transactional
    public com.bookmycourt.crm.dto.QuoteResponse updateQuoteStatus(UUID quoteId, String status) {
        com.bookmycourt.crm.entity.Quote q = quotes.findById(quoteId)
                .orElseThrow(() -> new NotFoundException("Quote not found: " + quoteId));
        q.setStatus(status.toUpperCase());
        quotes.save(q);
        return toQuoteResponse(q);
    }

    private com.bookmycourt.crm.dto.QuoteResponse toQuoteResponse(com.bookmycourt.crm.entity.Quote q) {
        String leadName = q.getLead() != null
                ? q.getLead().getFirstName() + " " + q.getLead().getLastName()
                : "Lead";

        List<com.bookmycourt.crm.dto.QuoteLineResponse> lineResponses = q.getLines().stream().map(l ->
                new com.bookmycourt.crm.dto.QuoteLineResponse(
                        l.getId(),
                        l.getDescription(),
                        l.getQuantity(),
                        l.getUnitPrice(),
                        l.getTaxPercent(),
                        l.getLineTotal()
                )
        ).toList();

        return new com.bookmycourt.crm.dto.QuoteResponse(
                q.getId(),
                q.getLead() != null ? q.getLead().getId() : null,
                leadName,
                q.getValidUntil(),
                q.getTotal(),
                q.getStatus(),
                q.getNotes(),
                q.getCreatedAt(),
                lineResponses
        );
    }
}
