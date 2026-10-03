package com.bookmycourt.pricing.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.pricing.dto.PriceQuoteResponse;
import com.bookmycourt.pricing.dto.QuoteRequest;
import com.bookmycourt.pricing.service.PricingService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalTime;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    private final PricingService pricing;

    public PricingController(PricingService pricing) {
        this.pricing = pricing;
    }

    @PostMapping("/quote")
    public ApiResponse<PriceQuoteResponse> quote(@Valid @RequestBody QuoteRequest request) {
        return ApiResponse.success(
                "Quote calculated",
                pricing.quote(request.courtId(), request.memberId(), request.date(), LocalTime.parse(request.startTime()))
        );
    }
}
