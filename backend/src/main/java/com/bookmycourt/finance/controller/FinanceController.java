package com.bookmycourt.finance.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.finance.dto.ExpenseRequest;
import com.bookmycourt.finance.dto.ExpenseResponse;
import com.bookmycourt.finance.service.FinanceAccess;
import com.bookmycourt.finance.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService finance;
    private final FinanceAccess access;

    public FinanceController(FinanceService finance, FinanceAccess access) {
        this.finance = finance;
        this.access = access;
    }

    @PostMapping("/expenses")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ExpenseResponse> recordExpense(@Valid @RequestBody ExpenseRequest request) {
        access.requireFinance();
        return ApiResponse.success("Expense recorded", finance.recordExpense(request));
    }

    @GetMapping("/expenses")
    public ApiResponse<List<ExpenseResponse>> listExpenses(@RequestParam(required = false) String expenseType) {
        access.requireFinance();
        return ApiResponse.success("Expenses loaded", finance.listExpenses(expenseType));
    }
}
