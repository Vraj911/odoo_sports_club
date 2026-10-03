package com.bookmycourt.common.money;

import java.math.BigDecimal;

public final class MoneyConverters {

    private MoneyConverters() {
    }

    public static Money from(BigDecimal rupees) {
        return Money.ofRupees(rupees);
    }

    public static BigDecimal toRupees(Money money) {
        return money == null ? BigDecimal.ZERO.setScale(2) : money.toRupees();
    }
}
