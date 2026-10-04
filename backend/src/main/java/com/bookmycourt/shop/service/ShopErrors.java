package com.bookmycourt.shop.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;

/**
 * Uses ErrorCode.VALIDATION_FAILED (the constant your old ShopService used) and ErrorCode.CONFLICT (409).
 * Add CONFLICT to ErrorCode + your exception handler if it does not exist yet.
 */
public final class ShopErrors {

    private ShopErrors() {
    }

    public static DomainException bad(String msg) {
        return new DomainException(ErrorCode.VALIDATION_FAILED, msg);
    }

    public static DomainException conflict(String msg) {
        return new DomainException(ErrorCode.CONFLICT, msg);
    }
}
