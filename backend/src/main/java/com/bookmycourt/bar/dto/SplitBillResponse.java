package com.bookmycourt.bar.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record SplitBillResponse(
        UUID orderId,
        String orderNumber,
        BigDecimal originalTotal,
        int ways,
        List<BigDecimal> splitAmounts
) {
}
