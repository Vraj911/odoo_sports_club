package com.bookmycourt.bar.dto;

import java.math.BigDecimal;

public record TabSettleResponse(TabResponse tab, BigDecimal changeDue) {
}
