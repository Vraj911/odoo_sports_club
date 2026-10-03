package com.bookmycourt.payment.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.payment.dto.CreatePaymentRequest;
import com.bookmycourt.payment.dto.PaymentResponse;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PaymentResponse> create(@Valid @RequestBody CreatePaymentRequest request) {
        return ApiResponse.success("Payment recorded", payments.createPayment(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<PaymentResponse> get(@PathVariable UUID id) {
        return ApiResponse.success("Payment loaded", payments.getPayment(id));
    }

    @GetMapping
    public ApiResponse<List<PaymentResponse>> list(
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) String sourceType) {
        return ApiResponse.success("Payments loaded", payments.listPayments(memberId, sourceType));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<PaymentResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePaymentStatusRequest request) {
        return ApiResponse.success("Payment status updated", payments.updateStatus(id, request));
    }
}
