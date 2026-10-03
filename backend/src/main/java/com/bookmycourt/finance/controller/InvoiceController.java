package com.bookmycourt.finance.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.finance.dto.CreateInvoiceRequest;
import com.bookmycourt.finance.dto.InvoiceResponse;
import com.bookmycourt.finance.dto.RecordInvoicePaymentRequest;
import com.bookmycourt.finance.dto.UpdateInvoiceStatusRequest;
import com.bookmycourt.finance.service.FinanceAccess;
import com.bookmycourt.finance.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/invoices", "/api/finance/invoices"})
public class InvoiceController {

    private final FinanceService finance;
    private final FinanceAccess access;

    public InvoiceController(FinanceService finance, FinanceAccess access) {
        this.finance = finance;
        this.access = access;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InvoiceResponse> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        access.requireFinance();
        return ApiResponse.success("Invoice created", finance.createInvoice(request));
    }

    @GetMapping("/{id}")
    public ApiResponse<InvoiceResponse> getInvoice(@PathVariable UUID id) {
        InvoiceResponse inv = finance.getInvoice(id);
        access.requireSelfOrStaff(inv.memberId());
        return ApiResponse.success("Invoice loaded", inv);
    }

    @GetMapping
    public ApiResponse<List<InvoiceResponse>> listInvoices(
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) String status) {
        if (memberId != null) {
            access.requireSelfOrStaff(memberId);
        } else {
            access.requireFinanceOrDesk();
        }
        return ApiResponse.success("Invoices loaded", finance.listInvoices(memberId, status));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<InvoiceResponse> updateInvoiceStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceStatusRequest request) {
        access.requireFinance();
        return ApiResponse.success("Invoice status updated", finance.updateStatus(id, request));
    }

    @PostMapping("/{id}/payments")
    public ApiResponse<InvoiceResponse> recordPayment(
            @PathVariable UUID id,
            @Valid @RequestBody RecordInvoicePaymentRequest request) {
        access.requireFinanceOrDesk();
        return ApiResponse.success("Payment recorded on invoice", finance.recordPayment(id, request));
    }

    @PostMapping("/{id}/credit-note")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InvoiceResponse> issueCreditNote(
            @PathVariable UUID id,
            @RequestParam String reason) {
        access.requireFinance();
        return ApiResponse.success("Credit note issued", finance.issueCreditNote(id, reason));
    }
}
