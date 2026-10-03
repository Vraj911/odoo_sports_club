package com.bookmycourt.bar.service;

import com.bookmycourt.bar.entity.BarTable;
import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.bar.repository.BarTableRepository;
import org.springframework.stereotype.Component;

@Component
public class BarTableSupport {

    private final BarOrderRepository orders;
    private final BarTableRepository tables;

    public BarTableSupport(BarOrderRepository orders, BarTableRepository tables) {
        this.orders = orders;
        this.tables = tables;
    }

    /** Frees the table only when no other active order is still sitting on it (was: always freed). */
    public void releaseIfIdle(BarTable table) {
        if (table == null) return;
        if (!orders.existsByTable_IdAndStatusIn(table.getId(), BarStatus.ACTIVE)) {
            table.setStatus(BarStatus.FREE);
            tables.save(table);
        }
    }
}
