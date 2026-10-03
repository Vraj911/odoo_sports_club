package com.bookmycourt.payment.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.payment.dto.CreatePaymentRequest;
import com.bookmycourt.payment.dto.ManualPaymentRequest;
import com.bookmycourt.payment.dto.PayNowRequest;
import com.bookmycourt.payment.dto.PaymentDueResponse;
import com.bookmycourt.payment.dto.PaymentResponse;
import com.bookmycourt.payment.dto.RefundRequest;
import com.bookmycourt.payment.dto.RefundResponse;
import com.bookmycourt.payment.dto.UpdatePaymentStatusRequest;
import com.bookmycourt.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class PaymentController {

    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping("/payments")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentResponse> create(@Valid @RequestBody CreatePaymentRequest request) {
        return ApiResponse.success("Payment recorded", payments.createPayment(request));
    }

    @PostMapping("/payments/pay-now")
    public ApiResponse<PaymentResponse> payNow(@Valid @RequestBody PayNowRequest request) {
        return ApiResponse.success("Payment processed", payments.payNow(request));
    }

    @PostMapping("/payments/manual")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentResponse> recordManual(@Valid @RequestBody ManualPaymentRequest request) {
        return ApiResponse.success("Payment recorded", payments.recordManual(request));
    }

    @GetMapping("/payments/{id}")
    public ApiResponse<PaymentResponse> get(@PathVariable UUID id) {
        return ApiResponse.success("Payment loaded", payments.getPayment(id));
    }

    @GetMapping("/payments")
    public ApiResponse<List<PaymentResponse>> list(
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) String sourceType) {
        return ApiResponse.success("Payments loaded", payments.listPayments(memberId, sourceType));
    }

    @PatchMapping("/payments/{id}/status")
    public ApiResponse<PaymentResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePaymentStatusRequest request) {
        return ApiResponse.success("Payment status updated", payments.updateStatus(id, request));
    }

    @PostMapping("/payments/{id}/refunds")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RefundResponse> refund(
            @PathVariable UUID id,
            @Valid @RequestBody RefundRequest request) {
        return ApiResponse.success("Refund processed", payments.refund(id, request));
    }

    @GetMapping("/payments/{id}/refunds")
    public ApiResponse<List<RefundResponse>> listRefunds(@PathVariable UUID id) {
        return ApiResponse.success("Refunds loaded", payments.listRefunds(id));
    }

    @GetMapping("/dues")
    public ApiResponse<List<PaymentDueResponse>> listDues(
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) String status) {
        return ApiResponse.success("Dues loaded", payments.listDues(memberId, status));
    }

    @PostMapping("/dues/{id}/collect")
    public ApiResponse<PaymentResponse> collectDue(
            @PathVariable UUID id,
            @Valid @RequestBody ManualPaymentRequest request) {
        return ApiResponse.success("Due collected", payments.collectDue(id, request));
    }

    @PostMapping("/dues/{id}/write-off")
    public ApiResponse<PaymentDueResponse> writeOffDue(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "Written off by staff") : "Written off by staff";
        return ApiResponse.success("Due written off", payments.writeOffDue(id, reason));
    }
}
