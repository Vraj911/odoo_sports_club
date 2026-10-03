package com.bookmycourt.pricing.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.pricing.entity.PricingRule;

import java.util.List;
import java.util.Objects;

public final class PricingRuleValidator {

    private PricingRuleValidator() {
    }

    public static void validate(PricingRule rule, List<PricingRule> existingRules) {
        if (rule.getCustomerType() == null || rule.getCustomerType().isBlank()) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Customer type is required");
        }

        String type = rule.getCustomerType().toUpperCase();
        if ("GUEST".equals(type)) {
            if (rule.getPlan() != null) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "GUEST pricing rules must have plan_id NULL");
            }
        } else {
            if (rule.getPlan() == null) {
                throw new DomainException(ErrorCode.VALIDATION_FAILED, "Member tier pricing rules must specify a plan");
            }
        }

        if (existingRules == null) {
            return;
        }

        // Check ambiguity against other active rules of the same customer type
        for (PricingRule other : existingRules) {
            if (Objects.equals(other.getId(), rule.getId())) {
                continue;
            }
            if (!other.isActive() || !other.getCustomerType().equalsIgnoreCase(type)) {
                continue;
            }

            boolean sameDayType = Objects.equals(other.getDayType(), rule.getDayType());
            boolean sameIndoor = Objects.equals(other.getIndoorOutdoor(), rule.getIndoorOutdoor());
            boolean sameSport = Objects.equals(other.getSport(), rule.getSport());
            boolean sameTime = Objects.equals(other.getTimeStart(), rule.getTimeStart()) &&
                               Objects.equals(other.getTimeEnd(), rule.getTimeEnd());
            boolean samePriority = other.getPriority() == rule.getPriority();

            if (sameDayType && sameIndoor && sameSport && sameTime && samePriority) {
                // If validity periods overlap
                boolean overlaps = (rule.getValidTo() == null || other.getValidFrom() == null || !rule.getValidTo().isBefore(other.getValidFrom())) &&
                                   (other.getValidTo() == null || rule.getValidFrom() == null || !other.getValidTo().isBefore(rule.getValidFrom()));
                if (overlaps) {
                    throw new DomainException(ErrorCode.RULE_AMBIGUOUS,
                            "Pricing rule conflicts with existing rule #" + other.getId() + " with identical match score");
                }
            }
        }
    }
}
