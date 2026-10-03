package com.bookmycourt.common.error;

import java.util.Collections;
import java.util.Map;

public class DomainException extends RuntimeException {

    private final ErrorCode errorCode;
    private final Map<String, Object> details;

    public DomainException(ErrorCode errorCode, String message) {
        this(errorCode, message, Collections.emptyMap());
    }

    public DomainException(ErrorCode errorCode, String message, Map<String, Object> details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details != null ? Map.copyOf(details) : Collections.emptyMap();
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public Map<String, Object> getDetails() {
        return details;
    }
}
