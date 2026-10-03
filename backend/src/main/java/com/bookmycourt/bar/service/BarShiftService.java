package com.bookmycourt.bar.service;

import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.bar.dto.CashMovementRequest;
import com.bookmycourt.bar.dto.CashShiftResponse;
import com.bookmycourt.bar.dto.CloseShiftRequest;
import com.bookmycourt.bar.dto.OpenShiftRequest;
import com.bookmycourt.bar.entity.BarCashMovement;
import com.bookmycourt.bar.entity.CashShift;
import com.bookmycourt.bar.repository.BarCashMovementRepository;
import com.bookmycourt.bar.repository.BarPaymentRepository;
import com.bookmycourt.bar.repository.CashShiftRepository;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** BAR-11 / BAR-12: staff shifts, cash drawer, expected vs counted cash. */
@Service
public class BarShiftService {

    private final CashShiftRepository shifts;
    private final BarPaymentRepository barPayments;
    private final BarCashMovementRepository movements;
    private final AppUserRepository users;
    private final AuditService audit;
    private final Clock clock;

    public BarShiftService(CashShiftRepository shifts, BarPaymentRepository barPayments,
                           BarCashMovementRepository movements, AppUserRepository users,
                           AuditService audit, Clock clock) {
        this.shifts = shifts;
        this.barPayments = barPayments;
        this.movements = movements;
        this.users = users;
        this.audit = audit;
        this.clock = clock;
    }

    @Transactional
    public CashShiftResponse openShift(OpenShiftRequest r) {
        UUID actorId = requireActorId();
        UUID staffId = r.staffUserId() != null ? r.staffUserId() : actorId;
        if (!staffId.equals(actorId) && !BarRoles.isManager()) {
            throw BarErrors.conflict("Only a manager can open a shift for another staff member");
        }
        AppUser staff = users.findById(staffId)
                .orElseThrow(() -> new NotFoundException("Staff user not found: " + staffId));

        CashShift existing = shifts.findByStaffUser_IdAndStatus(staff.getId(), "OPEN").orElse(null);
        if (existing != null) return toResponse(existing);

        CashShift cs = new CashShift();
        cs.setStaffUser(staff);
        cs.setScope(r.scope() != null && !r.scope().isBlank() ? r.scope().trim().toUpperCase(Locale.ROOT) : "BAR");
        cs.setOpeningFloat(r.openingFloat());
        cs.setExpectedCash(r.openingFloat());
        cs.setCountedCash(r.openingFloat());
        cs.setStatus("OPEN");
        cs.setOpenedAt(OffsetDateTime.now(clock));
        shifts.save(cs);
        CashShiftResponse res = toResponse(cs);
        audit.record("BAR_SHIFT_OPENED", "CASH_SHIFT", cs.getId(), null, res);
        return res;
    }

    @Transactional
    public CashShiftResponse closeShift(UUID shiftId, CloseShiftRequest r) {
        CashShift cs = shifts.findById(shiftId)
                .orElseThrow(() -> new NotFoundException("Cash shift not found: " + shiftId));
        if (!"OPEN".equalsIgnoreCase(cs.getStatus())) return toResponse(cs);
        requireOwnerOrManager(cs);

        CashShiftResponse before = toResponse(cs);
        BigDecimal expected = liveExpected(cs);
        cs.setExpectedCash(expected);
        cs.setCountedCash(r.countedCash());
        cs.setVariance(r.countedCash().subtract(expected));
        cs.setStatus("CLOSED");
        cs.setClosedAt(OffsetDateTime.now(clock));
        shifts.save(cs);

        CashShiftResponse after = toResponse(cs);
        audit.record("BAR_SHIFT_CLOSED", "CASH_SHIFT", shiftId, before, after);
        return after;
    }

    @Transactional(readOnly = true)
    public CashShiftResponse getCurrentShift(UUID staffUserId) {
        UUID id = staffUserId != null ? staffUserId : requireActorId();
        if (!id.equals(audit.currentActorId()) && !BarRoles.isManager()) {
            throw BarErrors.conflict("You can only view your own shift");
        }
        CashShift cs = shifts.findByStaffUser_IdAndStatus(id, "OPEN")
                .orElseThrow(() -> new NotFoundException("No open shift found for staff: " + id));
        return toResponse(cs);
    }

    @Transactional(readOnly = true)
    public List<CashShiftResponse> listShifts(String status) {
        String s = status == null || status.isBlank() ? "OPEN" : status.trim().toUpperCase(Locale.ROOT);
        return shifts.findByStatusOrderByOpenedAtDesc(s).stream().map(this::toResponse).toList();
    }

    /** BAR-12: cash in / out entries. Cash can never be paid out below zero. */
    @Transactional
    public CashShiftResponse addCashMovement(UUID shiftId, CashMovementRequest r) {
        CashShift cs = shifts.findById(shiftId).orElseThrow(() -> new NotFoundException("Cash shift not found"));
        if (!"OPEN".equalsIgnoreCase(cs.getStatus())) throw BarErrors.conflict("Shift is closed");
        requireOwnerOrManager(cs);
        if ("OUT".equals(r.type()) && liveExpected(cs).compareTo(r.amount()) < 0) {
            throw BarErrors.conflict("Cash out exceeds the cash expected in the drawer");
        }
        CashShiftResponse before = toResponse(cs);
        BarCashMovement m = new BarCashMovement();
        m.setCashShift(cs);
        m.setType(r.type());
        m.setAmount(r.amount());
        m.setReason(r.reason().trim());
        m.setCreatedBy(users.findById(requireActorId()).orElse(null));
        movements.save(m);
        CashShiftResponse after = toResponse(cs);
        audit.record("BAR_CASH_" + r.type(), "CASH_SHIFT", shiftId, before, after, r.reason());
        return after;
    }

    // expected = float + cash sales + cash in - cash out  (replaces payments.findAll() filtered in memory)
    private BigDecimal liveExpected(CashShift cs) {
        return cs.getOpeningFloat()
                .add(barPayments.sumCashByShift(cs.getId()))
                .add(movements.sumByShiftAndType(cs.getId(), "IN"))
                .subtract(movements.sumByShiftAndType(cs.getId(), "OUT"));
    }

    private void requireOwnerOrManager(CashShift cs) {
        UUID actor = audit.currentActorId();
        boolean owner = actor != null && cs.getStaffUser() != null && actor.equals(cs.getStaffUser().getId());
        if (!owner && !BarRoles.isManager()) {
            throw BarErrors.conflict("Only the shift owner or a manager can do this");
        }
    }

    private UUID requireActorId() {
        UUID id = audit.currentActorId();
        if (id == null) throw BarErrors.bad("Cannot determine the current staff user - make sure you are logged in");
        return id;
    }

    CashShiftResponse toResponse(CashShift cs) {
        String staffName = "Staff";
        if (cs.getStaffUser() != null) {
            String n = ((cs.getStaffUser().getFirstName() == null ? "" : cs.getStaffUser().getFirstName()) + " "
                    + (cs.getStaffUser().getLastName() == null ? "" : cs.getStaffUser().getLastName())).trim();
            if (!n.isBlank()) staffName = n;
        }
        BigDecimal expected = "OPEN".equalsIgnoreCase(cs.getStatus()) ? liveExpected(cs) : cs.getExpectedCash();
        return new CashShiftResponse(
                cs.getId(), cs.getStaffUser() == null ? null : cs.getStaffUser().getId(), staffName, cs.getScope(),
                cs.getOpenedAt(), cs.getClosedAt(), cs.getOpeningFloat(), expected, cs.getCountedCash(),
                cs.getVariance(), cs.getStatus());
    }
}