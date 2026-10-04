package com.bookmycourt.crm.service;

import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.crm.dto.ActivityResponse;
import com.bookmycourt.crm.dto.AssignLeadRequest;
import com.bookmycourt.crm.dto.CompleteFollowUpRequest;
import com.bookmycourt.crm.dto.ConvertLeadRequest;
import com.bookmycourt.crm.dto.ConvertToClientRequest;
import com.bookmycourt.crm.dto.CreateActivityRequest;
import com.bookmycourt.crm.dto.CreateFollowUpRequest;
import com.bookmycourt.crm.dto.CreateLeadRequest;
import com.bookmycourt.crm.dto.FollowUpResponse;
import com.bookmycourt.crm.dto.LeadBoardResponse;
import com.bookmycourt.crm.dto.LeadPipelineResponse;
import com.bookmycourt.crm.dto.LeadPrefillResponse;
import com.bookmycourt.crm.dto.LeadResponse;
import com.bookmycourt.crm.dto.PublicEnquiryRequest;
import com.bookmycourt.crm.dto.TrialBookingLeadRequest;
import com.bookmycourt.crm.dto.UpdateLeadRequest;
import com.bookmycourt.crm.dto.UpdateLeadStatusRequest;
import com.bookmycourt.crm.entity.FollowUp;
import com.bookmycourt.crm.entity.Lead;
import com.bookmycourt.crm.entity.LeadActivity;
import com.bookmycourt.crm.entity.Quote;
import com.bookmycourt.crm.event.CrmEvents;
import com.bookmycourt.crm.exception.CrmException;
import com.bookmycourt.crm.mapper.CrmMapper;
import com.bookmycourt.crm.model.CrmEnums.ActivityType;
import com.bookmycourt.crm.model.CrmEnums.FollowUpStatus;
import com.bookmycourt.crm.model.CrmEnums.LeadInterest;
import com.bookmycourt.crm.model.CrmEnums.LeadSource;
import com.bookmycourt.crm.model.CrmEnums.LeadStatus;
import com.bookmycourt.crm.repository.FollowUpRepository;
import com.bookmycourt.crm.repository.LeadActivityRepository;
import com.bookmycourt.crm.repository.LeadRepository;
import com.bookmycourt.crm.repository.QuoteRepository;
import com.bookmycourt.crm.spi.BusinessClientGateway;
import com.bookmycourt.crm.spi.LeadAssigneeProvider;
import com.bookmycourt.crm.spi.MemberLookupPort;
import com.bookmycourt.crm.util.ContactNormalizer;
import com.bookmycourt.crm.util.CrmClock;
import com.bookmycourt.crm.util.CrmLocks;
import com.bookmycourt.crm.util.EnquiryRateLimiter;
import com.bookmycourt.crm.util.LeadNumberGenerator;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.UUID;

/**
 * CRM use-cases: leads, public enquiry, trial-booking link, activity timeline, follow-ups, conversion, pipeline.
 * Events are published INSIDE the transaction; subscribers use @TransactionalEventListener(AFTER_COMMIT).
 */
@Service
public class CrmService {

    private static final Logger log = LoggerFactory.getLogger(CrmService.class);

    private final LeadRepository leads;
    private final FollowUpRepository followUps;
    private final QuoteRepository quotes;
    private final LeadActivityRepository activities;
    private final AppUserRepository users;
    private final CrmMapper mapper;
    private final CrmClock clock;
    private final LeadNumberGenerator numbers;
    private final LeadActivityLogger activityLogger;
    private final CrmLocks locks;
    private final EnquiryRateLimiter limiter;
    private final ApplicationEventPublisher events;
    private final TransactionTemplate tx;
    private final ObjectProvider<LeadAssigneeProvider> assignees;
    private final ObjectProvider<MemberLookupPort> memberLookup;
    private final ObjectProvider<BusinessClientGateway> clientGateway;

    @PersistenceContext
    private EntityManager em;

    public CrmService(LeadRepository leads,
                      FollowUpRepository followUps,
                      QuoteRepository quotes,
                      LeadActivityRepository activities,
                      AppUserRepository users,
                      CrmMapper mapper,
                      CrmClock clock,
                      LeadNumberGenerator numbers,
                      LeadActivityLogger activityLogger,
                      CrmLocks locks,
                      EnquiryRateLimiter limiter,
                      ApplicationEventPublisher events,
                      PlatformTransactionManager txManager,
                      ObjectProvider<LeadAssigneeProvider> assignees,
                      ObjectProvider<MemberLookupPort> memberLookup,
                      ObjectProvider<BusinessClientGateway> clientGateway) {
        this.leads = leads;
        this.followUps = followUps;
        this.quotes = quotes;
        this.activities = activities;
        this.users = users;
        this.mapper = mapper;
        this.clock = clock;
        this.numbers = numbers;
        this.activityLogger = activityLogger;
        this.locks = locks;
        this.limiter = limiter;
        this.events = events;
        this.tx = new TransactionTemplate(txManager);
        this.assignees = assignees;
        this.memberLookup = memberLookup;
        this.clientGateway = clientGateway;
    }

    // =====================================================================================
    // LEADS
    // =====================================================================================

    /** Staff-created lead (walk-in, phone, referral...). */
    @Transactional
    public LeadResponse createLead(CreateLeadRequest r) {
        LeadSource source = LeadSource.parse(r.source());
        requireContact(r.email(), r.phone());
        String phoneN = ContactNormalizer.phone(r.phone());
        String emailN = ContactNormalizer.email(r.email());
        if (!Boolean.TRUE.equals(r.allowDuplicate())) {
            Optional<Lead> dup = findOpenDuplicate(phoneN, emailN);
            if (dup.isPresent()) {
                throw CrmException.conflict("DUPLICATE_LEAD",
                        "An open lead already exists for this contact: " + dup.get().getLeadNumber());
            }
        }
        Lead lead = newLead(r.firstName(), r.lastName(), r.email(), r.phone(), source,
                r.interest(), r.companyName(), r.notes());
        lead.setAssignedTo(resolveAssignee(r.assignedToUserId()));
        leads.save(lead);
        activityLogger.log(lead, ActivityType.SYSTEM, "Lead created (" + source.name() + ")", null, null);
        publishCreated(lead, false);
        return mapper.toResponse(lead);
    }

    /** WEB-07: public enquiry. Honeypot and rate limit first; persist before anything else can fail. */
    @Transactional
    public EnquiryResult createPublicEnquiry(PublicEnquiryRequest r, String clientIp) {
        if (r.website() != null && !r.website().isBlank()) {
            return new EnquiryResult(false, null);          // bot: pretend success, store nothing
        }
        if (!limiter.tryAcquire(clientIp)) {
            throw CrmException.tooManyRequests("Too many enquiries from this address. Please try again in a minute.");
        }
        requireContact(r.email(), r.phone());

        String name = r.name().trim();
        String first = name;
        String last = null;
        int space = name.indexOf(' ');
        if (space > 0) {
            first = name.substring(0, space);
            last = name.substring(space + 1).trim();
            if (last.isEmpty()) {
                last = null;
            }
        }
        String phoneN = ContactNormalizer.phone(r.phone());
        String emailN = ContactNormalizer.email(r.email());
        LeadInterest interest = LeadInterest.lenient(r.interest());
        String message = r.message() == null ? "" : r.message().trim();

        Optional<Lead> dup = findOpenDuplicate(phoneN, emailN);
        if (dup.isPresent()) {
            Lead existing = dup.get();                       // never lose a repeat enquiry: add it to the timeline
            activityLogger.log(existing, ActivityType.ENQUIRY, "Repeat enquiry: " + message, null, null);
            publishCreated(existing, true);
            return new EnquiryResult(true, existing.getLeadNumber());
        }

        Lead lead = newLead(first, last, r.email(), r.phone(), LeadSource.WEBSITE,
                interest == null ? null : interest.name(), null, message);
        lead.setAssignedTo(resolveAssignee(null));
        leads.save(lead);
        activityLogger.log(lead, ActivityType.ENQUIRY, "Website enquiry: " + message, null, null);
        publishCreated(lead, false);
        return new EnquiryResult(true, lead.getLeadNumber());
    }

    /** BKG-24: a website trial booking creates (or upgrades) a lead. Called by the booking module. */
    @Transactional
    public LeadResponse linkTrialBooking(TrialBookingLeadRequest r) {
        Optional<Lead> byBooking = leads.findByTrialBookingId(r.bookingId());
        if (byBooking.isPresent()) {
            return mapper.toResponse(byBooking.get());       // idempotent
        }
        requireContact(r.email(), r.phone());
        Optional<Lead> dup = findOpenDuplicate(ContactNormalizer.phone(r.phone()), ContactNormalizer.email(r.email()));
        Lead lead;
        boolean repeat = dup.isPresent();
        if (repeat) {
            lead = dup.get();
        } else {
            lead = newLead(r.firstName(), r.lastName(), r.email(), r.phone(), LeadSource.TRIAL_BOOKING,
                    LeadInterest.TRIAL.name(), null, null);
            lead.setAssignedTo(resolveAssignee(null));
            leads.save(lead);
        }
        lead.setTrialBookingId(r.bookingId());
        LeadStatus from = LeadStatus.fromStored(lead.getStatus());
        if (from != LeadStatus.TRIAL_BOOKED && from.canMoveTo(LeadStatus.TRIAL_BOOKED)) {
            lead.setStatus(LeadStatus.TRIAL_BOOKED.name());
            events.publishEvent(new CrmEvents.LeadStatusChanged(lead.getId(), lead.getLeadNumber(),
                    from.name(), LeadStatus.TRIAL_BOOKED.name(), null, clock.now()));
        }
        leads.save(lead);
        activityLogger.log(lead, ActivityType.SYSTEM, "Trial session booked (booking " + r.bookingId() + ")", null, null);
        publishCreated(lead, repeat);
        return mapper.toResponse(lead);
    }

    @Transactional(readOnly = true)
    public LeadResponse getLead(UUID id) {
        return mapper.toResponse(require(id));
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> listLeads(String status, String source, UUID assignedToUserId, String q) {
        List<Lead> base = (status != null && !status.isBlank())
                ? leads.findByStatusOrderByCreatedAtDesc(LeadStatus.parse(status).name())
                : leads.findByOrderByCreatedAtDesc();
        String needle = (q == null || q.isBlank()) ? null : q.trim().toLowerCase(Locale.ROOT);
        String digits = needle == null ? null : ContactNormalizer.phone(needle);
        return base.stream()
                .filter(l -> source == null || source.isBlank() || source.equalsIgnoreCase(l.getSource()))
                .filter(l -> assignedToUserId == null
                        || (l.getAssignedTo() != null && assignedToUserId.equals(l.getAssignedTo().getId())))
                .filter(l -> needle == null || matches(l, needle, digits))
                .map(mapper::toResponse)
                .toList();
    }

    /** CRM-02 Kanban view. */
    @Transactional(readOnly = true)
    public LeadBoardResponse board() {
        Map<String, List<LeadResponse>> columns = new LinkedHashMap<>();
        for (LeadStatus s : LeadStatus.values()) {
            columns.put(s.name(), new ArrayList<>());
        }
        for (Lead l : leads.findByOrderByCreatedAtDesc()) {
            columns.get(LeadStatus.fromStored(l.getStatus()).name()).add(mapper.toResponse(l));
        }
        Map<String, Long> counts = new LinkedHashMap<>();
        columns.forEach((k, v) -> counts.put(k, (long) v.size()));
        return new LeadBoardResponse(columns, counts);
    }

    @Transactional
    public LeadResponse updateLead(UUID id, UpdateLeadRequest r) {
        Lead lead = require(id);
        if (r.firstName() != null && !r.firstName().isBlank()) {
            lead.setFirstName(r.firstName().trim());
        }
        if (r.lastName() != null) {
            lead.setLastName(blankToNull(r.lastName()));
        }
        if (r.email() != null) {
            lead.setEmail(blankToNull(r.email()));
            lead.setEmailNormalized(ContactNormalizer.email(r.email()));
        }
        if (r.phone() != null) {
            lead.setPhone(blankToNull(r.phone()));
            lead.setPhoneNormalized(ContactNormalizer.phone(r.phone()));
        }
        if (r.interest() != null) {
            LeadInterest in = LeadInterest.lenient(r.interest());
            lead.setInterest(in == null ? null : in.name());
        }
        if (r.companyName() != null) {
            lead.setCompanyName(blankToNull(r.companyName()));
        }
        if (r.notes() != null) {
            lead.setNotes(blankToNull(r.notes()));
        }
        requireContact(lead.getEmail(), lead.getPhone());
        leads.save(lead);
        return mapper.toResponse(lead);
    }

    @Transactional
    public LeadResponse assignLead(UUID id, AssignLeadRequest r) {
        Lead lead = require(id);
        AppUser user = findUser(r.assignedToUserId());
        lead.setAssignedTo(user);
        leads.save(lead);
        activityLogger.log(lead, ActivityType.SYSTEM, "Assigned to " + displayName(user.getFirstName(), user.getLastName()), null, null);
        return mapper.toResponse(lead);
    }

    /** CRM-02: pipeline transitions. WON is reachable only through convertLead. */
    @Transactional
    public LeadResponse updateStatus(UUID id, UpdateLeadStatusRequest r) {
        Lead lead = require(id);
        LeadStatus from = LeadStatus.fromStored(lead.getStatus());
        LeadStatus to = LeadStatus.parse(r.status());
        if (to == LeadStatus.WON) {
            throw CrmException.unprocessable("USE_CONVERT",
                    "A lead becomes WON only by converting it to a member (POST /api/crm/leads/{id}/convert)");
        }
        if (from == to) {
            return mapper.toResponse(lead);
        }
        if (!from.canMoveTo(to)) {
            throw CrmException.conflict("INVALID_STATE", "Lead cannot move from " + from + " to " + to);
        }
        if (to == LeadStatus.LOST && (r.lostReason() == null || r.lostReason().isBlank())) {
            throw CrmException.badRequest("LOST_REASON_REQUIRED", "A lost reason is required");
        }
        lead.setStatus(to.name());
        lead.setLostReason(to == LeadStatus.LOST ? r.lostReason().trim() : null);
        if (to == LeadStatus.CONTACTED) {
            activityLogger.recordContact(lead);
        }
        leads.save(lead);
        String note = from + " -> " + to + (r.notes() == null || r.notes().isBlank() ? "" : ": " + r.notes().trim());
        activityLogger.log(lead, ActivityType.STATUS_CHANGE, note, null, null);
        events.publishEvent(new CrmEvents.LeadStatusChanged(lead.getId(), lead.getLeadNumber(),
                from.name(), to.name(), lead.getLostReason(), clock.now()));
        return mapper.toResponse(lead);
    }

    // =====================================================================================
    // ACTIVITY TIMELINE (CRM-03)
    // =====================================================================================

    @Transactional
    public ActivityResponse addActivity(UUID leadId, CreateActivityRequest r) {
        Lead lead = require(leadId);
        ActivityType type = ActivityType.parse(r.type());
        if (!type.isManual()) {
            throw CrmException.badRequest("VALIDATION_FAILED",
                    "Type must be one of NOTE, CALL, EMAIL, WHATSAPP, MEETING");
        }
        AppUser by = r.createdByUserId() == null ? null : findUser(r.createdByUserId());
        LeadActivity a = activityLogger.log(lead, type, r.note().trim(), by, r.occurredAt());
        if (type.isOutreach()) {
            activityLogger.recordContact(lead);
            LeadStatus from = LeadStatus.fromStored(lead.getStatus());
            if (from == LeadStatus.NEW) {                     // first outreach moves NEW -> CONTACTED
                lead.setStatus(LeadStatus.CONTACTED.name());
                activityLogger.log(lead, ActivityType.STATUS_CHANGE, "NEW -> CONTACTED (first contact)", by, null);
                events.publishEvent(new CrmEvents.LeadStatusChanged(lead.getId(), lead.getLeadNumber(),
                        LeadStatus.NEW.name(), LeadStatus.CONTACTED.name(), null, clock.now()));
            }
            leads.save(lead);
        }
        return mapper.toResponse(a);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> listActivities(UUID leadId) {
        require(leadId);
        return activities.findByLead_IdOrderByOccurredAtDesc(leadId).stream().map(mapper::toResponse).toList();
    }

    // =====================================================================================
    // CONVERSION (CRM-06, CRM-07)
    // =====================================================================================

    /** Data to pre-fill the registration form (MEM-01) before converting. */
    @Transactional(readOnly = true)
    public LeadPrefillResponse prefill(UUID id) {
        Lead l = require(id);
        UUID existing = l.getMember() == null ? null : l.getMember().getId();
        if (existing == null) {
            MemberLookupPort port = memberLookup.getIfAvailable();
            if (port != null) {
                existing = port.findMemberId(l.getPhoneNormalized(), l.getEmailNormalized()).orElse(null);
            }
        }
        return new LeadPrefillResponse(l.getId(), l.getLeadNumber(), l.getFirstName(), l.getLastName(),
                l.getEmail(), l.getPhone(), l.getNotes(), l.getInterest(), l.getCompanyName(), existing);
    }

    /** Links the lead to a member and marks it WON. Serialised per lead; commit happens inside the lock. */
    public LeadResponse convertLead(UUID leadId, ConvertLeadRequest r) {
        return locks.run(leadId, () -> tx.execute(status -> doConvert(leadId, r)));
    }

    private LeadResponse doConvert(UUID leadId, ConvertLeadRequest r) {
        Lead lead = require(leadId);
        Member member = em.find(Member.class, r.memberId());
        if (member == null) {
            throw new NotFoundException("Member not found");
        }
        LeadStatus from = LeadStatus.fromStored(lead.getStatus());
        if (from == LeadStatus.WON) {
            if (lead.getMember() != null && lead.getMember().getId().equals(member.getId())) {
                return mapper.toResponse(lead);               // already converted to this member: idempotent
            }
            throw CrmException.conflict("ALREADY_CONVERTED", "Lead was already converted to another member");
        }
        if (from == LeadStatus.LOST) {
            throw CrmException.conflict("LEAD_LOST", "Re-open the lead (set status CONTACTED) before converting it");
        }
        lead.setMember(member);
        lead.setStatus(LeadStatus.WON.name());
        lead.setConvertedAt(clock.now());
        lead.setLostReason(null);
        lead.setNextFollowUpAt(null);
        leads.save(lead);
        activityLogger.log(lead, ActivityType.CONVERSION, "Converted to member "
                + displayName(member.getFirstName(), member.getLastName()), null, null);
        events.publishEvent(new CrmEvents.LeadStatusChanged(lead.getId(), lead.getLeadNumber(),
                from.name(), LeadStatus.WON.name(), null, clock.now()));
        events.publishEvent(new CrmEvents.LeadConverted(lead.getId(), lead.getLeadNumber(), member.getId(), clock.now()));
        return mapper.toResponse(lead);
    }

    /** CRM-07: corporate lead -> Business Client (finance module, via port). */
    @Transactional
    public LeadResponse convertToBusinessClient(UUID id, ConvertToClientRequest r) {
        Lead lead = require(id);
        if (lead.getBusinessClientId() != null) {
            return mapper.toResponse(lead);                   // idempotent
        }
        BusinessClientGateway gateway = clientGateway.getIfAvailable();
        if (gateway == null) {
            throw CrmException.notImplemented("BUSINESS_CLIENT_MODULE_MISSING",
                    "Business client module is not wired yet (implement BusinessClientGateway in the finance module)");
        }
        String company = firstNonBlank(r == null ? null : r.companyName(), lead.getCompanyName());
        if (company == null) {
            throw CrmException.badRequest("VALIDATION_FAILED", "Company name is required");
        }
        UUID clientId = gateway.createFromLead(new BusinessClientGateway.Draft(
                lead.getId(), company, r == null ? null : r.gstin(), r == null ? null : r.billingAddress(),
                displayName(lead.getFirstName(), lead.getLastName()), lead.getEmail(), lead.getPhone()));
        lead.setBusinessClientId(clientId);
        lead.setCompanyName(company);
        lead.setInterest(LeadInterest.CORPORATE.name());
        leads.save(lead);
        activityLogger.log(lead, ActivityType.CONVERSION, "Converted to business client " + company, null, null);
        return mapper.toResponse(lead);
    }

    // =====================================================================================
    // FOLLOW-UPS (CRM-04)
    // =====================================================================================

    @Transactional
    public FollowUpResponse createFollowUp(CreateFollowUpRequest r) {
        Lead lead = require(r.leadId());
        if (LeadStatus.fromStored(lead.getStatus()).isClosed()) {
            throw CrmException.conflict("LEAD_CLOSED", "Cannot schedule a follow-up on a closed lead");
        }
        FollowUp f = new FollowUp();
        f.setLead(lead);
        f.setDueAt(r.dueAt());
        f.setSubject(r.subject().trim());
        f.setNotes(blankToNull(r.notes()));
        f.setStatus(FollowUpStatus.OPEN.name());
        f.setAssignedTo(r.assignedToUserId() != null ? findUser(r.assignedToUserId()) : lead.getAssignedTo());
        followUps.save(f);
        recomputeNextFollowUp(lead);
        activityLogger.log(lead, ActivityType.FOLLOW_UP, "Scheduled: " + f.getSubject(), null, null);
        return mapper.toResponse(f);
    }

    @Transactional
    public FollowUpResponse completeFollowUp(UUID id, CompleteFollowUpRequest r) {
        FollowUp f = followUps.findById(id).orElseThrow(() -> new NotFoundException("Follow-up not found"));
        if (FollowUpStatus.COMPLETED.name().equals(f.getStatus())) {
            return mapper.toResponse(f);                      // idempotent
        }
        AppUser by = (r == null || r.completedByUserId() == null) ? null : findUser(r.completedByUserId());
        f.setStatus(FollowUpStatus.COMPLETED.name());
        f.setCompletedAt(clock.now());
        f.setCompletedBy(by);
        if (r != null && r.notes() != null && !r.notes().isBlank()) {
            f.setNotes(f.getNotes() == null ? r.notes().trim() : f.getNotes() + "\n" + r.notes().trim());
        }
        followUps.save(f);
        Lead lead = f.getLead();
        activityLogger.recordContact(lead);
        recomputeNextFollowUp(lead);
        activityLogger.log(lead, ActivityType.FOLLOW_UP, "Completed: " + f.getSubject(), by, null);
        return mapper.toResponse(f);
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> listFollowUps(UUID leadId, String status) {
        List<FollowUp> list;
        if (leadId != null) {
            list = followUps.findByLead_IdOrderByDueAtAsc(leadId);
        } else if (status != null && !status.isBlank()) {
            list = followUps.findByStatusOrderByDueAtAsc(status.trim().toUpperCase(Locale.ROOT));
        } else {
            list = followUps.findAll(Sort.by("dueAt").ascending());
        }
        return list.stream()
                .filter(f -> status == null || status.isBlank() || status.equalsIgnoreCase(f.getStatus()))
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getOverdueFollowUps() {
        return followUps.findByStatusAndDueAtBeforeOrderByDueAtAsc(FollowUpStatus.OPEN.name(), clock.now()).stream()
                .filter(f -> !LeadStatus.fromStored(f.getLead().getStatus()).isClosed())
                .map(mapper::toResponse)
                .toList();
    }

    /** Job: publish FollowUpOverdue once per overdue task (idempotent through overdue_notified_at). */
    @Transactional
    public int publishOverdueFollowUpEvents() {
        Instant now = clock.now();
        int count = 0;
        for (FollowUp f : followUps.findByStatusAndDueAtBeforeOrderByDueAtAsc(FollowUpStatus.OPEN.name(), now)) {
            if (f.getOverdueNotifiedAt() != null) {
                continue;
            }
            Lead lead = f.getLead();
            if (LeadStatus.fromStored(lead.getStatus()).isClosed()) {
                continue;
            }
            f.setOverdueNotifiedAt(now);
            followUps.save(f);
            AppUser owner = f.getAssignedTo() != null ? f.getAssignedTo() : lead.getAssignedTo();
            events.publishEvent(new CrmEvents.FollowUpOverdue(f.getId(), lead.getId(),
                    displayName(lead.getFirstName(), lead.getLastName()),
                    owner == null ? null : owner.getId(), f.getSubject(), f.getDueAt(), now));
            count++;
        }
        return count;
    }

    // =====================================================================================
    // PIPELINE KPIs (CRM-08)
    // =====================================================================================

    @Transactional(readOnly = true)
    public LeadPipelineResponse getPipeline() {
        List<Lead> all = leads.findAll();
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (LeadStatus s : LeadStatus.values()) {
            byStatus.put(s.name(), 0L);
        }
        Map<String, Long> bySource = new TreeMap<>();
        long minutesSum = 0;
        long minutesCount = 0;
        for (Lead l : all) {
            byStatus.merge(LeadStatus.fromStored(l.getStatus()).name(), 1L, Long::sum);
            bySource.merge(l.getSource() == null ? "UNKNOWN" : l.getSource(), 1L, Long::sum);
            if (l.getFirstContactAt() != null && l.getCreatedAt() != null) {
                long m = Duration.between(l.getCreatedAt(), l.getFirstContactAt()).toMinutes();
                if (m >= 0) {
                    minutesSum += m;
                    minutesCount++;
                }
            }
        }
        long total = all.size();
        long won = byStatus.get("WON");
        long lost = byStatus.get("LOST");
        double conversion = total == 0 ? 0 : round2(won * 100.0 / total);
        double closeRate = (won + lost) == 0 ? 0 : round2(won * 100.0 / (won + lost));
        Double avgResponse = minutesCount == 0 ? null : round2((double) minutesSum / minutesCount);

        BigDecimal revenueWon = BigDecimal.ZERO;
        for (Quote q : quotes.findByStatusOrderByCreatedAtDesc("ACCEPTED")) {
            if (LeadStatus.fromStored(q.getLead().getStatus()) == LeadStatus.WON) {
                revenueWon = revenueWon.add(q.getTotal());
            }
        }
        BigDecimal pipelineValue = BigDecimal.ZERO;
        for (Quote q : quotes.findByStatusOrderByCreatedAtDesc("SENT")) {
            if (!LeadStatus.fromStored(q.getLead().getStatus()).isClosed()) {
                pipelineValue = pipelineValue.add(q.getTotal());
            }
        }
        Instant now = clock.now();
        List<FollowUp> open = followUps.findByStatusOrderByDueAtAsc(FollowUpStatus.OPEN.name());
        long overdue = open.stream().filter(f -> f.getDueAt().isBefore(now)).count();

        return new LeadPipelineResponse(total, byStatus.get("NEW"), byStatus.get("CONTACTED"),
                byStatus.get("QUOTE_SENT"), byStatus.get("TRIAL_BOOKED"), won, lost, conversion, bySource,
                closeRate, avgResponse, revenueWon, pipelineValue, open.size(), overdue, byStatus);
    }

    // =====================================================================================
    // MAINTENANCE
    // =====================================================================================

    /** Fills phone_normalized / email_normalized on legacy rows so duplicate detection covers them. */
    @Transactional
    public int backfillNormalizedContacts() {
        int changed = 0;
        for (Lead l : leads.findAll()) {
            boolean dirty = false;
            if (l.getPhoneNormalized() == null && l.getPhone() != null) {
                l.setPhoneNormalized(ContactNormalizer.phone(l.getPhone()));
                dirty = l.getPhoneNormalized() != null;
            }
            if (l.getEmailNormalized() == null && l.getEmail() != null) {
                l.setEmailNormalized(ContactNormalizer.email(l.getEmail()));
                dirty = dirty || l.getEmailNormalized() != null;
            }
            if (dirty) {
                leads.save(l);
                changed++;
            }
        }
        return changed;
    }

    // =====================================================================================
    // helpers
    // =====================================================================================

    public record EnquiryResult(boolean accepted, String reference) {
    }

    private Lead require(UUID id) {
        return leads.findById(id).orElseThrow(() -> new NotFoundException("Lead not found"));
    }

    private AppUser findUser(UUID id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
    }

    private AppUser resolveAssignee(UUID requested) {
        if (requested != null) {
            return findUser(requested);
        }
        LeadAssigneeProvider provider = assignees.getIfAvailable();
        if (provider == null) {
            return null;
        }
        return provider.nextAssigneeUserId().flatMap(users::findById).orElse(null);
    }

    private Lead newLead(String firstName, String lastName, String email, String phone, LeadSource source,
                         String interest, String companyName, String notes) {
        Lead l = new Lead();
        l.setLeadNumber(numbers.next());
        l.setFirstName(firstName.trim());
        l.setLastName(blankToNull(lastName));
        l.setEmail(blankToNull(email));
        l.setPhone(blankToNull(phone));
        l.setPhoneNormalized(ContactNormalizer.phone(phone));
        l.setEmailNormalized(ContactNormalizer.email(email));
        l.setSource(source.name());
        l.setStatus(LeadStatus.NEW.name());
        LeadInterest in = LeadInterest.lenient(interest);
        l.setInterest(in == null ? null : in.name());
        l.setCompanyName(blankToNull(companyName));
        l.setNotes(blankToNull(notes));
        return l;
    }

    private Optional<Lead> findOpenDuplicate(String phoneNormalized, String emailNormalized) {
        List<Lead> candidates = new ArrayList<>();
        if (phoneNormalized != null) {
            candidates.addAll(leads.findByPhoneNormalized(phoneNormalized));
        }
        if (emailNormalized != null) {
            candidates.addAll(leads.findByEmailNormalized(emailNormalized));
        }
        return candidates.stream()
                .filter(l -> !LeadStatus.fromStored(l.getStatus()).isClosed())
                .max(Comparator.comparing(Lead::getCreatedAt, Comparator.nullsFirst(Comparator.naturalOrder())));
    }

    private void publishCreated(Lead l, boolean repeat) {
        events.publishEvent(new CrmEvents.LeadCreated(l.getId(), l.getLeadNumber(),
                displayName(l.getFirstName(), l.getLastName()), l.getEmail(), l.getPhone(), l.getSource(),
                l.getInterest(), l.getAssignedTo() == null ? null : l.getAssignedTo().getId(), repeat, clock.now()));
    }

    private void recomputeNextFollowUp(Lead lead) {
        Instant next = followUps.findByLead_IdAndStatus(lead.getId(), FollowUpStatus.OPEN.name()).stream()
                .map(FollowUp::getDueAt)
                .min(Comparator.naturalOrder())
                .orElse(null);
        lead.setNextFollowUpAt(next);
        leads.save(lead);
    }

    private static boolean matches(Lead l, String needle, String digits) {
        return contains(l.getLeadNumber(), needle)
                || contains(l.getFirstName(), needle)
                || contains(l.getLastName(), needle)
                || contains(l.getEmail(), needle)
                || contains(l.getCompanyName(), needle)
                || (digits != null && !digits.isEmpty() && l.getPhoneNormalized() != null
                && l.getPhoneNormalized().contains(digits));
    }

    private static boolean contains(String value, String needle) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(needle);
    }

    private static void requireContact(String email, String phone) {
        boolean hasEmail = email != null && !email.isBlank();
        boolean hasPhone = phone != null && !phone.isBlank() && ContactNormalizer.phone(phone) != null;
        if (!hasEmail && !hasPhone) {
            throw CrmException.badRequest("CONTACT_REQUIRED", "Provide at least an e-mail or a phone number");
        }
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static String firstNonBlank(String a, String b) {
        return blankToNull(a) != null ? a.trim() : blankToNull(b);
    }

    private static String displayName(String first, String last) {
        return ((first == null ? "" : first) + " " + (last == null ? "" : last)).trim();
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}