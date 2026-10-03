package com.bookmycourt.bar.dto;

import java.math.BigDecimal;

public record PayOrderResponse(BarOrderResponse order, BigDecimal changeDue) {
}
