package com.bookmycourt.crm.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.crm.dto.CompleteFollowUpRequest;
import com.bookmycourt.crm.dto.ConvertLeadRequest;
import com.bookmycourt.crm.dto.CreateFollowUpRequest;
import com.bookmycourt.crm.dto.CreateLeadRequest;
import com.bookmycourt.crm.dto.CreateQuoteRequest;
import com.bookmycourt.crm.dto.FollowUpResponse;
import com.bookmycourt.crm.dto.LeadPipelineResponse;
import com.bookmycourt.crm.dto.LeadResponse;
import com.bookmycourt.crm.dto.QuoteLineRequest;
import com.bookmycourt.crm.dto.UpdateLeadStatusRequest;
import com.bookmycourt.crm.entity.FollowUp;
import com.bookmycourt.crm.entity.Lead;
import com.bookmycourt.crm.entity.Quote;
import com.bookmycourt.crm.entity.QuoteLine;
import com.bookmycourt.crm.mapper.CrmMapper;
import com.bookmycourt.crm.repository.FollowUpRepository;
import com.bookmycourt.crm.repository.LeadRepository;
import com.bookmycourt.crm.repository.QuoteRepository;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CrmService {

    private final LeadRepository leads;
    private final FollowUpRepository followUps;
    private final MemberRepository members;
    private final AppUserRepository users;
    private final CrmMapper mapper;
    private final QuoteRepository quotes;
    private final Clock clock;

    @Autowired
    public CrmService(
            LeadRepository leads,
            FollowUpRepository followUps,
            MemberRepository members,
            AppUserRepository users,
            CrmMapper mapper,
            QuoteRepository quotes,
            Clock clock) {
        this.leads = leads;
        this.followUps = followUps;
        this.members = members;
        this.users = users;
        this.mapper = mapper;
        this.quotes = quotes;
        this.clock = clock;
    }

    public CrmService(
            LeadRepository leads,
            FollowUpRepository followUps,
            MemberRepository members,
            AppUserRepository users,
            CrmMapper mapper,
            QuoteRepository quotes) {
        this(leads, followUps, members, users, mapper, quotes, Clock.systemDefaultZone());
    }

    @Transactional
    public LeadResponse createLead(CreateLeadRequest request) {
        String normEmail = request.email() != null ? request.email().trim().toLowerCase(Locale.ROOT) : null;
        String normPhone = request.phone() != null ? request.phone().replaceAll("[^0-9+]", "") : null;

        // Duplicate check on open leads
        if (normEmail != null) {
            leads.findByEmailIgnoreCase(normEmail).ifPresent(existing -> {
                if (!"LOST".equalsIgnoreCase(existing.getStatus()) && !"WON".equalsIgnoreCase(existing.getStatus())) {
                    throw new DomainException(ErrorCode.DUPLICATE, "An active lead with email " + normEmail + " already exists: " + existing.getLeadNumber());
                }
            });
        }

        String maxNum = leads.findMaxLeadNumber();
        int nextId = 1;
        if (maxNum != null && maxNum.startsWith("LEAD-")) {
            try {
                nextId = Integer.parseInt(maxNum.substring(5)) + 1;
            } catch (NumberFormatException ignored) {}
        }

        Lead lead = new Lead();
        lead.setLeadNumber(String.format("LEAD-%05d", nextId));
        lead.setFirstName(request.firstName());
        lead.setLastName(request.lastName());
        lead.setEmail(normEmail != null ? normEmail : request.email());
        lead.setPhone(normPhone != null ? normPhone : request.phone());
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

        String newStatus = request.status().toUpperCase();
        if ("LOST".equalsIgnoreCase(newStatus) && (request.lostReason() == null || request.lostReason().isBlank())) {
            throw new IllegalArgumentException("Lost reason is required when status is LOST");
        }
        if ("WON".equalsIgnoreCase(lead.getStatus()) && !"WON".equalsIgnoreCase(newStatus)) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Cannot change stage of an already-converted WON lead");
        }

        lead.setStatus(newStatus);
        if (request.lostReason() != null) {
            lead.setLostReason(request.lostReason());
        }
        if (request.notes() != null) {
            lead.setNotes(request.notes());
        }
        lead.setLastContactAt(Instant.now(clock));
        leads.save(lead);
        return mapper.toResponse(lead);
    }

    @Transactional
    public LeadResponse convertLead(UUID leadId, ConvertLeadRequest request) {
        Lead lead = leads.findById(leadId).orElseThrow(() -> new NotFoundException("Lead not found"));
        if (lead.getConvertedAt() != null || lead.getMember() != null) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Lead has already been converted");
        }

        Member member = members.findById(request.memberId()).orElseThrow(() -> new NotFoundException("Member not found"));

        lead.setMember(member);
        lead.setStatus("WON");
        lead.setConvertedAt(Instant.now(clock));
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
        f.setCompletedAt(Instant.now(clock));
        if (request.completedByUserId() != null) {
            AppUser u = users.findById(request.completedByUserId()).orElse(null);
            f.setCompletedBy(u);
        }
        if (request.notes() != null) {
            f.setNotes(request.notes());
        }
        followUps.save(f);

        // Recalculate nextFollowUpAt for the lead so stale reminder date is cleared or updated
        Lead lead = f.getLead();
        if (lead != null) {
            Optional<FollowUp> nextDue = followUps.findByLead_IdOrderByDueAtAsc(lead.getId()).stream()
                    .filter(fu -> "OPEN".equalsIgnoreCase(fu.getStatus()) && !fu.getId().equals(followUpId))
                    .findFirst();
            lead.setNextFollowUpAt(nextDue.map(FollowUp::getDueAt).orElse(null));
            leads.save(lead);
        }

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
        Instant now = Instant.now(clock);
        return followUps.findByStatusOrderByDueAtAsc("OPEN").stream()
                .filter(f -> f.getDueAt() != null && f.getDueAt().isBefore(now))
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public LeadPipelineResponse getPipeline() {
        List<Lead> all = leads.findAll();
        long total = all.size();
        long newCount = all.stream().filter(l -> "NEW".equalsIgnoreCase(l.getStatus())).count();
        long contactedCount = all.stream().filter(l -> "CONTACTED".equalsIgnoreCase(l.getStatus())).count();
        long trialCount = all.stream().filter(l -> "TRIAL_BOOKED".equalsIgnoreCase(l.getStatus())).count();
        long negotiationCount = all.stream().filter(l -> "NEGOTIATION".equalsIgnoreCase(l.getStatus())).count();
        long wonCount = all.stream().filter(l -> "WON".equalsIgnoreCase(l.getStatus())).count();
        long lostCount = all.stream().filter(l -> "LOST".equalsIgnoreCase(l.getStatus())).count();

        double conversionRate = total > 0 ? (double) wonCount / total * 100.0 : 0.0;

        Map<String, Long> bySource = all.stream()
                .filter(l -> l.getSource() != null)
                .collect(Collectors.groupingBy(Lead::getSource, Collectors.counting()));

        return new LeadPipelineResponse(
                total,
                newCount,
                contactedCount,
                trialCount,
                negotiationCount,
                wonCount,
                lostCount,
                conversionRate,
                bySource
        );
    }

    @Transactional
    public com.bookmycourt.crm.dto.QuoteResponse createQuote(CreateQuoteRequest request) {
        Lead lead = leads.findById(request.leadId()).orElseThrow(() -> new NotFoundException("Lead not found"));

        Quote q = new Quote();
        q.setLead(lead);
        q.setValidUntil(request.validUntil());
        q.setStatus("DRAFT");
        q.setNotes(request.notes());

        BigDecimal subtotal = BigDecimal.ZERO;
        List<QuoteLine> lineList = new ArrayList<>();

        for (QuoteLineRequest lr : request.lines()) {
            BigDecimal qty = lr.quantity() != null ? lr.quantity() : BigDecimal.ONE;
            BigDecimal price = lr.unitPrice() != null ? lr.unitPrice() : BigDecimal.ZERO;
            BigDecimal taxRate = lr.taxPercent() != null ? lr.taxPercent() : BigDecimal.ZERO;

            BigDecimal base = qty.multiply(price);
            BigDecimal tax = base.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = base.add(tax);

            QuoteLine line = new QuoteLine();
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
        List<Quote> list = (leadId != null)
                ? quotes.findByLead_IdOrderByCreatedAtDesc(leadId)
                : quotes.findAll();
        return list.stream().map(this::toQuoteResponse).toList();
    }

    @Transactional
    public com.bookmycourt.crm.dto.QuoteResponse updateQuoteStatus(UUID quoteId, String status) {
        Quote q = quotes.findById(quoteId)
                .orElseThrow(() -> new NotFoundException("Quote not found: " + quoteId));
        String newStatus = status.toUpperCase();
        if ("ACCEPTED".equalsIgnoreCase(newStatus) && q.getValidUntil().isBefore(LocalDate.now(clock))) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Cannot accept an expired quote");
        }
        q.setStatus(newStatus);
        quotes.save(q);
        return toQuoteResponse(q);
    }

    private com.bookmycourt.crm.dto.QuoteResponse toQuoteResponse(Quote q) {
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
