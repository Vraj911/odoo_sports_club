package com.bookmycourt.membership.mapper;

import com.bookmycourt.membership.dto.MemberResponse;
import com.bookmycourt.membership.dto.PlanResponse;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.entity.Plan;
import org.springframework.stereotype.Component;

@Component
public class MemberMapper {

    public MemberResponse toResponse(Member member, Membership membership, String role) {
        Plan plan = membership == null ? null : membership.getPlan();
        return new MemberResponse(
                member.getId(),
                member.getUser() == null ? null : member.getUser().getId(),
                member.getMemberCode(),
                member.getQrToken(),
                member.getFirstName(),
                member.getLastName(),
                member.getEmail(),
                member.getPhone(),
                role,
                plan == null ? "GUEST" : plan.getName(),
                plan == null ? 2 : plan.getMaxBookingsPerDay(),
                plan == null ? 3 : plan.getAdvanceBookingDays()
        );
    }

    public PlanResponse toResponse(Plan plan) {
        return new PlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getDescription(),
                plan.getValidityDays(),
                plan.getAdvanceBookingDays(),
                plan.getMaxBookingsPerDay(),
                plan.getPrice()
        );
    }

    public com.bookmycourt.membership.dto.MembershipResponse toResponse(Membership m) {
        return new com.bookmycourt.membership.dto.MembershipResponse(
                m.getId(),
                m.getMember().getId(),
                m.getMember().getFirstName() + " " + m.getMember().getLastName(),
                m.getMember().getMemberCode(),
                m.getPlan().getId(),
                m.getPlan().getName(),
                m.getStartDate(),
                m.getEndDate(),
                m.getStatus(),
                m.getPricePaid(),
                m.getPreviousMembershipId(),
                m.getSuspensionReason(),
                m.getCancellationReason(),
                m.getCreatedAt()
        );
    }
}
