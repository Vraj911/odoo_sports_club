package com.bookmycourt.shop.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * SHP-10 / SRS 3.2 scheduled jobs: unpaid online orders release their stock reservation after the
 * configured timeout (setting shop.reservation_minutes, default 30). Needs @EnableScheduling in your app.
 * Each order is released in its own transaction, so one failure never blocks the others.
 */
@Component
public class ShopReservationJob {

    private static final Logger log = LoggerFactory.getLogger(ShopReservationJob.class);

    private final ShopService shop;

    public ShopReservationJob(ShopService shop) {
        this.shop = shop;
    }

    @Scheduled(fixedDelayString = "${bookmycourt.shop.reservation-sweep-ms:60000}")
    public void releaseExpiredReservations() {
        for (UUID id : shop.findExpiredReservationIds()) {
            try {
                shop.expireReservation(id);
            } catch (RuntimeException e) {
                log.warn("Could not release reservation for order {}: {}", id, e.getMessage());
            }
        }
    }
}
