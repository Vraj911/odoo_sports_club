package com.bookmycourt.finance.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.finance.dto.CreateInvoiceRequest;
import com.bookmycourt.finance.dto.ExpenseRequest;
import com.bookmycourt.finance.dto.ExpenseResponse;
import com.bookmycourt.finance.dto.InvoiceResponse;
import com.bookmycourt.finance.dto.RecordInvoicePaymentRequest;
import com.bookmycourt.finance.dto.UpdateInvoiceStatusRequest;
import com.bookmycourt.finance.service.FinanceService;
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
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService finance;

    public FinanceController(FinanceService finance) {
        this.finance = finance;
    }

    @PostMapping("/invoices")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InvoiceResponse> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        return ApiResponse.success("Invoice created", finance.createInvoice(request));
    }

    @GetMapping("/invoices/{id}")
    public ApiResponse<InvoiceResponse> getInvoice(@PathVariable UUID id) {
        return ApiResponse.success("Invoice loaded", finance.getInvoice(id));
    }

    @GetMapping("/invoices")
    public ApiResponse<List<InvoiceResponse>> listInvoices(
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) String status) {
        return ApiResponse.success("Invoices loaded", finance.listInvoices(memberId, status));
    }

    @PatchMapping("/invoices/{id}/status")
    public ApiResponse<InvoiceResponse> updateInvoiceStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInvoiceStatusRequest request) {
        return ApiResponse.success("Invoice status updated", finance.updateStatus(id, request));
    }

    @PostMapping("/invoices/{id}/payments")
    public ApiResponse<InvoiceResponse> recordPayment(
            @PathVariable UUID id,
            @Valid @RequestBody RecordInvoicePaymentRequest request) {
        return ApiResponse.success("Payment recorded on invoice", finance.recordPayment(id, request));
    }

    @PostMapping("/invoices/{id}/credit-note")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InvoiceResponse> issueCreditNote(
            @PathVariable UUID id,
            @RequestParam(required = false) String reason) {
        return ApiResponse.success("Credit note issued", finance.issueCreditNote(id, reason));
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExpenseResponse> recordExpense(@Valid @RequestBody ExpenseRequest request) {
        return ApiResponse.success("Expense recorded", finance.recordExpense(request));
    }

    @GetMapping("/expenses")
    public ApiResponse<List<ExpenseResponse>> listExpenses(@RequestParam(required = false) String expenseType) {
        return ApiResponse.success("Expenses loaded", finance.listExpenses(expenseType));
    }
}
