package com.bookmycourt.membership.service;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.membership.repository.MemberRepository;

/**
 * Role checks for membership endpoints. Staff = front desk or manager+. A
 * member only sees/acts on themselves.
 */
@Component
public class MembershipAccess {

    private final MemberRepository members;

    public MembershipAccess(MemberRepository members) {
        this.members = members;
    }

    public boolean isManager() {
        Actor a = ActorHolder.current();
        return a != null && a.isManagerOrAbove();
    }

    public boolean isStaff() {
        Actor a = ActorHolder.current();
        return a != null && (a.isManagerOrAbove() || "FRONT_DESK".equalsIgnoreCase(a.role().name()));
    }

    public boolean isSelf(UUID memberId) {
        Actor a = ActorHolder.current();
        if (a == null || a.userId() == null || memberId == null) {
            return false;
        }
        return members.findById(memberId).map(m -> a.userId().equals(m.getUserId())).orElse(false);
    }

    private static DomainException forbidden(String msg) {
        // add ErrorCode.FORBIDDEN (HTTP 403) if you don't have it yet
        return new DomainException(ErrorCode.FORBIDDEN, msg);
    }

    public void requireStaff() {
        if (!isStaff()) {
            throw forbidden("Staff access required");
        }
    }

    public void requireManager() {
        if (!isManager()) {
            throw forbidden("Manager access required");
        }
    }

    public void requireSelfOrStaff(UUID memberId) {
        if (isStaff() || isSelf(memberId)) {
            return;
        }
        throw forbidden("You can only access your own membership records");
    }
}
