package com.bookmycourt.bar.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.exception.NotFoundException;

public final class BarErrors {
    private BarErrors() {}

    public static DomainException conflict(String message) {
        return new DomainException(ErrorCode.CONFLICT, message);
    }

    public static DomainException bad(String message) {
        return new DomainException(ErrorCode.VALIDATION_FAILED, message);
    }

    public static NotFoundException notFound(String message) {
        return new NotFoundException(message);
    }
}
