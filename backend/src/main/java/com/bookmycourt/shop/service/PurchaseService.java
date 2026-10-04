package com.bookmycourt.shop.service;

import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.shop.dto.PurchaseOrderRequest;
import com.bookmycourt.shop.dto.PurchaseOrderResponse;
import com.bookmycourt.shop.dto.ReceivePurchaseRequest;
import com.bookmycourt.shop.dto.SupplierRequest;
import com.bookmycourt.shop.dto.SupplierResponse;
import com.bookmycourt.shop.entity.ProductVariant;
import com.bookmycourt.shop.entity.PurchaseOrder;
import com.bookmycourt.shop.entity.PurchaseOrderLine;
import com.bookmycourt.shop.entity.Supplier;
import com.bookmycourt.shop.event.PurchaseReceived;
import com.bookmycourt.shop.repository.ProductVariantRepository;
import com.bookmycourt.shop.repository.PurchaseOrderRepository;
import com.bookmycourt.shop.repository.SupplierRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/** SHP-14: suppliers, purchase orders, receiving goods (stock-in), supplier bill hand-off to finance. */
@Service
public class PurchaseService {

    private final SupplierRepository suppliers;
    private final PurchaseOrderRepository purchaseOrders;
    private final ProductVariantRepository variants;
    private final AppUserRepository users;
    private final StockService stock;
    private final AuditService audit;
    private final ApplicationEventPublisher events;

    public PurchaseService(SupplierRepository suppliers, PurchaseOrderRepository purchaseOrders,
                           ProductVariantRepository variants, AppUserRepository users, StockService stock,
                           AuditService audit, ApplicationEventPublisher events) {
        this.suppliers = suppliers;
        this.purchaseOrders = purchaseOrders;
        this.variants = variants;
        this.users = users;
        this.stock = stock;
        this.audit = audit;
        this.events = events;
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest r) {
        if (suppliers.existsByNameIgnoreCase(r.name().trim())) {
            throw ShopErrors.conflict("Supplier '" + r.name().trim() + "' already exists");
        }
        Supplier s = new Supplier();
        s.setName(r.name().trim());
        s.setGstin(blankToNull(r.gstin()));
        s.setPhone(blankToNull(r.phone()));
        s.setEmail(blankToNull(r.email()));
        s.setAddress(blankToNull(r.address()));
        suppliers.save(s);
        return toResponse(s);
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> listSuppliers() {
        return suppliers.findByActiveTrueOrderByNameAsc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest r) {
        Supplier supplier = suppliers.findById(r.supplierId())
                .orElseThrow(() -> new NotFoundException("Supplier not found"));
        if (!supplier.isActive()) throw ShopErrors.conflict("Supplier is inactive");

        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(String.format("PO-%06d", purchaseOrders.nextPoNo()));
        po.setSupplier(supplier);
        po.setNotes(blankToNull(r.notes()));
        po.setCreatedBy(currentUser());
        for (PurchaseOrderRequest.Line l : r.lines()) {
            ProductVariant v = variants.findById(l.productVariantId())
                    .orElseThrow(() -> new NotFoundException("Product variant not found: " + l.productVariantId()));
            PurchaseOrderLine line = new PurchaseOrderLine();
            line.setPurchaseOrder(po);
            line.setProductVariant(v);
            line.setOrderedQuantity(l.quantity());
            line.setUnitCost(l.unitCost());
            po.getLines().add(line);
        }
        purchaseOrders.save(po);
        PurchaseOrderResponse res = toResponse(po);
        audit.record("PURCHASE_ORDER_CREATED", "PURCHASE_ORDER", po.getId(), null, res);
        return res;
    }

    /** Receive goods: stock-in per line (partial allowed), then hand the received value to finance. */
    @Transactional
    public PurchaseOrderResponse receive(UUID poId, ReceivePurchaseRequest r) {
        PurchaseOrder po = purchaseOrders.findByIdForUpdate(poId)
                .orElseThrow(() -> new NotFoundException("Purchase order not found"));
        if ("CANCELLED".equals(po.getStatus()) || "RECEIVED".equals(po.getStatus())) {
            throw ShopErrors.conflict("Purchase order " + po.getPoNumber() + " is " + po.getStatus());
        }
        PurchaseOrderResponse before = toResponse(po);
        AppUser actor = currentUser();
        Map<UUID, PurchaseOrderLine> byId = po.getLines().stream()
                .collect(Collectors.toMap(PurchaseOrderLine::getId, Function.identity()));
        Map<UUID, ProductVariant> locked = variants.findAllForUpdate(
                po.getLines().stream().map(l -> l.getProductVariant().getId()).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(ProductVariant::getId, Function.identity()));

        BigDecimal receivedNow = BigDecimal.ZERO;
        for (ReceivePurchaseRequest.Line rl : r.lines()) {
            PurchaseOrderLine l = byId.get(rl.lineId());
            if (l == null) throw ShopErrors.bad("Line " + rl.lineId() + " is not on this purchase order");
            int remaining = l.getOrderedQuantity() - l.getReceivedQuantity();
            if (rl.quantity() > remaining) {
                throw ShopErrors.bad("Only " + remaining + " more of " + l.getProductVariant().getVariantName() + " are expected");
            }
            stock.receive(locked.get(l.getProductVariant().getId()), rl.quantity(), "PURCHASE_ORDER", po.getId(),
                    "PO " + po.getPoNumber(), actor);
            l.setReceivedQuantity(l.getReceivedQuantity() + rl.quantity());
            receivedNow = receivedNow.add(l.getUnitCost().multiply(BigDecimal.valueOf(rl.quantity())));
        }
        boolean complete = po.getLines().stream().allMatch(l -> l.getReceivedQuantity().equals(l.getOrderedQuantity()));
        po.setStatus(complete ? "RECEIVED" : "PARTIALLY_RECEIVED");
        if (r.supplierInvoiceNo() != null && !r.supplierInvoiceNo().isBlank()) {
            po.setSupplierInvoiceNo(r.supplierInvoiceNo().trim());
        }
        purchaseOrders.save(po);

        PurchaseOrderResponse after = toResponse(po);
        audit.record("PURCHASE_RECEIVED", "PURCHASE_ORDER", poId, before, after);
        events.publishEvent(new PurchaseReceived(po.getId(), po.getPoNumber(), po.getSupplier().getId(),
                po.getSupplier().getName(), receivedNow, po.getSupplierInvoiceNo()));
        return after;
    }

    @Transactional
    public PurchaseOrderResponse cancel(UUID poId, String reason) {
        PurchaseOrder po = purchaseOrders.findByIdForUpdate(poId)
                .orElseThrow(() -> new NotFoundException("Purchase order not found"));
        boolean anyReceived = po.getLines().stream().anyMatch(l -> l.getReceivedQuantity() > 0);
        if (anyReceived || "CANCELLED".equals(po.getStatus()) || "RECEIVED".equals(po.getStatus())) {
            throw ShopErrors.conflict("Purchase order " + po.getPoNumber() + " can no longer be cancelled");
        }
        po.setStatus("CANCELLED");
        purchaseOrders.save(po);
        audit.record("PURCHASE_ORDER_CANCELLED", "PURCHASE_ORDER", poId, null, toResponse(po), reason);
        return toResponse(po);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> list(String status) {
        List<PurchaseOrder> list = status == null || status.isBlank()
                ? purchaseOrders.findTop100ByOrderByCreatedAtDesc()
                : purchaseOrders.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        return list.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse get(UUID id) {
        return toResponse(purchaseOrders.findById(id).orElseThrow(() -> new NotFoundException("Purchase order not found")));
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder po) {
        BigDecimal ordered = po.getLines().stream()
                .map(l -> l.getUnitCost().multiply(BigDecimal.valueOf(l.getOrderedQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal received = po.getLines().stream()
                .map(l -> l.getUnitCost().multiply(BigDecimal.valueOf(l.getReceivedQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<PurchaseOrderResponse.Line> lines = po.getLines().stream().map(l -> new PurchaseOrderResponse.Line(
                l.getId(), l.getProductVariant().getId(), l.getProductVariant().getProduct().getName(),
                l.getProductVariant().getVariantName(), l.getProductVariant().getSku(),
                l.getOrderedQuantity(), l.getReceivedQuantity(), l.getUnitCost())).toList();
        return new PurchaseOrderResponse(po.getId(), po.getPoNumber(), po.getSupplier().getId(),
                po.getSupplier().getName(), po.getStatus(), po.getNotes(), po.getSupplierInvoiceNo(),
                ordered, received, lines, po.getCreatedAt());
    }

    private SupplierResponse toResponse(Supplier s) {
        return new SupplierResponse(s.getId(), s.getName(), s.getGstin(), s.getPhone(), s.getEmail(),
                s.getAddress(), s.isActive());
    }

    private AppUser currentUser() {
        UUID id = audit.currentActorId();
        return id == null ? null : users.findById(id).orElse(null);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
