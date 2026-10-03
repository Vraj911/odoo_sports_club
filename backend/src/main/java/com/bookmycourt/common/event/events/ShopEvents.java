package com.bookmycourt.common.event.events;

import com.bookmycourt.common.event.DomainEvent;

import java.time.Instant;
import java.util.UUID;

public final class ShopEvents {

    private ShopEvents() {
    }

    public record ShopOrderPlaced(UUID eventId, Instant occurredAt, UUID orderId, UUID memberId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SHOP_ORDER:" + orderId;
        }
    }

    public record ShopOrderStatusChanged(UUID eventId, Instant occurredAt, UUID orderId, String oldStatus, String newStatus) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SHOP_ORDER:" + orderId;
        }
    }

    public record ShopOrderCancelled(UUID eventId, Instant occurredAt, UUID orderId, String reason) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SHOP_ORDER:" + orderId;
        }
    }

    public record ReturnProcessed(UUID eventId, Instant occurredAt, UUID orderId, UUID returnId) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "SHOP_ORDER:" + orderId;
        }
    }

    public record StockLow(UUID eventId, Instant occurredAt, UUID variantId, int available, int reorderLevel) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "PRODUCT_VARIANT:" + variantId;
        }
    }

    public record StockReceived(UUID eventId, Instant occurredAt, UUID variantId, int quantityReceived) implements DomainEvent {
        @Override
        public String aggregateKey() {
            return "PRODUCT_VARIANT:" + variantId;
        }
    }
}
