package com.bookmycourt.membership.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.Events;
import com.bookmycourt.common.event.events.SystemEvents.ClubConfigChanged;
import com.bookmycourt.membership.dto.PlanResponse;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.mapper.MemberMapper;
import com.bookmycourt.membership.repository.PlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
public class PlanService {

    private final PlanRepository plans;
    private final MemberMapper mapper;
    private final DomainEventPublisher eventPublisher;
    private final Clock clock;

    public PlanService(PlanRepository plans,
            MemberMapper mapper,
            DomainEventPublisher eventPublisher,
            Clock clock) {
        this.plans = plans;
        this.mapper = mapper;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> listActive() {
        return plans.findByActiveTrue().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlanResponse get(UUID id) {
        return plans.findById(id)
                .map(mapper::toResponse)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Plan not found: " + id));
    }

    @Transactional
    public PlanResponse create(Plan plan) {
        validatePlan(plan);
        plans.save(plan);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Plan created: " + plan.getName()));
        return mapper.toResponse(plan);
    }

    @Transactional
    public PlanResponse update(UUID id, Plan updated) {
        Plan plan = plans.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Plan not found: " + id));
        validatePlan(updated);
        plan.setDescription(updated.getDescription());
        plan.setValidityDays(updated.getValidityDays());
        plan.setAdvanceBookingDays(updated.getAdvanceBookingDays());
        plan.setMaxBookingsPerDay(updated.getMaxBookingsPerDay());
        plan.setShopDiscountPercent(updated.getShopDiscountPercent());
        plan.setBarDiscountPercent(updated.getBarDiscountPercent());
        plan.setActive(updated.isActive());
        plans.save(plan);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Plan updated: " + plan.getName()));
        return mapper.toResponse(plan);
    }

    private void validatePlan(Plan p) {
        if (p.getMaxBookingsPerDay() < 1) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "max_bookings_per_day must be at least 1");
        }
        if (p.getValidityDays() < 1) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "validity_days must be at least 1");
        }
        if (p.getShopDiscountPercent() != null
                && (p.getShopDiscountPercent().compareTo(BigDecimal.ZERO) < 0 || p.getShopDiscountPercent().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Shop discount percent must be between 0 and 100");
        }
        if (p.getBarDiscountPercent() != null
                && (p.getBarDiscountPercent().compareTo(BigDecimal.ZERO) < 0 || p.getBarDiscountPercent().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Bar discount percent must be between 0 and 100");
        }
    }
}
