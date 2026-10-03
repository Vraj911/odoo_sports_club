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

    public CrmService(
            LeadRepository leads,
            FollowUpRepository followUps,
            MemberRepository members,
            AppUserRepository users,
            CrmMapper mapper) {
        this.leads = leads;
        this.followUps = followUps;
        this.members = members;
        this.users = users;
        this.mapper = mapper;
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
}
