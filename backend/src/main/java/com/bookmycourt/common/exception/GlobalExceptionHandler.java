package com.bookmycourt.common.exception;

import com.bookmycourt.booking.dto.AlternativeSlotResponse;
import com.bookmycourt.booking.engine.Model.CapExceededException;
import com.bookmycourt.booking.engine.Model.ConfirmationFailedException;
import com.bookmycourt.booking.engine.Model.InvalidSlotException;
import com.bookmycourt.booking.engine.Model.SlotTakenException;
import com.bookmycourt.booking.mapper.BookingMapper;
import com.bookmycourt.common.response.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDate;
import java.sql.SQLException;
import java.util.List;
import java.util.NoSuchElementException;

import com.bookmycourt.common.error.DomainException;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final BookingMapper bookingMapper;

    public GlobalExceptionHandler(BookingMapper bookingMapper) {
        this.bookingMapper = bookingMapper;
    }

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> handleDomainException(DomainException ex) {
        return ResponseEntity.status(ex.getErrorCode().getHttpStatus())
                .body(ApiResponse.failure(ex.getErrorCode().name() + ": " + ex.getMessage(), ex.getDetails().isEmpty() ? null : ex.getDetails()));
    }

    @ExceptionHandler(SlotTakenException.class)
    public ResponseEntity<ApiResponse<List<AlternativeSlotResponse>>> handleSlotTaken(SlotTakenException ex) {
        LocalDate date = ex.getDay();
        List<AlternativeSlotResponse> alts = bookingMapper.toAlternatives(ex.getAlternatives(), date);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.failure("SLOT_TAKEN", alts));
    }

    @ExceptionHandler(CapExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleCap(CapExceededException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.failure("CAP_EXCEEDED", null));
    }

    @ExceptionHandler(ConfirmationFailedException.class)
    public ResponseEntity<ApiResponse<Void>> handleConfirmationFailure(ConfirmationFailedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.failure("BOOKING_NOT_CONFIRMABLE", null));
    }

    @ExceptionHandler(InvalidSlotException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidSlot(InvalidSlotException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.failure(ex.getMessage(), null));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure(ex.getMessage(), null));
    }

    @ExceptionHandler(AuthFailedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuth(AuthFailedException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure(ex.getMessage(), null));
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissing(NoSuchElementException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure("Resource not found", null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<List<String>>> handleValidationException(
            MethodArgumentNotValidException exception) {
        List<String> details = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .toList();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.failure("Validation failed", details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.failure(exception.getMessage(), null));
    }

    /**
     * PostgreSQL uses SQLSTATE 23P01 for an exclusion-constraint conflict.  The
     * occupancy constraint added in V8 is the final cross-node booking guard;
     * expose that expected conflict as the same API response as an in-memory
     * slot collision instead of returning a generic server error.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException exception) {
        if (hasSqlState(exception, "23P01")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.failure("SLOT_TAKEN", null));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.failure("Data integrity constraint violated", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure("Unexpected server error", null));
    }

    private String formatFieldError(FieldError fieldError) {
        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
    }

    private boolean hasSqlState(Throwable exception, String expectedState) {
        Throwable current = exception;
        while (current != null) {
            if (current instanceof SQLException sqlException && expectedState.equals(sqlException.getSQLState())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
