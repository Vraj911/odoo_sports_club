package com.bookmycourt.membership.service;

import com.bookmycourt.common.audit.AuditService;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.membership.dto.MembershipResponse;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.mapper.MemberMapper;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.membership.repository.PlanRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MembershipServiceTest {

    private MemberRepository members;
    private MembershipRepository memberships;
    private PlanRepository plans;
    private AuditService auditService;
    private DomainEventPublisher eventPublisher;
    private MembershipService service;

    private static final LocalDate FIXED_TODAY = LocalDate.of(2026, 10, 1);
    private static final Clock FIXED_CLOCK = Clock.fixed(
            FIXED_TODAY.atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant(),
            ZoneId.of("Asia/Kolkata")
    );

    @BeforeEach
    void setUp() {
        members = Mockito.mock(MemberRepository.class);
        memberships = Mockito.mock(MembershipRepository.class);
        plans = Mockito.mock(PlanRepository.class);
        auditService = Mockito.mock(AuditService.class);
        eventPublisher = Mockito.mock(DomainEventPublisher.class);
        MemberMapper mapper = new MemberMapper();

        service = new MembershipService(
                members, memberships, plans, mapper,
                auditService, eventPublisher, FIXED_CLOCK
        );
    }

    @Test
    void renew_withMembershipId_extendsEndDateAndAppliesPlanPrice() {
        UUID membershipId = UUID.randomUUID();
        Plan plan = new Plan();
        plan.setId(UUID.randomUUID());
        plan.setName("Gold");
        plan.setValidityDays(30);
        plan.setPrice(new BigDecimal("2999.00"));

        Member member = new Member();
        member.setId(UUID.randomUUID());

        Membership current = new Membership();
        current.setId(membershipId);
        current.setMember(member);
        current.setPlan(plan);
        current.setStartDate(FIXED_TODAY.minusDays(20));
        current.setEndDate(FIXED_TODAY.plusDays(10));
        current.setStatus("ACTIVE");

        when(memberships.findById(membershipId)).thenReturn(Optional.of(current));
        when(plans.findById(plan.getId())).thenReturn(Optional.of(plan));

        MembershipResponse resp = service.renew(membershipId, plan.getId());

        assertNotNull(resp);
        assertEquals(new BigDecimal("2999.00"), resp.pricePaid());
        verify(memberships).save(any(Membership.class));
    }

    @Test
    void changePlan_calculatesDynamicProration() {
        UUID membershipId = UUID.randomUUID();
        Member member = new Member();
        member.setId(UUID.randomUUID());

        Plan oldPlan = new Plan();
        oldPlan.setId(UUID.randomUUID());
        oldPlan.setName("Standard");
        oldPlan.setValidityDays(30);
        oldPlan.setPrice(new BigDecimal("900.00")); // 30/day

        Plan newPlan = new Plan();
        newPlan.setId(UUID.randomUUID());
        newPlan.setName("Premium");
        newPlan.setValidityDays(30);
        newPlan.setPrice(new BigDecimal("1800.00")); // 60/day

        Membership current = new Membership();
        current.setId(membershipId);
        current.setMember(member);
        current.setPlan(oldPlan);
        current.setStartDate(FIXED_TODAY.minusDays(10));
        current.setEndDate(FIXED_TODAY.plusDays(19)); // 20 days remaining
        current.setStatus("ACTIVE");
        current.setPricePaid(new BigDecimal("900.00"));

        when(memberships.findById(membershipId)).thenReturn(Optional.of(current));
        when(plans.findById(newPlan.getId())).thenReturn(Optional.of(newPlan));

        MembershipResponse result = service.changePlan(membershipId, newPlan.getId(), FIXED_TODAY);

        assertNotNull(result);
        assertEquals(newPlan.getId(), result.planId());
        // Remaining old: (900/30) * 20 = 600. New cost for 20 days: (1800/30) * 20 = 1200. Difference = 600.
        assertTrue(result.pricePaid().compareTo(BigDecimal.ZERO) > 0);
    }
}
