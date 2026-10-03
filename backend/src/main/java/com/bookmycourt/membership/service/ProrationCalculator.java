package com.bookmycourt.membership.service;

import com.bookmycourt.common.money.Money;

public final class ProrationCalculator {

    private ProrationCalculator() {
    }

    public record ProrationResult(
            int unusedDays,
            Money unusedCredit,
            Money newCost,
            Money difference, // positive = customer owes (invoice), negative = refund/credit (credit note)
            String note
    ) {
    }

    public static ProrationResult compute(int unusedDays, Money oldDailyRate, Money newDailyRate) {
        if (unusedDays <= 0) {
            return new ProrationResult(0, Money.ZERO, Money.ZERO, Money.ZERO, "No unused days to prorate");
        }

        Money unusedCredit = oldDailyRate.times(unusedDays);
        Money newCost = newDailyRate.times(unusedDays);
        Money difference = newCost.minus(unusedCredit);

        String note = String.format("Proration for %d days: credit %s from old plan, cost %s for new plan, net difference %s",
                unusedDays, unusedCredit, newCost, difference);

        return new ProrationResult(unusedDays, unusedCredit, newCost, difference, note);
    }
}
