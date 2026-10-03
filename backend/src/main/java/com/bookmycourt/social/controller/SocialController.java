package com.bookmycourt.social.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.social.dto.CreateSocialSessionRequest;
import com.bookmycourt.social.dto.CreateWaitlistRequest;
import com.bookmycourt.social.dto.JoinSocialSessionRequest;
import com.bookmycourt.social.dto.SocialParticipantResponse;
import com.bookmycourt.social.dto.SocialSessionResponse;
import com.bookmycourt.social.dto.WaitlistResponse;
import com.bookmycourt.social.service.SocialService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api/social")
public class SocialController {

    private final SocialService social;

    public SocialController(SocialService social) {
        this.social = social;
    }

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SocialSessionResponse> createSession(@Valid @RequestBody CreateSocialSessionRequest request) {
        return ApiResponse.success("Social session created", social.createSession(request));
    }

    @GetMapping("/sessions/{id}")
    public ApiResponse<SocialSessionResponse> getSession(@PathVariable UUID id) {
        return ApiResponse.success("Social session loaded", social.getSession(id));
    }

    @GetMapping("/sessions")
    public ApiResponse<List<SocialSessionResponse>> listSessions(@RequestParam(required = false) UUID courtId) {
        return ApiResponse.success("Social sessions loaded", social.listSessions(courtId));
    }

    @PostMapping("/sessions/{id}/join")
    public ApiResponse<SocialParticipantResponse> joinSession(
            @PathVariable UUID id,
            @RequestBody JoinSocialSessionRequest request) {
        return ApiResponse.success("Joined session successfully", social.joinSession(id, request));
    }

    @DeleteMapping("/participants/{id}")
    public ApiResponse<Void> cancelParticipation(@PathVariable UUID id) {
        social.cancelParticipation(id);
        return ApiResponse.success("Participation cancelled", null);
    }

    @PostMapping("/waitlist")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WaitlistResponse> addToWaitlist(@RequestBody CreateWaitlistRequest request) {
        return ApiResponse.success("Added to waitlist", social.addToWaitlist(request));
    }

    @GetMapping("/waitlist")
    public ApiResponse<List<WaitlistResponse>> listWaitlist(
            @RequestParam(required = false) UUID sessionId,
            @RequestParam(required = false) UUID courtId) {
        return ApiResponse.success("Waitlist loaded", social.listWaitlist(sessionId, courtId));
    }
}
