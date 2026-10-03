package com.bookmycourt.membership.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.membership.dto.LoginRequest;
import com.bookmycourt.membership.dto.MemberResponse;
import com.bookmycourt.membership.dto.PlanResponse;
import com.bookmycourt.membership.dto.RegisterRequest;
import com.bookmycourt.membership.service.MembershipService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MembershipController {

    private final MembershipService memberships;

    public MembershipController(MembershipService memberships) {
        this.memberships = memberships;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MemberResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Registered", memberships.register(request));
    }

    @PostMapping("/auth/login")
    public ApiResponse<MemberResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Logged in", memberships.login(request));
    }

    @GetMapping("/members")
    public ApiResponse<List<MemberResponse>> members() {
        return ApiResponse.success("Members loaded", memberships.listMembers());
    }

    @GetMapping("/members/{id}")
    public ApiResponse<MemberResponse> member(@PathVariable UUID id) {
        return ApiResponse.success("Member loaded", memberships.getMember(id));
    }

    @org.springframework.web.bind.annotation.PutMapping("/members/{id}")
    public ApiResponse<MemberResponse> updateMember(@PathVariable UUID id, @Valid @RequestBody com.bookmycourt.membership.dto.UpdateMemberRequest request) {
        return ApiResponse.success("Member updated", memberships.updateMember(id, request));
    }

    @GetMapping("/plans")
    public ApiResponse<List<PlanResponse>> plans() {
        return ApiResponse.success("Plans loaded", memberships.listPlans());
    }

    @PostMapping("/memberships")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<com.bookmycourt.membership.dto.MembershipResponse> subscribe(
            @Valid @RequestBody com.bookmycourt.membership.dto.CreateMembershipRequest request) {
        return ApiResponse.success("Subscribed successfully", memberships.subscribe(request));
    }

    @PostMapping("/memberships/{id}/renew")
    public ApiResponse<com.bookmycourt.membership.dto.MembershipResponse> renew(@PathVariable UUID id) {
        return ApiResponse.success("Membership renewed", memberships.renew(id));
    }

    @org.springframework.web.bind.annotation.PatchMapping("/memberships/{id}/status")
    public ApiResponse<com.bookmycourt.membership.dto.MembershipResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody com.bookmycourt.membership.dto.MembershipStatusRequest request) {
        return ApiResponse.success("Status updated", memberships.updateStatus(id, request));
    }

    @GetMapping("/memberships/{id}")
    public ApiResponse<com.bookmycourt.membership.dto.MembershipResponse> getMembership(@PathVariable UUID id) {
        return ApiResponse.success("Membership loaded", memberships.getMembership(id));
    }

    @GetMapping("/memberships/member/{memberId}")
    public ApiResponse<List<com.bookmycourt.membership.dto.MembershipResponse>> getMemberMemberships(@PathVariable UUID memberId) {
        return ApiResponse.success("Member memberships loaded", memberships.getMembershipsForMember(memberId));
    }
}
