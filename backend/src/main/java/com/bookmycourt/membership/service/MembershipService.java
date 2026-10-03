package com.bookmycourt.membership.service;

import com.bookmycourt.common.audit.AuditService;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.Events;
import com.bookmycourt.common.event.events.MembershipEvents.MembershipActivated;
import com.bookmycourt.common.event.events.MembershipEvents.MembershipPurchased;
import com.bookmycourt.common.event.events.MembershipEvents.MembershipRenewed;
import com.bookmycourt.common.event.events.MembershipEvents.MembershipTierChanged;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.membership.dto.MembershipResponse;
import com.bookmycourt.membership.dto.MembershipStatusRequest;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.mapper.MemberMapper;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.membership.repository.PlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MembershipService {

    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final PlanRepository plans;
    private final MemberMapper mapper;
    private final AuditService auditService;
    private final DomainEventPublisher eventPublisher;
    private final Clock clock;

    public MembershipService(
            MemberRepository members,
            MembershipRepository memberships,
            PlanRepository plans,
            MemberMapper mapper,
            AuditService auditService,
            DomainEventPublisher eventPublisher,
            Clock clock) {
        this.members = members;
        this.memberships = memberships;
        this.plans = plans;
        this.mapper = mapper;
        this.auditService = auditService;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    public record PurchaseRequest(
            UUID memberId,
            UUID planId,
            LocalDate startDate,
            String paymentPolicy
    ) {
    }

    @Transactional
    public MembershipResponse purchase(PurchaseRequest req) {
        Member member = members.findById(req.memberId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Member not found: " + req.memberId()));
        Plan plan = plans.findById(req.planId())
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Plan not found: " + req.planId()));

        LocalDate startDate = req.startDate() != null ? req.startDate() : LocalDate.now(clock);

        // Check if member already has an ACTIVE or EXPIRING_SOON membership overlapping startDate
        boolean hasOverlap = memberships.findByMember_IdOrderByStartDateDesc(member.getId()).stream()
                .anyMatch(m -> ("ACTIVE".equalsIgnoreCase(m.getStatus()) || "EXPIRING_SOON".equalsIgnoreCase(m.getStatus()))
                        && !startDate.isBefore(m.getStartDate()) && !startDate.isAfter(m.getEndDate()));
        if (hasOverlap) {
            throw new DomainException(ErrorCode.INVALID_STATE, "Member already has an active membership for this period");
        }

        // Validate Junior plan age
        if ("JUNIOR".equalsIgnoreCase(plan.getName()) && member.getDateOfBirth() != null) {
            int age = Period.between(member.getDateOfBirth(), startDate).getYears();
            if (age >= 18) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Junior plan is restricted to members under 18 years old");
            }
        }

        Membership m = new Membership();
        m.setMember(member);
        m.setPlan(plan);
        m.setStartDate(startDate);
        m.setEndDate(startDate.plusDays(plan.getValidityDays() - 1L));
        m.setStatus("PENDING_PAYMENT");
        m.setPaymentStatus("UNPAID");
        m.setPaymentPolicy(req.paymentPolicy() != null ? req.paymentPolicy() : "PAY_NOW");
        m.setPricePaid(plan.getPrice() != null ? plan.getPrice() : BigDecimal.ZERO);
        memberships.save(m);

        eventPublisher.publish(new MembershipPurchased(
                Events.nextId(),
                Events.now(clock),
                m.getId(),
                member.getId(),
                plan.getId()
        ));

        return mapper.toResponse(m);
    }

    @Transactional
    public MembershipResponse renew(UUID memberOrMembershipId, UUID planId) {
        Member member;
        Membership prev = null;
        Optional<Membership> memOpt = memberships.findById(memberOrMembershipId);
        if (memOpt.isPresent()) {
            prev = memOpt.get();
            member = prev.getMember();
        } else {
            member = members.findById(memberOrMembershipId)
                    .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Member or membership not found: " + memberOrMembershipId));
            prev = memberships.findByMember_IdOrderByStartDateDesc(member.getId()).stream().findFirst().orElse(null);
        }

        LocalDate today = LocalDate.now(clock);
        Plan plan = planId != null
                ? plans.findById(planId).orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Plan not found"))
                : (prev != null ? prev.getPlan() : plans.findAll().stream().findFirst().orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "No plan to renew")));

        LocalDate newStart = today;
        UUID previousId = null;
        if (prev != null) {
            previousId = prev.getId();
            if (prev.getEndDate().isAfter(today) || prev.getEndDate().isEqual(today)) {
                newStart = prev.getEndDate().plusDays(1);
            }
        }

        Membership renewal = new Membership();
        renewal.setMember(member);
        renewal.setPlan(plan);
        renewal.setPreviousMembershipId(previousId);
        renewal.setStartDate(newStart);
        renewal.setEndDate(newStart.plusDays(plan.getValidityDays() - 1L));
        renewal.setStatus("ACTIVE");
        renewal.setPaymentStatus("PAID");
        renewal.setPricePaid(plan.getPrice() != null ? plan.getPrice() : BigDecimal.ZERO);
        memberships.save(renewal);

        eventPublisher.publish(new MembershipRenewed(
                Events.nextId(),
                Events.now(clock),
                renewal.getId(),
                member.getId(),
                plan.getId()
        ));

        return mapper.toResponse(renewal);
    }

    @Transactional
    public MembershipResponse changePlan(UUID membershipId, UUID newPlanId, LocalDate effectiveDate) {
        Membership old = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        Plan newPlan = plans.findById(newPlanId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Plan not found: " + newPlanId));

        LocalDate today = LocalDate.now(clock);
        if (effectiveDate == null || effectiveDate.isBefore(today)) {
            effectiveDate = today;
        }

        int unusedDays = Math.max(0, (int) (old.getEndDate().toEpochDay() - effectiveDate.toEpochDay() + 1));
        BigDecimal oldDaily = old.getPlan().getValidityDays() > 0 && old.getPlan().getPrice() != null
                ? old.getPlan().getPrice().divide(BigDecimal.valueOf(old.getPlan().getValidityDays()), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal newDaily = newPlan.getValidityDays() > 0 && newPlan.getPrice() != null
                ? newPlan.getPrice().divide(BigDecimal.valueOf(newPlan.getValidityDays()), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        Money oldDailyRate = Money.ofRupees(oldDaily);
        Money newDailyRate = Money.ofRupees(newDaily);
        var proration = ProrationCalculator.compute(unusedDays, oldDailyRate, newDailyRate);

        old.setEndDate(effectiveDate.minusDays(1));
        memberships.save(old);

        Membership newMembership = new Membership();
        newMembership.setMember(old.getMember());
        newMembership.setPlan(newPlan);
        newMembership.setPreviousMembershipId(old.getId());
        newMembership.setStartDate(effectiveDate);
        newMembership.setEndDate(effectiveDate.plusDays(newPlan.getValidityDays() - 1L));
        newMembership.setStatus("ACTIVE");
        newMembership.setPaymentStatus("PAID");
        newMembership.setProrationNote(proration.note());
        newMembership.setPricePaid(proration.difference().isPositive() ? proration.difference().toRupees() : BigDecimal.ZERO);
        memberships.save(newMembership);

        eventPublisher.publish(new MembershipTierChanged(
                Events.nextId(),
                Events.now(clock),
                old.getMember().getId(),
                old.getPlan().getName(),
                newPlan.getName(),
                effectiveDate
        ));

        auditService.record("MEMBERSHIP_TIER_CHANGE", "MEMBERSHIP", newMembership.getId(),
                Map.of("oldPlan", old.getPlan().getName(), "newPlan", newPlan.getName(), "proration", proration.note()));

        return mapper.toResponse(newMembership);
    }

    @Transactional
    public MembershipResponse suspend(UUID membershipId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Suspension reason is mandatory");
        }
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        m.setStatus("SUSPENDED");
        m.setSuspensionReason(reason.trim());
        memberships.save(m);

        auditService.record("MEMBERSHIP_SUSPEND", "MEMBERSHIP", m.getId(), Map.of("reason", reason));
        return mapper.toResponse(m);
    }

    @Transactional
    public MembershipResponse cancel(UUID membershipId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Cancellation reason is mandatory");
        }
        Membership m = memberships.findById(membershipId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Membership not found: " + membershipId));
        m.setStatus("CANCELLED");
        m.setCancellationReason(reason.trim());
        memberships.save(m);

        auditService.record("MEMBERSHIP_CANCEL", "MEMBERSHIP", m.getId(), Map.of("reason", reason));
        return mapper.toResponse(m);
    }

    @Transactional(readOnly = true)
    public String tierAt(UUID memberId, OffsetDateTime at) {
        if (memberId == null) {
            return "GUEST";
        }
        LocalDate date = at != null ? at.toLocalDate() : LocalDate.now(clock);
        return memberships.findByMember_IdOrderByStartDateDesc(memberId).stream()
                .filter(m -> !date.isBefore(m.getStartDate()) && !date.isAfter(m.getEndDate()))
                .filter(m -> !"SUSPENDED".equalsIgnoreCase(m.getStatus()) &&
                        !"CANCELLED".equalsIgnoreCase(m.getStatus()) &&
                        !"PENDING_PAYMENT".equalsIgnoreCase(m.getStatus()))
                .findFirst()
                .map(m -> m.getPlan().getName())
                .orElse("GUEST");
    }

    @Transactional(readOnly = true)
    public Optional<Plan> activePlan(UUID memberId, LocalDate date) {
        if (memberId == null) return Optional.empty();
        LocalDate target = date != null ? date : LocalDate.now(clock);
        return memberships.findByMember_IdOrderByStartDateDesc(memberId).stream()
                .filter(m -> !target.isBefore(m.getStartDate()) && !target.isAfter(m.getEndDate()))
                .filter(m -> "ACTIVE".equalsIgnoreCase(m.getStatus()) || "EXPIRING_SOON".equalsIgnoreCase(m.getStatus()))
                .map(Membership::getPlan)
                .findFirst();
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
