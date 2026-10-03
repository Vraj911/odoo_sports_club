package com.bookmycourt.common.sequence;

import com.bookmycourt.common.concurrency.Guard;
import com.bookmycourt.common.concurrency.Keys;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Service
public class NumberSeriesService {

    private final NumberSeriesRepository repository;
    private final Guard guard;
    private final Clock clock;

    public NumberSeriesService(NumberSeriesRepository repository, Guard guard, Clock clock) {
        this.repository = repository;
        this.guard = guard;
        this.clock = clock;
    }

    public String currentFinancialYear() {
        LocalDate today = LocalDate.now(clock);
        int year = today.getYear();
        if (today.getMonthValue() < 4) {
            return (year - 1) + "-" + String.format("%02d", year % 100);
        } else {
            return year + "-" + String.format("%02d", (year + 1) % 100);
        }
    }

    public long nextNumber(String series, String financialYear) {
        return guard.run(List.of(new Keys.NumberSeriesKey(series)), () -> {
            NumberSeries ns = repository.findBySeriesAndFinancialYear(series, financialYear)
                    .orElseGet(() -> new NumberSeries(series, financialYear, 0L));
            long next = ns.getLastNumber() + 1;
            return new Guard.Decision<>(() -> {
                ns.setLastNumber(next);
                repository.save(ns);
                return next;
            }, () -> {});
        });
    }

    public String nextMemberCode() {
        long num = nextNumber("MEMBER", "GLOBAL");
        return String.format("BMC-%04d", num);
    }

    public String nextInvoiceNumber() {
        String fy = currentFinancialYear();
        long num = nextNumber("INVOICE", fy);
        return String.format("INV/%s/%06d", fy, num);
    }

    public String nextCreditNoteNumber() {
        String fy = currentFinancialYear();
        long num = nextNumber("CREDITNOTE", fy);
        return String.format("CN/%s/%06d", fy, num);
    }
}
