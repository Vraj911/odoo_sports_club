package com.bookmycourt.shop.service;

import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.shop.entity.ProductVariant;
import com.bookmycourt.shop.entity.ShopOrderLine;
import com.bookmycourt.shop.entity.StockMovement;
import com.bookmycourt.shop.event.LowStockAlert;
import com.bookmycourt.shop.repository.ProductVariantRepository;
import com.bookmycourt.shop.repository.StockMovementRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * The ONLY place stock numbers change (SHP-03/04/10, BR-08). Callers must already hold the row lock
 * (ProductVariantRepository.findAllForUpdate). Every change writes a stock_movement row with user, time, reason.
 *
 *   available = on_hand - reserved
 *   reserve      : reserved += q                      (online order placed)
 *   release      : reserved -= q                      (unpaid timeout / cancel)
 *   commit       : on_hand -= q, reserved -= q        (online order collected / delivered)
 *   sellNow      : on_hand -= q                       (counter sale - cannot touch reserved units)
 */
@Service
public class StockService {

    private final ProductVariantRepository variants;
    private final StockMovementRepository movements;
    private final ApplicationEventPublisher events;

    public StockService(ProductVariantRepository variants, StockMovementRepository movements,
                        ApplicationEventPublisher events) {
        this.variants = variants;
        this.movements = movements;
        this.events = events;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void reserve(ProductVariant v, int qty, ShopOrderLine line, UUID orderId, String note, AppUser actor) {
        move(v, ShopStatus.RESERVE, qty, 0, qty, line, "SHOP_ORDER", orderId, note, actor);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void release(ProductVariant v, int qty, ShopOrderLine line, UUID orderId, String note, AppUser actor) {
        move(v, ShopStatus.RELEASE, qty, 0, -qty, line, "SHOP_ORDER", orderId, note, actor);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void commitReserved(ProductVariant v, int qty, ShopOrderLine line, UUID orderId, String note, AppUser actor) {
        move(v, ShopStatus.SALE, qty, -qty, -qty, line, "SHOP_ORDER", orderId, note, actor);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void sellNow(ProductVariant v, int qty, ShopOrderLine line, UUID orderId, String note, AppUser actor) {
        move(v, ShopStatus.SALE, qty, -qty, 0, line, "SHOP_ORDER", orderId, note, actor);
    }

    /** Returned goods back on the shelf. */
    @Transactional(propagation = Propagation.MANDATORY)
    public void restock(ProductVariant v, int qty, ShopOrderLine line, UUID orderId, String note, AppUser actor) {
        move(v, ShopStatus.RETURN, qty, qty, 0, line, "RETURN", orderId, note, actor);
    }

    /** Returned goods that are damaged: recorded, but nothing goes back on the shelf (stock already left on the sale). */
    @Transactional(propagation = Propagation.MANDATORY)
    public void writeOffReturned(ProductVariant v, int qty, ShopOrderLine line, UUID orderId, String note, AppUser actor) {
        move(v, ShopStatus.DAMAGE, qty, 0, 0, line, "RETURN", orderId, note, actor);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public StockMovement receive(ProductVariant v, int qty, String sourceType, UUID sourceId, String note, AppUser actor) {
        return move(v, ShopStatus.RECEIPT, qty, qty, 0, null, sourceType, sourceId, note, actor);
    }

    /** Manual movement (RECEIPT, ADJUSTMENT_IN, ADJUSTMENT_OUT, DAMAGE) - validated by the caller. */
    @Transactional(propagation = Propagation.MANDATORY)
    public StockMovement manual(ProductVariant v, String type, int qty, String sourceType, UUID sourceId,
                                String note, AppUser actor) {
        int dOn = switch (type) {
            case ShopStatus.RECEIPT, ShopStatus.ADJUSTMENT_IN -> qty;
            case ShopStatus.ADJUSTMENT_OUT, ShopStatus.DAMAGE -> -qty;
            default -> throw ShopErrors.bad("Unsupported movement type: " + type);
        };
        return move(v, type, qty, dOn, 0, null, sourceType, sourceId, note, actor);
    }

    private StockMovement move(ProductVariant v, String type, int qty, int dOnHand, int dReserved,
                               ShopOrderLine line, String sourceType, UUID sourceId, String note, AppUser actor) {
        int availBefore = v.getOnHand() - v.getReserved();
        int newOn = v.getOnHand() + dOnHand;
        int newRes = v.getReserved() + dReserved;
        if (newOn < 0 || newRes < 0 || newRes > newOn) {
            throw ShopErrors.conflict("Insufficient stock for " + v.getVariantName() + " (" + v.getSku()
                    + "). Available: " + availBefore);
        }
        v.setOnHand(newOn);
        v.setReserved(newRes);
        variants.save(v);

        StockMovement sm = new StockMovement();
        sm.setProductVariant(v);
        sm.setShopOrderLine(line);
        sm.setMovementType(type);
        sm.setQuantity(qty);
        sm.setSourceType(sourceType == null || sourceType.isBlank() ? "ADJUSTMENT" : sourceType);
        sm.setSourceId(sourceId);
        sm.setPerformedBy(actor);
        sm.setNotes(note);
        movements.save(sm);

        int availAfter = newOn - newRes;
        if (availAfter <= v.getReorderLevel() && availBefore > v.getReorderLevel()) {
            events.publishEvent(new LowStockAlert(v.getId(), v.getSku(), v.getProduct().getName(),
                    v.getVariantName(), availAfter, v.getReorderLevel()));
        }
        return sm;
    }
}
