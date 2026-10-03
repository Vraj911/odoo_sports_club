package com.bookmycourt.admin.controller;

import com.bookmycourt.admin.dto.AuditLogRequest;
import com.bookmycourt.admin.dto.AuditLogResponse;
import com.bookmycourt.admin.dto.ClubHolidayRequest;
import com.bookmycourt.admin.dto.ClubHolidayResponse;
import com.bookmycourt.admin.dto.ClubPublicResponse;
import com.bookmycourt.admin.dto.ClubSettingRequest;
import com.bookmycourt.admin.dto.ClubSettingResponse;
import com.bookmycourt.admin.dto.TaxRateRequest;
import com.bookmycourt.admin.dto.TaxRateResponse;
import com.bookmycourt.admin.dto.UpdateClubProfileRequest;
import com.bookmycourt.admin.service.AdminService;
import com.bookmycourt.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService admin;

    public AdminController(AdminService admin) {
        this.admin = admin;
    }

    @PutMapping("/profile")
    public ApiResponse<ClubPublicResponse> updateProfile(@RequestBody UpdateClubProfileRequest request) {
        return ApiResponse.success("Profile updated", admin.updateProfile(request));
    }

    @PostMapping("/holidays")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ClubHolidayResponse> addHoliday(@Valid @RequestBody ClubHolidayRequest request) {
        return ApiResponse.success("Holiday saved", admin.addHoliday(request));
    }

    @GetMapping("/holidays")
    public ApiResponse<List<ClubHolidayResponse>> listHolidays() {
        return ApiResponse.success("Holidays loaded", admin.listHolidays());
    }

    @DeleteMapping("/holidays/{id}")
    public ApiResponse<Void> deleteHoliday(@PathVariable UUID id) {
        admin.deleteHoliday(id);
        return ApiResponse.success("Holiday deleted", null);
    }

    @PostMapping("/settings")
    public ApiResponse<ClubSettingResponse> setSetting(@Valid @RequestBody ClubSettingRequest request) {
        return ApiResponse.success("Setting saved", admin.setSetting(request));
    }

    @GetMapping("/settings")
    public ApiResponse<List<ClubSettingResponse>> listSettings() {
        return ApiResponse.success("Settings loaded", admin.listSettings());
    }

    @PostMapping("/tax-rates")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaxRateResponse> createTaxRate(@Valid @RequestBody TaxRateRequest request) {
        return ApiResponse.success("Tax rate created", admin.createTaxRate(request));
    }

    @GetMapping("/tax-rates")
    public ApiResponse<List<TaxRateResponse>> listTaxRates() {
        return ApiResponse.success("Tax rates loaded", admin.listTaxRates());
    }

    @PostMapping("/audit-logs")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AuditLogResponse> recordAudit(@Valid @RequestBody AuditLogRequest request) {
        return ApiResponse.success("Audit log recorded", admin.recordAuditLog(request));
    }

    @GetMapping("/audit-logs")
    public ApiResponse<List<AuditLogResponse>> listAuditLogs(@RequestParam(required = false) String entityType) {
        return ApiResponse.success("Audit logs loaded", admin.listAuditLogs(entityType));
    }
}
