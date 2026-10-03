package com.bookmycourt.membership.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.membership.dto.ChangePlanRequest;
import com.bookmycourt.membership.dto.CreateMembershipRequest;
import com.bookmycourt.membership.dto.MemberResponse;
import com.bookmycourt.membership.dto.MemberScanResponse;
import com.bookmycourt.membership.dto.MemberTimelineItem;
import com.bookmycourt.membership.dto.MembershipResponse;
import com.bookmycourt.membership.dto.MembershipStatusRequest;
import com.bookmycourt.membership.dto.PlanResponse;
import com.bookmycourt.membership.dto.RegisterRequest;
import com.bookmycourt.membership.dto.UpdateMemberRequest;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.service.MemberService;
import com.bookmycourt.membership.service.MembershipService;
import com.bookmycourt.membership.service.PlanService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api")
public class MembershipController {

    private final MemberService memberService;
    private final MembershipService membershipService;
    private final PlanService planService;

    public MembershipController(MemberService memberService,
                                MembershipService membershipService,
                                PlanService planService) {
        this.memberService = memberService;
        this.membershipService = membershipService;
        this.planService = planService;
    }

    @PostMapping({"/auth/register", "/members"})
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MemberResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Registered successfully", memberService.register(request));
    }

    @GetMapping("/members")
    public ApiResponse<List<MemberResponse>> searchMembers(@RequestParam(required = false) String q) {
        return ApiResponse.success("Members loaded", memberService.search(q));
    }

    @GetMapping("/members/{id}")
    public ApiResponse<MemberResponse> getMember(@PathVariable UUID id) {
        var found = memberService.search(null).stream()
                .filter(m -> id.equals(m.id()))
                .findFirst()
                .orElse(null);
        return ApiResponse.success("Member loaded", found);
    }

    @GetMapping("/members/scan/{qrToken}")
    public ApiResponse<MemberScanResponse> scanMember(@PathVariable UUID qrToken) {
        return ApiResponse.success("Member scan result", memberService.scan(qrToken));
    }

    @GetMapping("/members/{id}/timeline")
    public ApiResponse<List<MemberTimelineItem>> getTimeline(@PathVariable UUID id) {
        return ApiResponse.success("Member timeline loaded", memberService.timeline(id));
    }

    @GetMapping({"/plans", "/public/plans"})
    public ApiResponse<List<PlanResponse>> listPlans() {
        return ApiResponse.success("Plans loaded", planService.listActive());
    }

    @GetMapping("/plans/{id}")
    public ApiResponse<PlanResponse> getPlan(@PathVariable UUID id) {
        return ApiResponse.success("Plan loaded", planService.get(id));
    }

    @PostMapping("/plans")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PlanResponse> createPlan(@Valid @RequestBody Plan plan) {
        return ApiResponse.success("Plan created", planService.create(plan));
    }

    @PutMapping("/plans/{id}")
    public ApiResponse<PlanResponse> updatePlan(@PathVariable UUID id, @Valid @RequestBody Plan plan) {
        return ApiResponse.success("Plan updated", planService.update(id, plan));
    }

    @PostMapping("/memberships")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MembershipResponse> purchase(
            @Valid @RequestBody CreateMembershipRequest request) {
        var purchaseReq = new MembershipService.PurchaseRequest(
                request.memberId(),
                request.planId(),
                null,
                "PAY_NOW"
        );
        return ApiResponse.success("Membership purchased", membershipService.purchase(purchaseReq));
    }

    @PostMapping("/memberships/{id}/renew")
    public ApiResponse<MembershipResponse> renew(@PathVariable UUID id) {
        return ApiResponse.success("Membership renewed", membershipService.renew(id, null));
    }

    @PostMapping("/memberships/{id}/change-plan")
    public ApiResponse<MembershipResponse> changePlan(
            @PathVariable UUID id,
            @RequestBody ChangePlanRequest req) {
        return ApiResponse.success("Plan changed", membershipService.changePlan(id, req.newPlanId(), req.effectiveDate()));
    }

    @PatchMapping("/memberships/{id}/status")
    public ApiResponse<MembershipResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody MembershipStatusRequest request) {
        if ("SUSPENDED".equalsIgnoreCase(request.status())) {
            return ApiResponse.success("Membership suspended", membershipService.suspend(id, request.reason()));
        } else if ("CANCELLED".equalsIgnoreCase(request.status())) {
            return ApiResponse.success("Membership cancelled", membershipService.cancel(id, request.reason()));
        }
        return ApiResponse.success("Membership loaded", membershipService.getMembership(id));
    }

    @GetMapping("/memberships/{id}")
    public ApiResponse<MembershipResponse> getMembership(@PathVariable UUID id) {
        return ApiResponse.success("Membership loaded", membershipService.getMembership(id));
    }

    @GetMapping({"/memberships/member/{memberId}", "/members/{memberId}/memberships"})
    public ApiResponse<List<MembershipResponse>> getMemberMemberships(@PathVariable UUID memberId) {
        return ApiResponse.success("Member memberships loaded", membershipService.getMembershipsForMember(memberId));
    }
}
