package com.bookmycourt.shop.mapper;

import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.shop.dto.ProductResponse;
import com.bookmycourt.shop.dto.ProductVariantResponse;
import com.bookmycourt.shop.dto.PublicProductResponse;
import com.bookmycourt.shop.dto.PublicVariantResponse;
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
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class ShopMapper {

    public ProductResponse toResponse(Product p) {
        List<ProductVariantResponse> variantResponses = p.getVariants() == null
                ? Collections.emptyList()
                : p.getVariants().stream().map(this::toResponse).toList();
        return new ProductResponse(
                p.getId(), p.getCategory(), p.getName(), p.getDescription(), p.getBrand(), p.getTaxRate(),
                p.getHsnCode(), p.isTaxInclusive(), p.isActive(), variantResponses, p.getCreatedAt());
    }

    public ProductVariantResponse toResponse(ProductVariant pv) {
        int avail = pv.getOnHand() - pv.getReserved();
        boolean lowStock = avail <= pv.getReorderLevel();
        return new ProductVariantResponse(
                pv.getId(), pv.getProduct().getId(), pv.getProduct().getName(), pv.getSku(), pv.getVariantName(),
                pv.getAttributes(), pv.getPrice(), pv.getTaxRate(), pv.getOnHand(), pv.getReserved(), avail,
                pv.getReorderLevel(), lowStock, pv.isActive(), pv.isQuickSale());
    }

    /** Public catalog: active variants only, stock STATUS instead of counts. */
    public PublicProductResponse toPublic(Product p) {
        List<PublicVariantResponse> vs = p.getVariants().stream().filter(ProductVariant::isActive).map(v -> {
            int avail = v.getOnHand() - v.getReserved();
            String status = avail <= 0 ? "OUT_OF_STOCK" : avail <= v.getReorderLevel() ? "LOW_STOCK" : "IN_STOCK";
            return new PublicVariantResponse(v.getId(), v.getSku(), v.getVariantName(), v.getAttributes(),
                    v.getPrice(), v.getTaxRate(), p.isTaxInclusive(), status);
        }).toList();
        return new PublicProductResponse(p.getId(), p.getCategory(), p.getName(), p.getDescription(), p.getBrand(), vs);
    }

    public ShopOrderLineResponse toResponse(ShopOrderLine line) {
        return new ShopOrderLineResponse(
                line.getId(), line.getProductVariant().getId(), line.getProductNameSnapshot(),
                line.getVariantNameSnapshot(), line.getSkuSnapshot(), line.getHsnCode(), line.getQuantity(),
                line.getReturnedQuantity(), line.getUnitPrice(), line.getTaxRate(), line.isTaxInclusive(),
                line.getDiscountPercent(), line.getDiscountAmount(), line.getTaxAmount(), line.getLineTotal());
    }

    public ShopOrderResponse toResponse(ShopOrder order) {
        List<ShopOrderLineResponse> items = order.getLines() == null
                ? Collections.emptyList()
                : order.getLines().stream().map(this::toResponse).toList();
        return new ShopOrderResponse(
                order.getId(), order.getOrderNumber(), order.getChannel(),
                order.getMember() == null ? null : order.getMember().getId(),
                name(order.getMember()),
                order.getGuestName(), order.getGuestPhone(), order.getFulfillmentMethod(),
                order.getDeliveryAddress(), order.getDeliveryNote(), order.getStatus(),
                order.getDiscountPercent(), order.getDiscountSource(),
                order.getSubtotal(), order.getDiscountTotal(), order.getTaxTotal(), order.getDeliveryFee(),
                order.getTotal(), order.getRefundedTotal(), items, order.getPaidAt(), order.getCreatedAt());
    }

    public StockMovementResponse toResponse(StockMovement sm) {
        return new StockMovementResponse(
                sm.getId(), sm.getProductVariant().getId(), sm.getProductVariant().getVariantName(),
                sm.getProductVariant().getSku(), sm.getMovementType(), sm.getQuantity(), sm.getSourceType(),
                sm.getSourceId(), name(sm.getPerformedBy()), sm.getNotes(), sm.getCreatedAt());
    }

    private String name(Member m) {
        if (m == null) return null;
        return join(m.getFirstName(), m.getLastName());
    }

    private String name(AppUser u) {
        if (u == null) return null;
        return join(u.getFirstName(), u.getLastName());
    }

    private static String join(String a, String b) {
        String n = Stream.of(a, b).filter(Objects::nonNull).filter(s -> !s.isBlank()).collect(Collectors.joining(" "));
        return n.isBlank() ? null : n;
    }
}