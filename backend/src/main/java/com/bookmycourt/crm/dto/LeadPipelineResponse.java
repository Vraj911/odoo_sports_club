package com.bookmycourt.crm.dto;

import java.util.Map;

public record LeadPipelineResponse(
        long totalLeads,
        long newLeads,
        long contactedLeads,
        long quoteSentLeads,
        long trialBookedLeads,
        long wonLeads,
        long lostLeads,
        double conversionRatePercent,
        Map<String, Long> leadsBySource
) {
}
