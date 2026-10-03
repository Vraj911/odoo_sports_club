package com.bookmycourt.shop.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.shop.dto.CreateShopOrderRequest;
import com.bookmycourt.shop.dto.ProductRequest;
import com.bookmycourt.shop.dto.ProductResponse;
import com.bookmycourt.shop.dto.ProductVariantRequest;
import com.bookmycourt.shop.dto.ProductVariantResponse;
import com.bookmycourt.shop.dto.ShopOrderLineRequest;
import com.bookmycourt.shop.dto.ShopOrderResponse;
import com.bookmycourt.shop.dto.StockMovementRequest;
import com.bookmycourt.shop.dto.StockMovementResponse;
import com.bookmycourt.shop.dto.UpdateShopOrderStatusRequest;
import com.bookmycourt.shop.entity.Product;
import com.bookmycourt.shop.entity.ProductVariant;
import com.bookmycourt.shop.entity.ShopOrder;
import com.bookmycourt.shop.entity.ShopOrderLine;
import com.bookmycourt.shop.entity.StockMovement;
import com.bookmycourt.shop.mapper.ShopMapper;
import com.bookmycourt.shop.repository.ProductRepository;
import com.bookmycourt.shop.repository.ProductVariantRepository;
import com.bookmycourt.shop.repository.ShopOrderLineRepository;
import com.bookmycourt.shop.repository.ShopOrderRepository;
import com.bookmycourt.shop.repository.StockMovementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ShopService {

    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ShopOrderRepository orders;
    private final ShopOrderLineRepository orderLines;
    private final StockMovementRepository stockMovements;
    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final AppUserRepository users;
    private final ShopMapper mapper;
    private final com.bookmycourt.payment.service.PaymentService paymentService;

    public ShopService(
            ProductRepository products,
            ProductVariantRepository variants,
            ShopOrderRepository orders,
            ShopOrderLineRepository orderLines,
            StockMovementRepository stockMovements,
            MemberRepository members,
            MembershipRepository memberships,
            AppUserRepository users,
            ShopMapper mapper,
            com.bookmycourt.payment.service.PaymentService paymentService) {
        this.products = products;
        this.variants = variants;
        this.orders = orders;
        this.orderLines = orderLines;
        this.stockMovements = stockMovements;
        this.members = members;
        this.memberships = memberships;
        this.users = users;
        this.mapper = mapper;
        this.paymentService = paymentService;
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Product p = new Product();
        p.setCategory(request.category());
        p.setName(request.name());
        p.setDescription(request.description());
        p.setBrand(request.brand());
        p.setTaxRate(request.taxRate() != null ? request.taxRate() : BigDecimal.ZERO);
        p.setActive(true);
        products.save(p);
        return mapper.toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts(String category) {
        List<Product> list = (category != null && !category.isBlank())
                ? products.findByCategoryIgnoreCaseAndActiveTrue(category)
                : products.findByActiveTrue();
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(UUID id) {
        Product p = products.findById(id).orElseThrow(() -> new NotFoundException("Product not found"));
        return mapper.toResponse(p);
    }

    @Transactional
    public ProductVariantResponse addVariant(ProductVariantRequest request) {
        Product product = products.findById(request.productId())
                .orElseThrow(() -> new NotFoundException("Product not found"));

        ProductVariant pv = new ProductVariant();
        pv.setProduct(product);
        pv.setSku(request.sku());
        pv.setVariantName(request.variantName());
        if (request.attributes() != null) pv.setAttributes(request.attributes());
        pv.setPrice(request.price());
        pv.setTaxRate(request.taxRate() != null ? request.taxRate() : product.getTaxRate());
        pv.setOnHand(0);
        pv.setReserved(0);
        pv.setReorderLevel(request.reorderLevel() != null ? request.reorderLevel() : 0);
        pv.setActive(true);
        variants.save(pv);

        if (request.initialStock() != null && request.initialStock() > 0) {
            StockMovement sm = new StockMovement();
            sm.setProductVariant(pv);
            sm.setMovementType("RECEIPT");
            sm.setQuantity(request.initialStock());
            sm.setSourceType("ADJUSTMENT");
            sm.setNotes("Initial stock setup");
            stockMovements.save(sm);

            pv.setOnHand(request.initialStock());
            variants.save(pv);
        }

        return mapper.toResponse(pv);
    }

    @Transactional
    public ShopOrderResponse createOrder(CreateShopOrderRequest request) {
        Member member = null;
        BigDecimal memberDiscountPercent = BigDecimal.ZERO;
        if (request.memberId() != null) {
            member = members.findById(request.memberId())
                    .orElseThrow(() -> new NotFoundException("Member not found"));
            Membership activeMembership = memberships.findCurrent(member.getId(), LocalDate.now()).orElse(null);
            if (activeMembership != null && activeMembership.getPlan() != null) {
                memberDiscountPercent = activeMembership.getPlan().getShopDiscountPercent();
            }
        }

        ShopOrder order = new ShopOrder();
        order.setOrderNumber("ORD-" + System.currentTimeMillis());
        order.setMember(member);
        order.setGuestName(request.guestName());
        order.setGuestPhone(request.guestPhone());
        order.setFulfillmentMethod(request.fulfillmentMethod());
        order.setDeliveryAddress(request.deliveryAddress());
        order.setStatus("PLACED");

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        List<ShopOrderLine> lines = new ArrayList<>();

        for (ShopOrderLineRequest item : request.items()) {
            ProductVariant variant = variants.findById(item.productVariantId())
                    .orElseThrow(() -> new NotFoundException("Product variant not found: " + item.productVariantId()));

            int avail = variant.getOnHand() - variant.getReserved();
            if (avail < item.quantity()) {
                throw new IllegalStateException("Insufficient stock for " + variant.getVariantName() + ". Available: " + avail);
            }

            BigDecimal lineSubtotal = variant.getPrice().multiply(BigDecimal.valueOf(item.quantity()));
            BigDecimal lineDiscount = lineSubtotal.multiply(memberDiscountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineNet = lineSubtotal.subtract(lineDiscount);
            BigDecimal lineTax = lineNet.multiply(variant.getTaxRate())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineNet.add(lineTax);

            ShopOrderLine line = new ShopOrderLine();
            line.setShopOrder(order);
            line.setProductVariant(variant);
            line.setProductNameSnapshot(variant.getProduct().getName());
            line.setVariantNameSnapshot(variant.getVariantName());
            line.setSkuSnapshot(variant.getSku());
            line.setQuantity(item.quantity());
            line.setUnitPrice(variant.getPrice());
            line.setTaxRate(variant.getTaxRate());
            line.setDiscountAmount(lineDiscount);
            line.setLineTotal(lineTotal);
            lines.add(line);

            subtotal = subtotal.add(lineSubtotal);
            discountTotal = discountTotal.add(lineDiscount);
            taxTotal = taxTotal.add(lineTax);
        }

        order.setSubtotal(subtotal);
        order.setDiscountTotal(discountTotal);
        order.setTaxTotal(taxTotal);
        order.setTotal(subtotal.subtract(discountTotal).add(taxTotal));
        order.setLines(lines);

        orders.save(order);

        // Record stock movements for each line (which triggers stock update in DB)
        for (ShopOrderLine line : lines) {
            StockMovement sm = new StockMovement();
            sm.setProductVariant(line.getProductVariant());
            sm.setShopOrderLine(line);
            sm.setMovementType("SALE");
            sm.setQuantity(line.getQuantity());
            sm.setSourceType("SHOP_ORDER");
            sm.setSourceId(order.getId());
            sm.setNotes("Order " + order.getOrderNumber());
            stockMovements.save(sm);
        }

        return mapper.toResponse(order);
    }

    private static final java.util.Set<String> ALLOWED_SHOP_STATUSES = java.util.Set.of(
            "PLACED", "PAID", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "COLLECTED", "DELIVERED", "RETURNED", "FAILED", "CANCELLED"
    );

    @Transactional
    public ShopOrderResponse updateOrderStatus(UUID orderId, UpdateShopOrderStatusRequest request) {
        ShopOrder order = orders.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Shop order not found"));
        String newStatus = request.status().toUpperCase();
        if (!ALLOWED_SHOP_STATUSES.contains(newStatus)) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Invalid shop order status: " + request.status());
        }
        order.setStatus(newStatus);
        orders.save(order);
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public ShopOrderResponse getOrder(UUID id) {
        ShopOrder order = orders.findById(id).orElseThrow(() -> new NotFoundException("Shop order not found"));
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public List<ShopOrderResponse> listOrders(UUID memberId) {
        List<ShopOrder> list = (memberId != null)
                ? orders.findByMember_IdOrderByCreatedAtDesc(memberId)
                : orders.findByOrderByCreatedAtDesc();
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public StockMovementResponse recordStockMovement(StockMovementRequest request) {
        ProductVariant variant = variants.findById(request.productVariantId())
                .orElseThrow(() -> new NotFoundException("Product variant not found"));

        StockMovement sm = new StockMovement();
        sm.setProductVariant(variant);
        sm.setMovementType(request.movementType());
        sm.setQuantity(request.quantity());
        sm.setSourceType(request.sourceType());
        sm.setSourceId(request.sourceId());
        if (request.performedByUserId() != null) {
            AppUser u = users.findById(request.performedByUserId()).orElse(null);
            sm.setPerformedBy(u);
        }
        sm.setNotes(request.notes());
        stockMovements.save(sm);
        return mapper.toResponse(sm);
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getLowStockVariants() {
        return variants.findLowStock().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ShopOrderResponse checkoutPos(com.bookmycourt.shop.dto.PosCheckoutRequest request) {
        CreateShopOrderRequest orderReq = new CreateShopOrderRequest(
                request.memberId(),
                request.guestName(),
                request.guestPhone(),
                "PICKUP",
                null,
                request.items()
        );
        ShopOrderResponse placed = createOrder(orderReq);
        ShopOrder order = orders.findById(placed.id())
                .orElseThrow(() -> new NotFoundException("Order not found"));
        order.setStatus("COLLECTED");
        orders.save(order);

        paymentService.recordManual(new com.bookmycourt.payment.dto.ManualPaymentRequest(
                "SHOP",
                order.getId(),
                request.memberId(),
                order.getTotal(),
                request.paymentMethod(),
                "POS Counter Checkout",
                request.tendered() != null ? request.tendered() : order.getTotal(),
                null
        ));

        return mapper.toResponse(order);
    }

    @Transactional
    public ShopOrderResponse cancelOrder(UUID orderId, String reason) {
        ShopOrder order = orders.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Shop order not found: " + orderId));
        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            return mapper.toResponse(order);
        }
        String oldStatus = order.getStatus();
        order.setStatus("CANCELLED");
        orders.save(order);

        if (!"FAILED".equalsIgnoreCase(oldStatus) && !"RETURNED".equalsIgnoreCase(oldStatus)) {
            for (ShopOrderLine line : order.getLines()) {
                StockMovement sm = new StockMovement();
                sm.setProductVariant(line.getProductVariant());
                sm.setShopOrderLine(line);
                sm.setMovementType("RETURN");
                sm.setQuantity(line.getQuantity());
                sm.setSourceType("RETURN");
                sm.setSourceId(order.getId());
                sm.setNotes("Order cancelled: " + (reason != null ? reason : ""));
                stockMovements.save(sm);

                ProductVariant pv = line.getProductVariant();
                if (pv != null) {
                    pv.setOnHand(pv.getOnHand() + line.getQuantity());
                    variants.save(pv);
                }
            }
        }

        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getQuickSaleVariants() {
        List<ProductVariant> list = variants.findByIsQuickSaleTrueAndActiveTrue();
        if (list.isEmpty()) {
            list = variants.findAll().stream().filter(ProductVariant::isActive).limit(10).toList();
        }
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.shop.dto.RestockSuggestionResponse> getRestockSuggestions() {
        return variants.findLowStock().stream().map(v -> {
            int avail = v.getOnHand() - v.getReserved();
            int suggested = Math.max(10, v.getReorderLevel() * 2 - avail);
            return new com.bookmycourt.shop.dto.RestockSuggestionResponse(
                    v.getId(),
                    v.getProduct() != null ? v.getProduct().getName() : "Product",
                    v.getVariantName(),
                    v.getSku(),
                    v.getOnHand(),
                    v.getReserved(),
                    avail,
                    v.getReorderLevel(),
                    suggested,
                    v.getPrice()
            );
        }).toList();
    }
}
