package com.bookmycourt.admin.controller;

import com.bookmycourt.admin.dto.AuditLogPage;
import com.bookmycourt.admin.dto.ClubHolidayRequest;
import com.bookmycourt.admin.dto.ClubHolidayResponse;
import com.bookmycourt.admin.dto.ClubProfileResponse;
import com.bookmycourt.admin.dto.ClubSettingRequest;
import com.bookmycourt.admin.dto.ClubSettingResponse;
import com.bookmycourt.admin.dto.OpeningHoursRequest;
import com.bookmycourt.admin.dto.OpeningHoursResponse;
import com.bookmycourt.admin.dto.TaxRateRequest;
import com.bookmycourt.admin.dto.TaxRateResponse;
import com.bookmycourt.admin.dto.UpdateClubProfileRequest;
import com.bookmycourt.admin.service.AdminService;
import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * AUTH-02: every endpoint is role-guarded. Default = OWNER/ADMIN; selected reads are opened up.
 * ASSUMPTION: role names OWNER, ADMIN, MANAGER, ACCOUNTANT (Spring authority ROLE_*). Adjust to your enum.
 * Requires @EnableMethodSecurity on your security config.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAnyRole('OWNER','ADMIN')")
public class AdminController {

    private static final String CONFIG_READ = "hasAnyRole('OWNER','ADMIN','MANAGER')";
    private static final String FINANCE_READ = "hasAnyRole('OWNER','ADMIN','MANAGER','ACCOUNTANT')";

    private final AdminService admin;
    private final AuditService audit;

    public AdminController(AdminService admin, AuditService audit) {
        this.admin = admin;
        this.audit = audit;
    }

    // ---- profile
    @GetMapping({"/profile", "/club-profile"})
    @PreAuthorize(CONFIG_READ)
    public ApiResponse<ClubProfileResponse> getProfile() {
        return ApiResponse.success("Profile loaded", admin.getProfile());
    }

    @PutMapping({"/profile", "/club-profile"})
    public ApiResponse<ClubProfileResponse> updateProfile(@Valid @RequestBody UpdateClubProfileRequest request) {
        return ApiResponse.success("Profile updated", admin.updateProfile(request));
    }

    // ---- holidays
    @PostMapping("/holidays")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ClubHolidayResponse> addHoliday(@Valid @RequestBody ClubHolidayRequest request) {
        return ApiResponse.success("Holiday saved", admin.addHoliday(request));
    }

    @GetMapping("/holidays")
    @PreAuthorize(FINANCE_READ)
    public ApiResponse<List<ClubHolidayResponse>> listHolidays(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.success("Holidays loaded", admin.listHolidays(from, to));
    }

    @DeleteMapping("/holidays/{id}")
    public ApiResponse<Void> deleteHoliday(@PathVariable UUID id) {
        admin.deleteHoliday(id);
        return ApiResponse.success("Holiday deleted", null);
    }

    // ---- settings
    @GetMapping("/settings/{key}")
    @PreAuthorize(CONFIG_READ)
    public ApiResponse<ClubSettingResponse> getSetting(@PathVariable String key) {
        return ApiResponse.success("Setting loaded", admin.getSetting(key));
    }

    @PutMapping("/settings/{key}")
    public ApiResponse<ClubSettingResponse> updateSettingByKey(@PathVariable String key,
                                                               @RequestBody ClubSettingRequest request) {
        ClubSettingRequest req = new ClubSettingRequest(key, request.settingValue(), request.description(), request.reason());
        return ApiResponse.success("Setting saved", admin.setSetting(req));
    }

    @PostMapping("/settings")
    public ApiResponse<ClubSettingResponse> setSetting(@Valid @RequestBody ClubSettingRequest request) {
        return ApiResponse.success("Setting saved", admin.setSetting(request));
    }

    @GetMapping("/settings")
    @PreAuthorize(CONFIG_READ)
    public ApiResponse<List<ClubSettingResponse>> listSettings() {
        return ApiResponse.success("Settings loaded", admin.listSettings());
    }

    // ---- opening hours
    @GetMapping("/opening-hours")
    @PreAuthorize(FINANCE_READ)
    public ApiResponse<List<OpeningHoursResponse>> getOpeningHours() {
        return ApiResponse.success("Opening hours loaded", admin.getOpeningHours());
    }

    @PutMapping("/opening-hours")
    public ApiResponse<List<OpeningHoursResponse>> updateOpeningHours(@RequestBody List<@Valid OpeningHoursRequest> hours) {
        return ApiResponse.success("Opening hours updated", admin.updateOpeningHours(hours));
    }

    // ---- tax rates
    @PostMapping("/tax-rates")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TaxRateResponse> createTaxRate(@Valid @RequestBody TaxRateRequest request) {
        return ApiResponse.success("Tax rate created", admin.createTaxRate(request));
    }

    @PutMapping("/tax-rates/{id}")
    public ApiResponse<TaxRateResponse> updateTaxRate(@PathVariable UUID id, @Valid @RequestBody TaxRateRequest request) {
        return ApiResponse.success("Tax rate updated", admin.updateTaxRate(id, request));
    }

    @GetMapping("/tax-rates")
    @PreAuthorize(FINANCE_READ)
    public ApiResponse<List<TaxRateResponse>> listTaxRates(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate activeOn) {
        return ApiResponse.success("Tax rates loaded", admin.listTaxRates(activeOn));
    }

    // ---- audit log: READ-ONLY over HTTP. Entries are written server-side via AuditService (no forging).
    @GetMapping("/audit-logs")
    @PreAuthorize("hasAnyRole('OWNER','ADMIN','MANAGER','ACCOUNTANT')")
    public ApiResponse<AuditLogPage> listAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) UUID actorUserId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ApiResponse.success("Audit logs loaded",
                audit.search(entityType, action, actorUserId, from, to, page, size));
    }
}