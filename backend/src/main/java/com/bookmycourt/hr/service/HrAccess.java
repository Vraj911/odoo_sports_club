package com.bookmycourt.hr.service;

import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.hr.entity.Employee;
import com.bookmycourt.hr.repository.EmployeeRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Role checks for HR endpoints. HR admin = manager or above. Staff can see/act
 * on their own records only.
 */
@Component
public class HrAccess {

    private final EmployeeRepository employees;

    public HrAccess(EmployeeRepository employees) {
        this.employees = employees;
    }

    public boolean isHr() {
        Actor a = ActorHolder.current();
        return a != null && a.isManagerOrAbove();
    }

    public boolean isAccountant() {
        Actor a = ActorHolder.current();
        // ADAPT: confirm the role name your Role enum uses for the Accountant
        return a != null && "ACCOUNTANT".equalsIgnoreCase(a.role().name());
    }

    private static DomainException forbidden(String msg) {
        // add ErrorCode.FORBIDDEN (HTTP 403) if you don't have it yet
        return new DomainException(ErrorCode.FORBIDDEN, msg);
    }

    public void requireHr() {
        if (!isHr()) {
            throw forbidden("HR access required");
        }
    }

    public void requireHrOrAccountant() {
        if (!isHr() && !isAccountant()) {
            throw forbidden("HR or finance access required");
        }
    }

    /**
     * The employee record of the logged-in user, if they have one.
     */
    public Optional<Employee> currentEmployee() {
        Actor a = ActorHolder.current();
        if (a == null || a.userId() == null) {
            return Optional.empty();
        }
        return employees.findByUser_Id(a.userId());
    }

    public boolean isSelf(UUID employeeId) {
        return employeeId != null && currentEmployee().map(e -> e.getId().equals(employeeId)).orElse(false);
    }

    public void requireSelfOrHr(UUID employeeId) {
        if (isHr() || isSelf(employeeId)) {
            return;
        }
        throw forbidden("You can only access your own records");
    }

    public void requireSelfOrHrOrAccountant(UUID employeeId) {
        if (isHr() || isAccountant() || isSelf(employeeId)) {
            return;
        }
        throw forbidden("You can only access your own records");
    }
}
