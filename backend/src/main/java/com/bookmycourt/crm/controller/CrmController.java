package com.bookmycourt.crm.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.crm.dto.CompleteFollowUpRequest;
import com.bookmycourt.crm.dto.ConvertLeadRequest;
import com.bookmycourt.crm.dto.CreateFollowUpRequest;
import com.bookmycourt.crm.dto.CreateLeadRequest;
import com.bookmycourt.crm.dto.FollowUpResponse;
import com.bookmycourt.crm.dto.LeadResponse;
import com.bookmycourt.crm.dto.UpdateLeadStatusRequest;
import com.bookmycourt.crm.service.CrmService;
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
@RequestMapping("/api/crm")
public class CrmController {

    private final CrmService crm;

    public CrmController(CrmService crm) {
        this.crm = crm;
    }

    @PostMapping("/leads")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LeadResponse> createLead(@Valid @RequestBody CreateLeadRequest request) {
        return ApiResponse.success("Lead created", crm.createLead(request));
    }

    @GetMapping("/leads/{id}")
    public ApiResponse<LeadResponse> getLead(@PathVariable UUID id) {
        return ApiResponse.success("Lead loaded", crm.getLead(id));
    }

    @GetMapping("/leads")
    public ApiResponse<List<LeadResponse>> listLeads(@RequestParam(required = false) String status) {
        return ApiResponse.success("Leads loaded", crm.listLeads(status));
    }

    @PatchMapping("/leads/{id}/status")
    public ApiResponse<LeadResponse> updateLeadStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLeadStatusRequest request) {
        return ApiResponse.success("Lead status updated", crm.updateStatus(id, request));
    }

    @PostMapping("/leads/{id}/convert")
    public ApiResponse<LeadResponse> convertLead(
            @PathVariable UUID id,
            @Valid @RequestBody ConvertLeadRequest request) {
        return ApiResponse.success("Lead converted to member", crm.convertLead(id, request));
    }

    @PostMapping("/follow-ups")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<FollowUpResponse> createFollowUp(@Valid @RequestBody CreateFollowUpRequest request) {
        return ApiResponse.success("Follow-up scheduled", crm.createFollowUp(request));
    }

    @PatchMapping("/follow-ups/{id}/complete")
    public ApiResponse<FollowUpResponse> completeFollowUp(
            @PathVariable UUID id,
            @RequestBody CompleteFollowUpRequest request) {
        return ApiResponse.success("Follow-up marked completed", crm.completeFollowUp(id, request));
    }

    @GetMapping("/follow-ups")
    public ApiResponse<List<FollowUpResponse>> listFollowUps(
            @RequestParam(required = false) UUID leadId,
            @RequestParam(required = false) String status) {
        return ApiResponse.success("Follow-ups loaded", crm.listFollowUps(leadId, status));
    }

    @GetMapping("/follow-ups/overdue")
    public ApiResponse<List<FollowUpResponse>> getOverdueFollowUps() {
        return ApiResponse.success("Overdue follow-ups loaded", crm.getOverdueFollowUps());
    }

    @GetMapping("/pipeline")
    public ApiResponse<com.bookmycourt.crm.dto.LeadPipelineResponse> getPipeline() {
        return ApiResponse.success("Pipeline summary loaded", crm.getPipeline());
    }

    @PostMapping("/quotes")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<com.bookmycourt.crm.dto.QuoteResponse> createQuote(@Valid @RequestBody com.bookmycourt.crm.dto.CreateQuoteRequest request) {
        return ApiResponse.success("Quote created", crm.createQuote(request));
    }

    @GetMapping("/quotes")
    public ApiResponse<List<com.bookmycourt.crm.dto.QuoteResponse>> listQuotes(@RequestParam(required = false) UUID leadId) {
        return ApiResponse.success("Quotes loaded", crm.listQuotes(leadId));
    }

    @PatchMapping("/quotes/{id}/status")
    public ApiResponse<com.bookmycourt.crm.dto.QuoteResponse> updateQuoteStatus(
            @PathVariable UUID id,
            @RequestParam String status) {
        return ApiResponse.success("Quote status updated", crm.updateQuoteStatus(id, status));
    }
}
