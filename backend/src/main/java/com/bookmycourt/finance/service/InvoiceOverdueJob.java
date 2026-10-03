package com.bookmycourt.finance.service;

import com.bookmycourt.common.time.ClubTime;
import com.bookmycourt.finance.entity.Invoice;
import com.bookmycourt.finance.repository.InvoiceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

/** Flags unpaid invoices past their due date. Scheduling is already enabled by HoldReaper's @EnableScheduling. */
@Component
public class InvoiceOverdueJob {

    private static final Logger log = LoggerFactory.getLogger(InvoiceOverdueJob.class);

    private final InvoiceRepository invoices;
    private final Clock clock;

    public InvoiceOverdueJob(InvoiceRepository invoices, Clock clock) {
        this.invoices = invoices;
        this.clock = clock;
    }

    @Scheduled(cron = "0 15 0 * * *", zone = "Asia/Kolkata")
    @Transactional
    public void markOverdue() {
        LocalDate today = LocalDate.now(clock.withZone(ClubTime.IST));
        List<Invoice> late = invoices.findByStatusInAndDueDateBefore(List.of("SENT", "PARTIAL"), today);
        for (Invoice i : late) {
            if (!"CREDIT_NOTE".equalsIgnoreCase(i.getKind())) {
                i.setStatus("OVERDUE");
            }
        }
        invoices.saveAll(late);
        if (!late.isEmpty()) {
            log.info("Marked {} invoices OVERDUE", late.size());
        }
    }
}
