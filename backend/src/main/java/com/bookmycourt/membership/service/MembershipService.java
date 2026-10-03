package com.bookmycourt.membership.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.common.audit.AuditService;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.Events;
import com.bookmycourt.common.event.events.MembershipEvents.MembershipPurchased;
import com.bookmycourt.common.event.events.MembershipEvents.MembershipRenewed;
import com.bookmycourt.common.event.events.MembershipEvents.MembershipTierChanged;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.finance.dto.CreateInvoiceRequest;
import com.bookmycourt.finance.dto.InvoiceLineRequest;
import com.bookmycourt.finance.dto.InvoiceResponse;
import com.bookmycourt.finance.dto.RecordInvoicePaymentRequest;
import com.bookmycourt.finance.service.FinanceService;
import com.bookmycourt.membership.dto.MembershipResponse;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.mapper.MemberMapper;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.membership.repository.PlanRepository;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MembershipService {

    private static final List<String> LIVE = List.of("ACTIVE", "EXPIRING_SOON");
    /**
     * Statuses that "hold" a date range, so a second membership cannot be
     * stacked on top.
     */
    private static final List<String> BLOCKING = List.of("PENDING_PAYMENT", "ACTIVE", "EXPIRING_SOON", "SUSPENDED");

    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final PlanRepository plans;
    private final MemberMapper mapper;
    private final AuditService auditService;
    private final DomainEventPublisher eventPublisher;
    private final ClubSettingRepository settings;
    private final FinanceService finance;
    private final JdbcClient jdbc;
    private final Clock clock;

    public MembershipService(
            MemberRepository members,
            MembershipRepository memberships,
            PlanRepository plans,
            MemberMapper mapper,
            AuditService auditService,
            DomainEventPublisher eventPublisher,
            ClubSettingRepository settings,
            FinanceService finance,
            JdbcClient jdbc,
            Clock clock) {
        this.members = members;
        this.memberships = memberships;
        this.plans = plans;
        this.mapper = mapper;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
        this.settings = settings;
        this.finance = finance;
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public record PurchaseRequest(
            UUID memberId,
            UUID planId,
            LocalDate startDate,
            String paymentPolicy
            ) {

    }

    // =====================================================================
    // Helpers
    // =====================================================================
    private LocalDate today() {
        return LocalDate.now(clock.withZone(ClubTime.IST));
    }

    private int intSetting(String key, int def) {
        return settings.findByKey(key).map(s -> {
            try {
                return Integer.parseInt(s.getValue().trim());
            } catch (Exception e) {
                return def;
            }
        }).orElse(def);
    }

    private BigDecimal decimalSetting(String key, BigDecimal def) {
        return settings.findByKey(key).map(s -> {
            try {
                return new BigDecimal(s.getValue().trim());
            } catch (Exception e) {
                return def;
            }
        }).orElse(def);
    }

    /**
     * Serialises membership changes per member, so two simultaneous purchases
     * cannot both pass the overlap check.
     */
    private void lockMember(UUID memberId) {
        jdbc.sql("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))")
                .param("k", "membership:" + memberId)
                .query()
                .listOfRows();
    }

    private Member requireActiveMember(UUID id) {
        Member m = members.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Member not found: " + id));
        if (!m.isActive()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Member account is deactivated");
        }
        return m;
    }

    private Plan requireActivePlan(UUID id) {
        if (id == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "planId is required");
        }
        Plan p = plans.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Plan not found: " + id));
        if (!p.isActive()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Plan " + p.getName() + " is no longer offered");
        }
        return p;
    }

    /**
     * MEM-05 / BR-15: Junior is for under-18s only, on purchase, renewal and
     * plan change.
     */
    private void validateEligibility(Member member, Plan plan, LocalDate start) {
        if ("JUNIOR".equalsIgnoreCase(plan.getName())) {
            if (member.getDateOfBirth() == null) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Date of birth is required for the Junior plan");
            }
            if (Period.between(member.getDateOfBirth(), start).getYears() >= 18) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Junior plan is restricted to members under 18 years old");
            }
        }
    }

    private void assertNoOverlap(UUID memberId, LocalDate start, LocalDate end) {
        memberships.findByMember_IdOrderByStartDateDesc(memberId).stream()
                .filter(x -> BLOCKING.contains(x.getStatus().toUpperCase()))
                .filter(x -> !start.isAfter(x.getEndDate()) && !end.isBefore(x.getStartDate()))
                .findFirst()
                .ifPresent(x -> {
                    String msg = "PENDING_PAYMENT".equalsIgnoreCase(x.getStatus())
                            ? "Member already has an unpaid membership for this period. Pay or cancel it first"
                            : "Member already has a " + x.getStatus() + " membership (" + x.getStartDate() + " to "
                            + x.getEndDate() + ") covering this period";
                    throw new DomainException(ErrorCode.INVALID_STATE, msg);
                });
    }

    private String statusFor(LocalDate endDate) {
        long left = ChronoUnit.DAYS.between(today(), endDate);
        return left <= intSetting("membership.expiring_soon_days", 15) ? "EXPIRING_SOON" : "ACTIVE";
    }

    private Membership newPending(Member member, Plan plan, LocalDate start, LocalDate end, UUID previousId, BigDecimal due) {
        Membership m = new Membership();
        m.setMember(member);
        m.setPlan(plan);
        m.setPreviousMembershipId(previousId);
        m.setStartDate(start);
        m.setEndDate(end);
        m.setStatus("PENDING_PAYMENT");
        m.setPaymentStatus("UNPAID");
        m.setPaymentPolicy("PAY_NOW");
        m.setPricePaid(due); // amount DUE until it is paid
        return memberships.save(m);
    }

    /**
     * Moves a PENDING_PAYMENT membership to ACTIVE. When it replaces a running
     * membership (plan change) the old term is cut at the new start date. Money
     * is never taken here, so call it only once payment is confirmed.
     */
    private void activate(Membership m) {
        LocalDate today = today();
        Membership prev = m.getPreviousMembershipId() == null ? null
                : memberships.findById(m.getPreviousMembershipId()).orElse(null);

        boolean replaced = false;
        if (prev != null && LIVE.contains(prev.getStatus().toUpperCase()) && !prev.getEndDate().isBefore(m.getStartDate())) {
            replaced = true;
            if (!prev.getStartDate().isBefore(m.getStartDate())) {
                prev.setStatus("CANCELLED");
                prev.setCancellationReason("Replaced by plan change");
            } else {
                prev.setEndDate(m.getStartDate().minusDays(1));
                if (prev.getEndDate().isBefore(today)) {
                    prev.setStatus("EXPIRED");
                }
            }
            memberships.save(prev);
        }

        m.setStatus(statusFor(m.getEndDate()));
        m.setPaymentStatus("PAID");
        memberships.save(m);

        if (replaced) {
            eventPublisher.publish(new MembershipTierChanged(
                    Events.nextId(), Events.now(clock), m.getMember().getId(),
                    prev.getPlan().getName(), m.getPlan().getName(), m.getStartDate()));
        }
    }

    // =====================================================================
    // Purchase / renew / change plan  (all start PENDING_PAYMENT; nothing is free)
    // =====================================================================
    @Transactional
    public MembershipResponse purchase(PurchaseRequest req) {
        Member member = requireActiveMember(req.memberId());
        Plan plan = requireActivePlan(req.planId());
        LocalDate start = req.startDate() != null ? req.startDate() : today();
        if (start.isBefore(today())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Start date cannot be in the past");
        }

        lockMember(member.getId());
        validateEligibility(member, plan, start);
        LocalDate end = start.plusDays(plan.getValidityDays() - 1L);
        assertNoOverlap(member.getId(), start, end);

        BigDecimal price = plan.getPrice() != null ? plan.getPrice() : BigDecimal.ZERO;
        Membership m = newPending(member, plan, start, end, null, price);
        if (price.signum() == 0) {
            activate(m);
        }

        eventPublisher.publish(new MembershipPurchased(
                Events.nextId(), Events.now(clock), m.getId(), member.getId(), plan.getId()));
        return mapper.toResponse(m);
    }

    /**
     * Extends from the current end date if not lapsed, otherwise from today
     * (MEM-09). Creates an UNPAID membership: pay it online, or have staff call
     * confirmPayment (which raises the invoice and payment).
     */
    @Transactional
    public MembershipResponse renew(UUID memberOrMembershipId, UUID planId) {
        Member member;
        Membership prev;
        Optional<Membership> byId = memberships.findById(memberOrMembershipId);
        if (byId.isPresent()) {
            prev = byId.get();
            member = prev.getMember();
        } else {
            member = members.findById(memberOrMembershipId)
                    .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Member or membership not found: " + memberOrMembershipId));
            prev = memberships.findByMember_IdOrderByStartDateDesc(member.getId()).stream().findFirst().orElse(null);
        }
        if (!member.isActive()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Member account is deactivated");
        }

        lockMember(member.getId());

        if (prev != null && Set_has(List.of("CANCELLED", "SUSPENDED", "PENDING_PAYMENT"), prev.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "A " + prev.getStatus() + " membership cannot be renewed");
        }

        Plan plan;
        if (planId != null) {
            plan = requireActivePlan(planId);
        } else if (prev != null) {
            plan = prev.getPlan();
            if (!plan.isActive()) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Plan " + plan.getName() + " is no longer offered; choose another plan");
            }
        } else {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "planId is required for a member's first membership");
        }

        LocalDate today = today();
        LocalDate start = (prev != null && !prev.getEndDate().isBefore(today)) ? prev.getEndDate().plusDays(1) : today;
        LocalDate end = start.plusDays(plan.getValidityDays() - 1L);

        validateEligibility(member, plan, start);
        assertNoOverlap(member.getId(), start, end);

        BigDecimal price = plan.getPrice() != null ? plan.getPrice() : BigDecimal.ZERO;
        Membership renewal = newPending(member, plan, start, end, prev == null ? null : prev.getId(), price);
        if (price.signum() == 0) {
            activate(renewal);
        }

        eventPublisher.publish(new MembershipRenewed(
                Events.nextId(), Events.now(clock), renewal.getId(), member.getId(), plan.getId()));
        return mapper.toResponse(renewal);
    }

    private static boolean Set_has(List<String> statuses, String status) {
        return status != null && statuses.contains(status.toUpperCase());
    }

    /**
     * Mid-term change (MEM-10). The new plan covers the REST of the current
     * term (same end date) and the customer is charged the pro-rated difference
     * for those days. The old term is only cut when the difference is paid.
     */
    @Transactional
    public MembershipResponse changePlan(UUID membershipId, UUID newPlanId, LocalDate effectiveDate) {
        Membership old = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        if (!LIVE.contains(old.getStatus().toUpperCase())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Only an ACTIVE membership can change plan (this one is " + old.getStatus() + ")");
        }
        Plan newPlan = requireActivePlan(newPlanId);
        if (newPlan.getId().equals(old.getPlan().getId())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Member is already on the " + newPlan.getName() + " plan");
        }

        Member member = old.getMember();
        lockMember(member.getId());

        LocalDate today = today();
        LocalDate effective = (effectiveDate == null || effectiveDate.isBefore(today)) ? today : effectiveDate;
        if (effective.isAfter(old.getEndDate())) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Effective date is after the current term ends; renew instead");
        }
        boolean hasPending = memberships.findByMember_IdOrderByStartDateDesc(member.getId()).stream()
                .anyMatch(x -> "PENDING_PAYMENT".equalsIgnoreCase(x.getStatus()));
        if (hasPending) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Member has an unpaid membership. Pay or cancel it first");
        }
        validateEligibility(member, newPlan, effective);

        int unusedDays = (int) (old.getEndDate().toEpochDay() - effective.toEpochDay() + 1);
        BigDecimal oldDaily = dailyRate(old.getPlan());
        BigDecimal newDaily = dailyRate(newPlan);
        var proration = ProrationCalculator.compute(unusedDays, Money.ofRupees(oldDaily), Money.ofRupees(newDaily));

        BigDecimal due = proration.difference().isPositive() ? proration.difference().toRupees() : BigDecimal.ZERO;

        Membership next = newPending(member, newPlan, effective, old.getEndDate(), old.getId(), due);
        next.setProrationNote(proration.note());
        memberships.save(next);
        if (due.signum() == 0) {
            activate(next); // downgrade or no difference: nothing to collect
        }
        auditService.record("MEMBERSHIP_TIER_CHANGE", "MEMBERSHIP", next.getId(),
                Map.of("oldPlan", old.getPlan().getName(), "newPlan", newPlan.getName(), "proration", proration.note()));
        return mapper.toResponse(next);
    }

    private static BigDecimal dailyRate(Plan p) {
        if (p.getValidityDays() <= 0 || p.getPrice() == null) {
            return BigDecimal.ZERO;
        }
        return p.getPrice().divide(BigDecimal.valueOf(p.getValidityDays()), 2, RoundingMode.HALF_UP);
    }

    // =====================================================================
    // Payment confirmation
    // =====================================================================
    /**
     * For the payment gateway / PaymentService to call once money has really
     * been received. Idempotent for an already-active membership; refuses
     * anything cancelled or expired meanwhile.
     */
    @Transactional
    public MembershipResponse activateAfterPayment(UUID membershipId) {
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        if (LIVE.contains(m.getStatus().toUpperCase())) {
            return mapper.toResponse(m);
        }
        if (!"PENDING_PAYMENT".equalsIgnoreCase(m.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE,
                    "Membership is " + m.getStatus() + " and cannot be activated; the payment must be refunded");
        }
        lockMember(m.getMember().getId());
        activate(m);
        return mapper.toResponse(m);
    }

    /**
     * Desk payment (MEM-09): raises the membership invoice, records the payment
     * against it (so revenue, receipt and ledger are produced by the finance
     * module), then activates the membership.
     */
    @Transactional
    public MembershipResponse confirmPayment(UUID membershipId, String method, String reference) {
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        lockMember(m.getMember().getId());
        if (!"PENDING_PAYMENT".equalsIgnoreCase(m.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Membership is " + m.getStatus() + "; nothing to pay");
        }

        BigDecimal due = m.getPricePaid() == null ? BigDecimal.ZERO : m.getPricePaid();
        if (due.signum() > 0) {
            // membership.gst_percent defaults to 0 (the plan price is the invoice total). Set it to add GST on top.
            BigDecimal gst = decimalSetting("membership.gst_percent", BigDecimal.ZERO);
            InvoiceResponse invoice = finance.createInvoice(new CreateInvoiceRequest(
                    m.getMember().getId(),
                    null,
                    "Membership " + m.getPlan().getName() + " " + m.getStartDate() + " to " + m.getEndDate(),
                    null,
                    List.of(new InvoiceLineRequest(
                            "Membership: " + m.getPlan().getName() + " (" + m.getStartDate() + " to " + m.getEndDate() + ")",
                            "MEMBERSHIP", m.getId(), BigDecimal.ONE, due, gst))));
            finance.recordPayment(invoice.id(), new RecordInvoicePaymentRequest(invoice.total(), method, reference));
        }
        activate(m);
        return mapper.toResponse(m);
    }

    // =====================================================================
    // Suspend / reinstate / cancel  (MEM-18: reason mandatory and audited)
    // =====================================================================
    private static String requireReason(String reason, String what) {
        if (reason == null || reason.isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, what + " reason is mandatory");
        }
        return reason.trim();
    }

    @Transactional
    public MembershipResponse suspend(UUID membershipId, String reason) {
        String why = requireReason(reason, "Suspension");
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        if (!LIVE.contains(m.getStatus().toUpperCase())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Only an ACTIVE membership can be suspended (this one is " + m.getStatus() + ")");
        }
        m.setStatus("SUSPENDED");
        m.setSuspensionReason(why);
        memberships.save(m);
        auditService.record("MEMBERSHIP_SUSPEND", "MEMBERSHIP", m.getId(), Map.of("reason", why));
        return mapper.toResponse(m);
    }

    @Transactional
    public MembershipResponse reinstate(UUID membershipId, String reason) {
        String why = requireReason(reason, "Reinstatement");
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        if (!"SUSPENDED".equalsIgnoreCase(m.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Only a SUSPENDED membership can be reinstated");
        }
        m.setStatus(m.getEndDate().isBefore(today()) ? "EXPIRED" : statusFor(m.getEndDate()));
        m.setSuspensionReason(null);
        memberships.save(m);
        auditService.record("MEMBERSHIP_REINSTATE", "MEMBERSHIP", m.getId(), Map.of("reason", why));
        return mapper.toResponse(m);
    }

    @Transactional
    public MembershipResponse cancel(UUID membershipId, String reason) {
        String why = requireReason(reason, "Cancellation");
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        if ("CANCELLED".equalsIgnoreCase(m.getStatus())) {
            return mapper.toResponse(m);
        }
        if ("EXPIRED".equalsIgnoreCase(m.getStatus())) {
            throw new DomainException(ErrorCode.INVALID_STATE, "An expired membership cannot be cancelled");
        }
        m.setStatus("CANCELLED");
        m.setCancellationReason(why);
        memberships.save(m);
        // NOTE: refunds and future bookings are not touched here (BKG-14/BKG-16).
        auditService.record("MEMBERSHIP_CANCEL", "MEMBERSHIP", m.getId(), Map.of("reason", why));
        return mapper.toResponse(m);
    }

    // =====================================================================
    // Lookups used by booking / pricing (signatures unchanged)
    // =====================================================================
    /**
     * Tier the member is entitled to on the booking's club-local date; anything
     * not paid-and-live prices as GUEST.
     */
    @Transactional(readOnly = true)
    public String tierAt(UUID memberId, OffsetDateTime at) {
        if (memberId == null) {
            return "GUEST";
        }
        LocalDate date = at != null ? at.atZoneSameInstant(ClubTime.IST).toLocalDate() : today();
        return memberships.findCurrent(memberId, date).map(m -> m.getPlan().getName()).orElse("GUEST");
    }

    @Transactional(readOnly = true)
    public Optional<Plan> activePlan(UUID memberId, LocalDate date) {
        if (memberId == null) {
            return Optional.empty();
        }
        LocalDate target = date != null ? date : today();
        return memberships.findCurrent(memberId, target).map(Membership::getPlan);
    }

    @Transactional(readOnly = true)
    public List<MembershipResponse> getMembershipsForMember(UUID memberId) {
        return memberships.findByMember_IdOrderByStartDateDesc(memberId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MembershipResponse getMembership(UUID id) {
        Membership membership = memberships.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + id));
        return mapper.toResponse(membership);
    }
}
