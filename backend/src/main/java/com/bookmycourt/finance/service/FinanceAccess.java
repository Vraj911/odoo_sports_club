package com.bookmycourt.finance.service;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.MemberRepository;

/**
 * Role checks for finance endpoints. Called from the controllers (not
 * FinanceService) so internal callers such as membership renewal or CRM quote
 * conversion can still create invoices.
 */
@Component
public class FinanceAccess {

    private final MemberRepository members;

    public FinanceAccess(MemberRepository members) {
        this.members = members;
    }

    private static boolean isFinance(Actor a) {
        return a != null && (a.isManagerOrAbove() || "ACCOUNTANT".equalsIgnoreCase(a.role().name()));
    }

    private static boolean isDesk(Actor a) {
        return a != null && "FRONT_DESK".equalsIgnoreCase(a.role().name());
    }

    private static DomainException forbidden(String msg) {
        // add ErrorCode.FORBIDDEN (HTTP 403) if you don't have it yet
        return new DomainException(ErrorCode.FORBIDDEN, msg);
    }

    public void requireFinance() {
        if (!isFinance(ActorHolder.current())) {
            throw forbidden("Finance access required");
        }
    }

    public void requireFinanceOrDesk() {
        Actor a = ActorHolder.current();
        if (!isFinance(a) && !isDesk(a)) {
            throw forbidden("Staff access required");
        }
    }

    /**
     * Staff can see anyone; a member can only see their own records.
     */
    public void requireSelfOrStaff(UUID memberId) {
        Actor a = ActorHolder.current();
        if (isFinance(a) || isDesk(a)) {
            return;
        }
        if (a == null || a.userId() == null || memberId == null) {
            throw forbidden("Not allowed");
        }
        // ADAPT: assumes Member.getUserId() (SRS member.user_id)
        Member m = members.findById(memberId).orElseThrow(() -> forbidden("Not allowed"));
        if (!a.userId().equals(m.getUserId())) {
            throw forbidden("Not allowed");
        }
    }
}
