package com.bookmycourt.bar.event;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BarTabMovedToAccount(
        UUID tabId,
        UUID memberId,
        BigDecimal amount,
        List<UUID> orderIds
) {
}
