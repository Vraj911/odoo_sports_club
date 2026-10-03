package com.bookmycourt.shop.mapper;

import com.bookmycourt.shop.dto.ProductResponse;
import com.bookmycourt.shop.dto.ProductVariantResponse;
import com.bookmycourt.shop.dto.ShopOrderLineResponse;
import com.bookmycourt.shop.dto.ShopOrderResponse;
import com.bookmycourt.shop.dto.StockMovementResponse;
import com.bookmycourt.shop.entity.Product;
import com.bookmycourt.shop.entity.ProductVariant;
import com.bookmycourt.shop.entity.ShopOrder;
import com.bookmycourt.shop.entity.ShopOrderLine;
import com.bookmycourt.shop.entity.StockMovement;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class ShopMapper {

    public ProductResponse toResponse(Product p) {
        List<ProductVariantResponse> variantResponses = p.getVariants() == null
                ? Collections.emptyList()
                : p.getVariants().stream().map(this::toResponse).toList();

        return new ProductResponse(
                p.getId(),
                p.getCategory(),
                p.getName(),
                p.getDescription(),
                p.getBrand(),
                p.getTaxRate(),
                p.isActive(),
                variantResponses,
                p.getCreatedAt()
        );
    }

    public ProductVariantResponse toResponse(ProductVariant pv) {
        int avail = pv.getOnHand() - pv.getReserved();
        boolean lowStock = avail <= pv.getReorderLevel();
        return new ProductVariantResponse(
                pv.getId(),
                pv.getProduct().getId(),
                pv.getProduct().getName(),
                pv.getSku(),
                pv.getVariantName(),
                pv.getAttributes(),
                pv.getPrice(),
                pv.getTaxRate(),
                pv.getOnHand(),
                pv.getReserved(),
                avail,
                pv.getReorderLevel(),
                lowStock,
                pv.isActive()
        );
    }

    public ShopOrderLineResponse toResponse(ShopOrderLine line) {
        return new ShopOrderLineResponse(
                line.getId(),
                line.getProductVariant().getId(),
                line.getProductNameSnapshot(),
                line.getVariantNameSnapshot(),
                line.getSkuSnapshot(),
                line.getQuantity(),
                line.getUnitPrice(),
                line.getTaxRate(),
                line.getDiscountAmount(),
                line.getLineTotal()
        );
    }

    public ShopOrderResponse toResponse(ShopOrder order) {
        String memberName = null;
        if (order.getMember() != null) {
            memberName = order.getMember().getFirstName() + " " + order.getMember().getLastName();
        }
        List<ShopOrderLineResponse> items = order.getLines() == null
                ? Collections.emptyList()
                : order.getLines().stream().map(this::toResponse).toList();

        return new ShopOrderResponse(
                order.getId(),
                order.getOrderNumber(),
                order.getMember() == null ? null : order.getMember().getId(),
                memberName,
                order.getGuestName(),
                order.getGuestPhone(),
                order.getFulfillmentMethod(),
                order.getDeliveryAddress(),
                order.getStatus(),
                order.getSubtotal(),
                order.getDiscountTotal(),
                order.getTaxTotal(),
                order.getTotal(),
                items,
                order.getCreatedAt()
        );
    }

    public StockMovementResponse toResponse(StockMovement sm) {
        String performedBy = null;
        if (sm.getPerformedBy() != null) {
            performedBy = sm.getPerformedBy().getFirstName() + " " + sm.getPerformedBy().getLastName();
        }
        return new StockMovementResponse(
                sm.getId(),
                sm.getProductVariant().getId(),
                sm.getProductVariant().getVariantName(),
                sm.getProductVariant().getSku(),
                sm.getMovementType(),
                sm.getQuantity(),
                sm.getSourceType(),
                sm.getSourceId(),
                performedBy,
                sm.getNotes(),
                sm.getCreatedAt()
        );
    }
}
