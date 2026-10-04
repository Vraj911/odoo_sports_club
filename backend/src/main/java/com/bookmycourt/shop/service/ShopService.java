package com.bookmycourt.shop.service;

import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.payment.dto.ManualPaymentRequest;
import com.bookmycourt.payment.service.PaymentService;
import com.bookmycourt.shop.dto.CreateShopOrderRequest;
import com.bookmycourt.shop.dto.PayShopOrderRequest;
import com.bookmycourt.shop.dto.PosCheckoutRequest;
import com.bookmycourt.shop.dto.PosPaymentLine;
import com.bookmycourt.shop.dto.ProductRequest;
import com.bookmycourt.shop.dto.ProductResponse;
import com.bookmycourt.shop.dto.ProductVariantRequest;
import com.bookmycourt.shop.dto.ProductVariantResponse;
import com.bookmycourt.shop.dto.ProductVariantUpdateRequest;
import com.bookmycourt.shop.dto.PublicProductResponse;
import com.bookmycourt.shop.dto.RestockSuggestionResponse;
import com.bookmycourt.shop.dto.ReturnShopOrderRequest;
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
import com.bookmycourt.shop.event.ShopOrderStatusChanged;
import com.bookmycourt.shop.event.ShopRefundRequested;
import com.bookmycourt.shop.mapper.ShopMapper;
import com.bookmycourt.shop.repository.ProductRepository;
import com.bookmycourt.shop.repository.ProductVariantRepository;
import com.bookmycourt.shop.repository.PurchaseOrderLineRepository;
import com.bookmycourt.shop.repository.ShopOrderRepository;
import com.bookmycourt.shop.repository.StockMovementRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ShopService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private record Cmd(UUID memberId, String guestName, String guestPhone, String fulfillment, String address,
                       String note, List<ShopOrderLineRequest> items, String channel, String key) {
    }

    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ShopOrderRepository orders;
    private final StockMovementRepository stockMovements;
    private final PurchaseOrderLineRepository poLines;
    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final AppUserRepository users;
    private final ShopMapper mapper;
    private final PaymentService paymentService;
    private final StockService stock;
    private final ShopPricingService pricing;
    private final ShopSettings settings;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final ObjectMapper json;
    private final Clock clock;

    public ShopService(ProductRepository products, ProductVariantRepository variants, ShopOrderRepository orders,
                       StockMovementRepository stockMovements, PurchaseOrderLineRepository poLines,
                       MemberRepository members, MembershipRepository memberships, AppUserRepository users,
                       ShopMapper mapper, PaymentService paymentService, StockService stock,
                       ShopPricingService pricing, ShopSettings settings, AuditService audit,
                       ApplicationEventPublisher events, ObjectMapper json, Clock clock) {
        this.products = products;
        this.variants = variants;
        this.orders = orders;
        this.stockMovements = stockMovements;
        this.poLines = poLines;
        this.members = members;
        this.memberships = memberships;
        this.users = users;
        this.mapper = mapper;
        this.paymentService = paymentService;
        this.stock = stock;
        this.pricing = pricing;
        this.settings = settings;
        this.audit = audit;
        this.events = events;
        this.json = json;
        this.clock = clock;
    }

    // ================================================================== catalog (SHP-01/02)

    @Transactional
    public ProductResponse createProduct(ProductRequest r) {
        Product p = new Product();
        applyProduct(p, r);
        p.setActive(true);
        products.save(p);
        return mapper.toResponse(p);
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, ProductRequest r) {
        Product p = products.findById(id).orElseThrow(() -> new NotFoundException("Product not found"));
        ProductResponse before = mapper.toResponse(p);
        applyProduct(p, r);
        products.save(p);
        ProductResponse after = mapper.toResponse(p);
        audit.record("PRODUCT_UPDATED", "PRODUCT", id, before, after);
        return after;
    }

    @Transactional
    public ProductResponse setProductActive(UUID id, boolean active) {
        Product p = products.findById(id).orElseThrow(() -> new NotFoundException("Product not found"));
        p.setActive(active);
        products.save(p);
        audit.record(active ? "PRODUCT_ACTIVATED" : "PRODUCT_DEACTIVATED", "PRODUCT", id, null, null);
        return mapper.toResponse(p);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> listProducts(String category) {
        return activeProducts(category).stream().map(mapper::toResponse).toList();
    }

    /** Public / member catalog: price + stock status only. */
    @Transactional(readOnly = true)
    public List<PublicProductResponse> listCatalog(String category) {
        return activeProducts(category).stream().map(mapper::toPublic).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProduct(UUID id) {
        return mapper.toResponse(products.findById(id).orElseThrow(() -> new NotFoundException("Product not found")));
    }

    private List<Product> activeProducts(String category) {
        return (category != null && !category.isBlank())
                ? products.findByCategoryIgnoreCaseAndActiveTrue(category.trim())
                : products.findByActiveTrue();
    }

    private void applyProduct(Product p, ProductRequest r) {
        p.setCategory(r.category().trim());
        p.setName(r.name().trim());
        p.setDescription(r.description());
        p.setBrand(blankToNull(r.brand()));
        p.setTaxRate(r.taxRate() != null ? r.taxRate() : BigDecimal.ZERO);
        p.setHsnCode(blankToNull(r.hsnCode()));
        p.setTaxInclusive(Boolean.TRUE.equals(r.taxInclusive()));
    }

    @Transactional
    public ProductVariantResponse addVariant(ProductVariantRequest r) {
        Product product = products.findById(r.productId()).orElseThrow(() -> new NotFoundException("Product not found"));
        String sku = r.sku().trim();
        if (variants.existsBySkuIgnoreCase(sku)) throw ShopErrors.conflict("SKU " + sku + " already exists");

        ProductVariant pv = new ProductVariant();
        pv.setProduct(product);
        pv.setSku(sku);
        pv.setVariantName(r.variantName().trim());
        pv.setAttributes(validJson(r.attributes()));
        pv.setPrice(r.price());
        pv.setTaxRate(r.taxRate() != null ? r.taxRate() : product.getTaxRate());
        pv.setOnHand(0);
        pv.setReserved(0);
        pv.setReorderLevel(r.reorderLevel() != null ? r.reorderLevel() : 0);
        pv.setActive(true);
        pv.setQuickSale(Boolean.TRUE.equals(r.quickSale()));
        variants.save(pv);

        if (r.initialStock() != null && r.initialStock() > 0) {
            // goes through StockService so on_hand and the movement can never disagree
            stock.receive(pv, r.initialStock(), "ADJUSTMENT", null, "Initial stock setup", currentUser());
        }
        return mapper.toResponse(pv);
    }

    @Transactional
    public ProductVariantResponse updateVariant(UUID id, ProductVariantUpdateRequest r) {
        ProductVariant v = variants.findById(id).orElseThrow(() -> new NotFoundException("Variant not found"));
        ProductVariantResponse before = mapper.toResponse(v);
        if (r.variantName() != null && !r.variantName().isBlank()) v.setVariantName(r.variantName().trim());
        if (r.attributes() != null) v.setAttributes(validJson(r.attributes()));
        if (r.price() != null) v.setPrice(r.price());
        if (r.taxRate() != null) v.setTaxRate(r.taxRate());
        if (r.reorderLevel() != null) v.setReorderLevel(r.reorderLevel());
        if (r.active() != null) v.setActive(r.active());
        if (r.quickSale() != null) v.setQuickSale(r.quickSale());
        variants.save(v);
        ProductVariantResponse after = mapper.toResponse(v);
        boolean sensitive = before.price().compareTo(after.price()) != 0 || before.taxRate().compareTo(after.taxRate()) != 0;
        if (sensitive) audit.record("VARIANT_PRICE_CHANGED", "PRODUCT_VARIANT", id, before, after);   // AUTH-06
        return after;
    }

    /** SHP-06: scan a SKU or type part of a name. */
    @Transactional(readOnly = true)
    public List<ProductVariantResponse> searchVariants(String q) {
        if (q == null || q.isBlank()) return List.of();
        return variants.search(q.trim(), PageRequest.of(0, 20)).stream().map(mapper::toResponse).toList();
    }

    // ================================================================== orders (SHP-08/09/10/11/12)

    @Transactional
    public ShopOrderResponse createOrder(CreateShopOrderRequest r) {
        ShopOrder o = place(new Cmd(r.memberId(), r.guestName(), r.guestPhone(), r.fulfillmentMethod(),
                r.deliveryAddress(), r.deliveryNote(), r.items(), ShopStatus.CHANNEL_ONLINE,
                blankToNull(r.idempotencyKey())));
        return mapper.toResponse(o);
    }

    /** SHP-06: counter sale. Stock is taken immediately; reserved units cannot be sold here (AC-07). */
    @Transactional
    public ShopOrderResponse checkoutPos(PosCheckoutRequest r) {
        ShopOrder order = place(new Cmd(r.memberId(), r.guestName(), r.guestPhone(), ShopStatus.PICKUP, null, null,
                r.items(), ShopStatus.CHANNEL_COUNTER, blankToNull(r.idempotencyKey())));
        if (order.getPaidAt() != null) return mapper.toResponse(order);   // idempotent replay - never charge twice

        List<PosPaymentLine> pay;
        if (r.payments() != null && !r.payments().isEmpty()) {
            pay = r.payments();
        } else {
            if (r.paymentMethod() == null || r.paymentMethod().isBlank()) {
                throw ShopErrors.bad("Provide paymentMethod or a payments list");
            }
            pay = List.of(new PosPaymentLine(r.paymentMethod(), order.getTotal(), r.tendered(), r.paymentReference()));
        }
        BigDecimal sum = pay.stream().map(PosPaymentLine::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (sum.compareTo(order.getTotal()) != 0) {
            throw ShopErrors.bad("Payments (" + sum + ") must add up to the bill total (" + order.getTotal() + ")");
        }
        for (PosPaymentLine p : pay) {
            recordPayment(order, p.method(), p.amount(), p.tendered(), p.reference(), "POS Counter Checkout");
        }
        order.setPaidAt(clock.instant());
        orders.save(order);
        return mapper.toResponse(order);
    }

    /** Staff takes payment for an online order at the desk. */
    @Transactional
    public ShopOrderResponse payOrder(UUID orderId, PayShopOrderRequest r) {
        ShopOrder o = lock(orderId);
        if (!ShopStatus.PLACED.equals(o.getStatus())) {
            throw ShopErrors.conflict("Order " + o.getOrderNumber() + " is " + o.getStatus() + " and cannot be paid");
        }
        recordPayment(o, r.method(), o.getTotal(), r.tendered(), r.reference(), "Shop order " + o.getOrderNumber());
        markPaid(o);
        return mapper.toResponse(o);
    }

    /**
     * Call this from the payment gateway success webhook (FIN-02) - it is the ONLY way an online order becomes PAID
     * besides payOrder(). Idempotent. Throws if the order was already released/cancelled (refund the payment then).
     */
    @Transactional
    public ShopOrderResponse confirmPayment(UUID orderId) {
        ShopOrder o = lock(orderId);
        if (ShopStatus.PLACED.equals(o.getStatus())) {
            markPaid(o);
        } else if (ShopStatus.CANCELLED.equals(o.getStatus()) || ShopStatus.FAILED.equals(o.getStatus())) {
            throw ShopErrors.conflict("Order " + o.getOrderNumber() + " was cancelled before payment arrived - refund the payment");
        }
        return mapper.toResponse(o);
    }

    @Transactional
    public ShopOrderResponse updateOrderStatus(UUID orderId, UpdateShopOrderStatusRequest r) {
        String to = r.status().trim().toUpperCase(Locale.ROOT);
        switch (to) {
            case ShopStatus.PAID -> throw ShopErrors.bad("PAID is set only by a recorded payment (POST /orders/{id}/pay or the gateway)");
            case ShopStatus.CANCELLED -> throw ShopErrors.bad("Use POST /orders/{id}/cancel");
            case ShopStatus.RETURNED -> throw ShopErrors.bad("Use POST /orders/{id}/return");
            default -> {
            }
        }
        if (!ShopStatus.STAFF_SETTABLE.contains(to)) throw ShopErrors.bad("Invalid shop order status: " + r.status());

        ShopOrder o = lock(orderId);
        if (!ShopStatus.canMove(o.getStatus(), to, o.getFulfillmentMethod())) {
            throw ShopErrors.conflict("Cannot move order " + o.getOrderNumber() + " from " + o.getStatus() + " to " + to);
        }
        if (ShopStatus.COLLECTED.equals(to) && r.verificationNumber() != null
                && !r.verificationNumber().trim().equalsIgnoreCase(o.getOrderNumber())) {
            throw ShopErrors.bad("Order number does not match - wrong pickup");
        }
        if (ShopStatus.COLLECTED.equals(to) || ShopStatus.DELIVERED.equals(to)) {
            Map<UUID, ProductVariant> locked = lockVariants(o.getLines());
            AppUser actor = currentUser();
            for (ShopOrderLine l : o.getLines()) {
                stock.commitReserved(locked.get(l.getProductVariant().getId()), l.getQuantity(), l, o.getId(),
                        "Order " + o.getOrderNumber() + " " + to, actor);
            }
        }
        o.setStatus(to);
        orders.save(o);
        statusChanged(o);
        return mapper.toResponse(o);
    }

    /** Releases the reservation. A paid order needs a reason, is audited and triggers a refund request. */
    @Transactional
    public ShopOrderResponse cancelOrder(UUID orderId, String reason) {
        ShopOrder o = lock(orderId);
        if (ShopStatus.CANCELLED.equals(o.getStatus())) return mapper.toResponse(o);
        if (!ShopStatus.HOLDS_RESERVATION.contains(o.getStatus())) {
            throw ShopErrors.conflict("Order is " + o.getStatus() + " - use the return endpoint for goods already handed over");
        }
        boolean paid = o.getPaidAt() != null;
        if (paid && (reason == null || reason.isBlank())) {
            throw ShopErrors.bad("A reason is required to cancel a paid order");
        }
        ShopOrderResponse before = mapper.toResponse(o);
        cancelInternal(o, reason, currentUser());
        if (paid) audit.record("SHOP_ORDER_CANCELLED", "SHOP_ORDER", orderId, before, mapper.toResponse(o), reason);
        return mapper.toResponse(o);
    }

    /** SHP-13: returns restore stock (or write it off if damaged) and request a refund / credit note. */
    @Transactional
    public ShopOrderResponse returnOrder(UUID orderId, ReturnShopOrderRequest r) {
        ShopOrder o = lock(orderId);
        if (!ShopStatus.COLLECTED.equals(o.getStatus()) && !ShopStatus.DELIVERED.equals(o.getStatus())) {
            throw ShopErrors.conflict("Only collected or delivered orders can be returned");
        }
        ShopOrderResponse before = mapper.toResponse(o);
        AppUser actor = currentUser();
        Map<UUID, ShopOrderLine> byId = o.getLines().stream().collect(Collectors.toMap(ShopOrderLine::getId, Function.identity()));

        List<ReturnShopOrderRequest.Line> req = (r.lines() == null || r.lines().isEmpty())
                ? o.getLines().stream().filter(l -> l.getReturnedQuantity() < l.getQuantity())
                        .map(l -> new ReturnShopOrderRequest.Line(l.getId(), l.getQuantity() - l.getReturnedQuantity(), null)).toList()
                : r.lines();
        if (req.isEmpty()) throw ShopErrors.conflict("Nothing left to return on this order");

        Map<UUID, ProductVariant> locked = lockVariants(o.getLines());
        BigDecimal refund = BigDecimal.ZERO;
        for (ReturnShopOrderRequest.Line rl : req) {
            ShopOrderLine l = byId.get(rl.lineId());
            if (l == null) throw ShopErrors.bad("Line " + rl.lineId() + " does not belong to this order");
            int remaining = l.getQuantity() - l.getReturnedQuantity();
            if (rl.quantity() > remaining) {
                throw ShopErrors.bad("Only " + remaining + " of " + l.getVariantNameSnapshot() + " can still be returned");
            }
            boolean damaged = rl.damaged() != null ? rl.damaged() : Boolean.TRUE.equals(r.damaged());
            ProductVariant v = locked.get(l.getProductVariant().getId());
            String note = "Return " + o.getOrderNumber() + ": " + r.reason();
            if (damaged) stock.writeOffReturned(v, rl.quantity(), l, o.getId(), note, actor);
            else stock.restock(v, rl.quantity(), l, o.getId(), note, actor);
            l.setReturnedQuantity(l.getReturnedQuantity() + rl.quantity());
            refund = refund.add(l.getLineTotal().multiply(BigDecimal.valueOf(rl.quantity()))
                    .divide(BigDecimal.valueOf(l.getQuantity()), 2, RoundingMode.HALF_UP));
        }
        o.setRefundedTotal(o.getRefundedTotal().add(refund));
        boolean allBack = o.getLines().stream().allMatch(l -> l.getReturnedQuantity().equals(l.getQuantity()));
        if (allBack) o.setStatus(ShopStatus.RETURNED);
        orders.save(o);

        audit.record("SHOP_ORDER_RETURN", "SHOP_ORDER", orderId, before, mapper.toResponse(o), r.reason());
        if (refund.signum() > 0) {
            events.publishEvent(new ShopRefundRequested(o.getId(), o.getOrderNumber(), memberId(o), refund, r.reason()));
        }
        if (allBack) statusChanged(o);
        return mapper.toResponse(o);
    }

    @Transactional(readOnly = true)
    public ShopOrderResponse getOrder(UUID id) {
        return mapper.toResponse(orders.findById(id).orElseThrow(() -> new NotFoundException("Shop order not found")));
    }

    /** SHP-12: verify a pickup by order number / QR. */
    @Transactional(readOnly = true)
    public ShopOrderResponse getOrderByNumber(String orderNumber) {
        return mapper.toResponse(orders.findByOrderNumber(orderNumber.trim())
                .orElseThrow(() -> new NotFoundException("Shop order not found: " + orderNumber)));
    }

    /** Online-orders queue: filter by status / channel; capped at 200 (was unbounded). */
    @Transactional(readOnly = true)
    public List<ShopOrderResponse> listOrders(UUID memberId, List<String> statuses, String channel) {
        Specification<ShopOrder> spec = (root, q, cb) -> {
            List<Predicate> p = new ArrayList<>();
            if (memberId != null) p.add(cb.equal(root.get("member").get("id"), memberId));
            if (statuses != null && !statuses.isEmpty()) {
                p.add(root.get("status").in(statuses.stream().map(s -> s.trim().toUpperCase(Locale.ROOT)).toList()));
            }
            if (channel != null && !channel.isBlank()) p.add(cb.equal(root.get("channel"), channel.trim().toUpperCase(Locale.ROOT)));
            return cb.and(p.toArray(Predicate[]::new));
        };
        return orders.findAll(spec, PageRequest.of(0, 200, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent().stream().map(mapper::toResponse).toList();
    }

    // ---- SHP-10: unpaid reservations are released automatically (called by ShopReservationJob)

    @Transactional(readOnly = true)
    public List<UUID> findExpiredReservationIds() {
        Instant cutoff = clock.instant().minus(settings.reservationMinutes(), ChronoUnit.MINUTES);
        return orders.findByStatusAndChannelAndCreatedAtBefore(ShopStatus.PLACED, ShopStatus.CHANNEL_ONLINE, cutoff)
                .stream().map(ShopOrder::getId).toList();
    }

    @Transactional
    public void expireReservation(UUID orderId) {
        ShopOrder o = lock(orderId);
        if (!ShopStatus.PLACED.equals(o.getStatus())) return;   // paid in the meantime
        cancelInternal(o, "Payment not received within " + settings.reservationMinutes() + " minutes", null);
    }

    // ================================================================== inventory (SHP-03/04/05)

    @Transactional
    public StockMovementResponse recordStockMovement(StockMovementRequest r) {
        String type = r.movementType().trim().toUpperCase(Locale.ROOT);
        if (!ShopStatus.MANUAL_MOVEMENTS.contains(type)) {
            throw ShopErrors.bad("movementType must be RECEIPT, ADJUSTMENT_IN, ADJUSTMENT_OUT or DAMAGE");
        }
        if (ShopStatus.REASON_REQUIRED.contains(type) && (r.notes() == null || r.notes().isBlank())) {
            throw ShopErrors.bad("A reason (notes) is required for adjustments and damage");
        }
        ProductVariant v = variants.findAllForUpdate(List.of(r.productVariantId())).stream().findFirst()
                .orElseThrow(() -> new NotFoundException("Product variant not found"));
        ProductVariantResponse before = mapper.toResponse(v);
        StockMovement sm = stock.manual(v, type, r.quantity(), r.sourceType(), r.sourceId(), r.notes(), currentUser());
        if (ShopStatus.REASON_REQUIRED.contains(type)) {
            audit.record("STOCK_" + type, "PRODUCT_VARIANT", v.getId(), before, mapper.toResponse(v), r.notes());   // AUTH-06
        }
        return mapper.toResponse(sm);
    }

    @Transactional(readOnly = true)
    public List<StockMovementResponse> listMovements(UUID variantId) {
        List<StockMovement> list = variantId != null
                ? stockMovements.findTop200ByProductVariant_IdOrderByCreatedAtDesc(variantId)
                : stockMovements.findTop200ByOrderByCreatedAtDesc();
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getLowStockVariants() {
        return variants.findLowStock().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponse> getQuickSaleVariants() {
        List<ProductVariant> list = variants.findByIsQuickSaleTrueAndActiveTrue();
        if (list.isEmpty()) {   // fallback: last 30 days' best sellers (was: ten arbitrary variants)
            Instant since = clock.instant().minus(30, ChronoUnit.DAYS);
            List<UUID> ids = stockMovements.topSellers(since, PageRequest.of(0, 10)).stream()
                    .map(row -> (UUID) row[0]).toList();
            Map<UUID, ProductVariant> byId = variants.findAllById(ids).stream()
                    .filter(ProductVariant::isActive).collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
            list = ids.stream().map(byId::get).filter(java.util.Objects::nonNull).toList();
        }
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RestockSuggestionResponse> getRestockSuggestions() {
        Map<UUID, Integer> onOrder = poLines.onOrderByVariant().stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> ((Number) row[1]).intValue()));
        return variants.findLowStock().stream().map(v -> {
            int avail = v.getOnHand() - v.getReserved();
            int incoming = onOrder.getOrDefault(v.getId(), 0);
            int target = Math.max(10, v.getReorderLevel() * 2);
            int suggested = Math.max(0, target - avail - incoming);
            return new RestockSuggestionResponse(v.getId(),
                    v.getProduct() != null ? v.getProduct().getName() : "Product", v.getVariantName(), v.getSku(),
                    v.getOnHand(), v.getReserved(), avail, v.getReorderLevel(), incoming, suggested, v.getPrice());
        }).filter(s -> s.suggestedRestockQuantity() > 0).toList();
    }

    // ================================================================== internals

    private ShopOrder place(Cmd c) {
        if (c.key() != null) {
            var existing = orders.findByIdempotencyKey(c.key());
            if (existing.isPresent()) return existing.get();
        }
        boolean counter = ShopStatus.CHANNEL_COUNTER.equals(c.channel());
        String fulfillment = c.fulfillment() == null ? ShopStatus.PICKUP : c.fulfillment().trim().toUpperCase(Locale.ROOT);
        if (!ShopStatus.PICKUP.equals(fulfillment) && !ShopStatus.DELIVERY.equals(fulfillment)) {
            throw ShopErrors.bad("fulfillmentMethod must be PICKUP or DELIVERY");
        }
        if (ShopStatus.DELIVERY.equals(fulfillment) && (c.address() == null || c.address().isBlank())) {
            throw ShopErrors.bad("deliveryAddress is required for home delivery");
        }
        if (c.memberId() == null && !counter
                && (c.guestName() == null || c.guestName().isBlank() || c.guestPhone() == null || c.guestPhone().isBlank())) {
            throw ShopErrors.bad("Guest checkout needs a name and phone number");
        }
        AppUser actor = currentUser();

        ShopOrder order = new ShopOrder();
        order.setOrderNumber(String.format("ORD-%06d", orders.nextOrderNo()));
        order.setChannel(c.channel());
        order.setIdempotencyKey(c.key());
        order.setCreatedBy(actor);
        order.setGuestName(blankToNull(c.guestName()));
        order.setGuestPhone(blankToNull(c.guestPhone()));
        order.setFulfillmentMethod(fulfillment);
        order.setDeliveryAddress(blankToNull(c.address()));
        order.setDeliveryNote(blankToNull(c.note()));

        if (c.memberId() != null) {
            Member m = members.findById(c.memberId()).orElseThrow(() -> new NotFoundException("Member not found"));
            order.setMember(m);
            Membership active = memberships.findCurrent(m.getId(), LocalDate.now(clock.withZone(IST))).orElse(null);
            if (active != null && active.getPlan() != null && active.getPlan().getShopDiscountPercent() != null) {
                order.setDiscountPercent(active.getPlan().getShopDiscountPercent());
                order.setDiscountSource("PLAN:" + active.getPlan().getName());
            } else {
                order.setDiscountSource("NO_ACTIVE_MEMBERSHIP");
            }
        }

        Map<UUID, Integer> qty = new LinkedHashMap<>();
        for (ShopOrderLineRequest i : c.items()) qty.merge(i.productVariantId(), i.quantity(), Integer::sum);
        Map<UUID, ProductVariant> locked = variants.findAllForUpdate(qty.keySet()).stream()
                .collect(Collectors.toMap(ProductVariant::getId, Function.identity()));

        for (Map.Entry<UUID, Integer> e : qty.entrySet()) {
            ProductVariant v = locked.get(e.getKey());
            if (v == null) throw new NotFoundException("Product variant not found: " + e.getKey());
            if (!v.isActive() || !v.getProduct().isActive()) {
                throw ShopErrors.conflict(v.getVariantName() + " is not available");
            }
            ShopOrderLine l = new ShopOrderLine();
            l.setShopOrder(order);
            l.setProductVariant(v);
            l.setProductNameSnapshot(v.getProduct().getName());
            l.setVariantNameSnapshot(v.getVariantName());
            l.setSkuSnapshot(v.getSku());
            l.setHsnCode(v.getProduct().getHsnCode());
            l.setQuantity(e.getValue());
            l.setUnitPrice(v.getPrice());
            l.setTaxRate(v.getTaxRate());
            l.setTaxInclusive(v.getProduct().isTaxInclusive());
            order.getLines().add(l);
        }
        order.setDeliveryFee(!counter && ShopStatus.DELIVERY.equals(fulfillment) ? settings.deliveryFee() : BigDecimal.ZERO);
        pricing.recalculate(order);
        order.setStatus(counter ? ShopStatus.COLLECTED : ShopStatus.PLACED);
        orders.save(order);

        for (ShopOrderLine l : order.getLines()) {
            ProductVariant v = locked.get(l.getProductVariant().getId());
            String note = "Order " + order.getOrderNumber();
            if (counter) stock.sellNow(v, l.getQuantity(), l, order.getId(), note, actor);
            else stock.reserve(v, l.getQuantity(), l, order.getId(), note, actor);
        }
        statusChanged(order);
        return order;
    }

    private void recordPayment(ShopOrder order, String method, BigDecimal amount, BigDecimal tendered,
                               String reference, String description) {
        String m = method == null ? "" : method.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("CASH", "CARD", "UPI").contains(m)) throw ShopErrors.bad("Payment method must be CASH, CARD or UPI");
        if (!"CASH".equals(m) && (reference == null || reference.isBlank())) {
            throw ShopErrors.bad(m + " payments need a reference number (FIN-03)");
        }
        BigDecimal t = tendered != null ? tendered : amount;
        if ("CASH".equals(m) && t.compareTo(amount) < 0) throw ShopErrors.bad("Tendered cash is less than the amount");
        String desc = reference == null || reference.isBlank() ? description : description + " / " + reference.trim();
        // same argument order as your original checkoutPos call; the last argument stays null (see notes)
        paymentService.recordManual(new ManualPaymentRequest("SHOP", order.getId(), memberId(order), amount, m, desc, t, null));
    }

    private void markPaid(ShopOrder o) {
        o.setStatus(ShopStatus.PAID);
        o.setPaidAt(clock.instant());
        orders.save(o);
        statusChanged(o);
    }

    private void cancelInternal(ShopOrder o, String reason, AppUser actor) {
        boolean paid = o.getPaidAt() != null;
        Map<UUID, ProductVariant> locked = lockVariants(o.getLines());
        for (ShopOrderLine l : o.getLines()) {
            stock.release(locked.get(l.getProductVariant().getId()), l.getQuantity(), l, o.getId(),
                    "Order cancelled: " + (reason == null ? "" : reason), actor);
        }
        o.setStatus(ShopStatus.CANCELLED);
        if (paid) o.setRefundedTotal(o.getTotal());
        orders.save(o);
        if (paid) {
            events.publishEvent(new ShopRefundRequested(o.getId(), o.getOrderNumber(), memberId(o), o.getTotal(),
                    reason == null ? "Order cancelled" : reason));
        }
        statusChanged(o);
    }

    private Map<UUID, ProductVariant> lockVariants(List<ShopOrderLine> lines) {
        Set<UUID> ids = lines.stream().map(l -> l.getProductVariant().getId()).collect(Collectors.toSet());
        return variants.findAllForUpdate(ids).stream().collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
    }

    private ShopOrder lock(UUID id) {
        return orders.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Shop order not found"));
    }

    private void statusChanged(ShopOrder o) {
        events.publishEvent(new ShopOrderStatusChanged(o.getId(), o.getOrderNumber(), memberId(o), o.getStatus()));
    }

    private static UUID memberId(ShopOrder o) {
        return o.getMember() == null ? null : o.getMember().getId();
    }

    private String validJson(String s) {
        if (s == null || s.isBlank()) return "{}";
        try {
            JsonNode n = json.readTree(s);
            if (!n.isObject()) throw ShopErrors.bad("attributes must be a JSON object, e.g. {\"size\":\"9\"}");
            return s;
        } catch (JsonProcessingException e) {
            throw ShopErrors.bad("attributes is not valid JSON");
        }
    }

    private AppUser currentUser() {
        UUID id = audit.currentActorId();
        return id == null ? null : users.findById(id).orElse(null);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}