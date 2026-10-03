package com.bookmycourt.common.error;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    FORBIDDEN(HttpStatus.FORBIDDEN),
    CONFLICT(HttpStatus.CONFLICT),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
    SLOT_TAKEN(HttpStatus.CONFLICT),
    CAP_EXCEEDED(HttpStatus.CONFLICT),
    INVALID_SLOT(HttpStatus.BAD_REQUEST),
    OUTSIDE_HOURS(HttpStatus.BAD_REQUEST),
    CLUB_CLOSED(HttpStatus.CONFLICT),
    TOO_FAR_AHEAD(HttpStatus.BAD_REQUEST),
    HOLD_EXPIRED(HttpStatus.GONE),
    ALREADY_PAID(HttpStatus.CONFLICT),
    NOT_PAYABLE(HttpStatus.CONFLICT),
    OUT_OF_STOCK(HttpStatus.CONFLICT),
    INVALID_STATE(HttpStatus.CONFLICT),
    NOT_FOUND(HttpStatus.NOT_FOUND),
    VALIDATION_FAILED(HttpStatus.BAD_REQUEST),
    DUPLICATE(HttpStatus.CONFLICT),
    TENDER_MISMATCH(HttpStatus.UNPROCESSABLE_ENTITY),
    REFERENCE_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY),
    REFUND_EXCEEDS_PAID(HttpStatus.UNPROCESSABLE_ENTITY),
    APPROVAL_REQUIRED(HttpStatus.FORBIDDEN),
    DUE_LIMIT_REACHED(HttpStatus.CONFLICT),
    DAY_CLOSED(HttpStatus.CONFLICT),
    OPEN_TABS_EXIST(HttpStatus.CONFLICT),
    IDEMPOTENCY_KEY_REUSED(HttpStatus.UNPROCESSABLE_ENTITY),
    MEMBERSHIP_INACTIVE(HttpStatus.CONFLICT),
    MINOR_GUARDIAN_REQUIRED(HttpStatus.UNPROCESSABLE_ENTITY),
    RULE_AMBIGUOUS(HttpStatus.UNPROCESSABLE_ENTITY),
    LEAVE_BALANCE(HttpStatus.CONFLICT),
    ROSTER_CONFLICT(HttpStatus.CONFLICT),
    PAYROLL_FINALISED(HttpStatus.CONFLICT),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
    NOT_READY(HttpStatus.SERVICE_UNAVAILABLE),
    SYSTEM_BUSY(HttpStatus.SERVICE_UNAVAILABLE),
    SHARE_LINK_INVALID(HttpStatus.UNAUTHORIZED),
    SHARE_LINK_EXPIRED(HttpStatus.GONE),
    SHARE_LINK_REVOKED(HttpStatus.FORBIDDEN),
    FORBIDDEN(HttpStatus.FORBIDDEN);

    private final HttpStatus httpStatus;

    ErrorCode(HttpStatus httpStatus) {
        this.httpStatus = httpStatus;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
