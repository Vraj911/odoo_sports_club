package com.bookmycourt.shop.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.shop.dto.CreateShopOrderRequest;
import com.bookmycourt.shop.dto.InventorySummaryResponse;
import com.bookmycourt.shop.dto.PayShopOrderRequest;
import com.bookmycourt.shop.dto.PosCheckoutRequest;
import com.bookmycourt.shop.dto.ProductRequest;
import com.bookmycourt.shop.dto.ProductResponse;
import com.bookmycourt.shop.dto.ProductVariantRequest;
import com.bookmycourt.shop.dto.ProductVariantResponse;
import com.bookmycourt.shop.dto.ProductVariantUpdateRequest;
import com.bookmycourt.shop.dto.PublicProductResponse;
import com.bookmycourt.shop.dto.PurchaseOrderRequest;
import com.bookmycourt.shop.dto.PurchaseOrderResponse;
import com.bookmycourt.shop.dto.ReasonRequest;
import com.bookmycourt.shop.dto.ReceivePurchaseRequest;
import com.bookmycourt.shop.dto.RestockSuggestionResponse;
import com.bookmycourt.shop.dto.ReturnShopOrderRequest;
import com.bookmycourt.shop.dto.ShopOrderResponse;
import com.bookmycourt.shop.dto.ShopSalesReportResponse;
import com.bookmycourt.shop.dto.StockMovementRequest;
import com.bookmycourt.shop.dto.StockMovementResponse;
import com.bookmycourt.shop.dto.SupplierRequest;
import com.bookmycourt.shop.dto.SupplierResponse;
import com.bookmycourt.shop.dto.UpdateShopOrderStatusRequest;
import com.bookmycourt.shop.service.PurchaseService;
import com.bookmycourt.shop.service.ShopReportService;
import com.bookmycourt.shop.service.ShopService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * AUTH-02: every endpoint is role-guarded; the public catalog and guest checkout are explicitly permitAll
 * (they must ALSO be permitted in your SecurityFilterChain URL rules).
 * ASSUMPTION: roles SHOP_STAFF, MANAGER, ADMIN, OWNER, ACCOUNTANT (authority ROLE_*). Needs @EnableMethodSecurity.
 * The class keeps both base paths ("/api/shop" and "/api") so existing React calls keep working.
 */
@RestController
@RequestMapping({"/api/shop", "/api"})
@PreAuthorize("hasAnyRole('SHOP_STAFF','MANAGER','ADMIN','OWNER')")
public class ShopController {

    private static final String MANAGER = "hasAnyRole('MANAGER','ADMIN','OWNER')";
    private static final String REPORTS = "hasAnyRole('MANAGER','ADMIN','OWNER','ACCOUNTANT')";
    private static final String PUBLIC = "permitAll()";

    private final ShopService shop;
    private final ShopReportService reports;
    private final PurchaseService purchases;

    public ShopController(ShopService shop, ShopReportService reports, PurchaseService purchases) {
        this.shop = shop;
        this.reports = reports;
        this.purchases = purchases;
    }

    // ------------------------------------------------------------ catalog (SHP-01/02, WEB-04)
    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(MANAGER)
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.success("Product created", shop.createProduct(request));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize(MANAGER)
    public ApiResponse<ProductResponse> updateProduct(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return ApiResponse.success("Product updated", shop.updateProduct(id, request));
    }

    @PatchMapping("/products/{id}/active")
    @PreAuthorize(MANAGER)
    public ApiResponse<ProductResponse> setProductActive(@PathVariable UUID id, @RequestParam boolean active) {
        return ApiResponse.success("Product updated", shop.setProductActive(id, active));
    }

    /** Staff view with stock numbers. Members / visitors use the catalog endpoints below. */
    @GetMapping("/products")
    public ApiResponse<List<ProductResponse>> listProducts(@RequestParam(required = false) String category) {
        return ApiResponse.success("Products loaded", shop.listProducts(category));
    }

    @GetMapping("/products/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable UUID id) {
        return ApiResponse.success("Product loaded", shop.getProduct(id));
    }

    /** Price + stock status only (no on-hand / reserved numbers). */
    @GetMapping({"/public/products", "/products/catalog"})
    @PreAuthorize(PUBLIC)
    public ApiResponse<List<PublicProductResponse>> catalog(@RequestParam(required = false) String category) {
        return ApiResponse.success("Catalog loaded", shop.listCatalog(category));
    }

    @PostMapping("/variants")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(MANAGER)
    public ApiResponse<ProductVariantResponse> addVariant(@Valid @RequestBody ProductVariantRequest request) {
        return ApiResponse.success("Variant added", shop.addVariant(request));
    }

    @PutMapping("/variants/{id}")
    @PreAuthorize(MANAGER)
    public ApiResponse<ProductVariantResponse> updateVariant(@PathVariable UUID id,
                                                             @Valid @RequestBody ProductVariantUpdateRequest request) {
        return ApiResponse.success("Variant updated", shop.updateVariant(id, request));
    }

    /** SHP-06: scan a SKU or type part of a name. */
    @GetMapping("/variants/search")
    public ApiResponse<List<ProductVariantResponse>> searchVariants(@RequestParam String q) {
        return ApiResponse.success("Search results", shop.searchVariants(q));
    }

    @GetMapping("/quick-sale")
    public ApiResponse<List<ProductVariantResponse>> getQuickSale() {
        return ApiResponse.success("Quick sale items loaded", shop.getQuickSaleVariants());
    }

    // ------------------------------------------------------------ inventory (SHP-03/04/05)
    @GetMapping("/inventory/low-stock")
    public ApiResponse<List<ProductVariantResponse>> getLowStock() {
        return ApiResponse.success("Low stock variants loaded", shop.getLowStockVariants());
    }

    @GetMapping("/inventory/restock-suggestions")
    public ApiResponse<List<RestockSuggestionResponse>> getRestockSuggestions() {
        return ApiResponse.success("Restock suggestions loaded", shop.getRestockSuggestions());
    }

    @PostMapping("/inventory/movement")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StockMovementResponse> recordMovement(@Valid @RequestBody StockMovementRequest request) {
        return ApiResponse.success("Stock movement recorded", shop.recordStockMovement(request));
    }

    @GetMapping("/inventory/movements")
    public ApiResponse<List<StockMovementResponse>> listMovements(@RequestParam(required = false) UUID variantId) {
        return ApiResponse.success("Stock movements loaded", shop.listMovements(variantId));
    }

    @GetMapping("/inventory/summary")
    @PreAuthorize(REPORTS)
    public ApiResponse<InventorySummaryResponse> inventorySummary() {
        return ApiResponse.success("Inventory summary loaded", reports.inventorySummary());
    }

    @GetMapping("/inventory/dead-stock")
    @PreAuthorize(REPORTS)
    public ApiResponse<List<ProductVariantResponse>> deadStock(@RequestParam(defaultValue = "90") int days) {
        return ApiResponse.success("Dead stock loaded", reports.deadStock(days));
    }

    // ------------------------------------------------------------ orders (SHP-08..13)
    /** Online checkout - members and guests (guest needs name + phone). */
    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(PUBLIC)
    public ApiResponse<ShopOrderResponse> placeOrder(@Valid @RequestBody CreateShopOrderRequest request) {
        return ApiResponse.success("Order placed successfully", shop.createOrder(request));
    }

    @GetMapping("/orders/{id}")
    public ApiResponse<ShopOrderResponse> getOrder(@PathVariable UUID id) {
        return ApiResponse.success("Order loaded", shop.getOrder(id));
    }

    @GetMapping("/orders/by-number/{orderNumber}")
    public ApiResponse<ShopOrderResponse> getByNumber(@PathVariable String orderNumber) {
        return ApiResponse.success("Order loaded", shop.getOrderByNumber(orderNumber));
    }

    /** Online-orders queue: ?status=PAID&status=PACKED&channel=ONLINE */
    @GetMapping("/orders")
    public ApiResponse<List<ShopOrderResponse>> listOrders(@RequestParam(required = false) UUID memberId,
                                                           @RequestParam(required = false) List<String> status,
                                                           @RequestParam(required = false) String channel) {
        return ApiResponse.success("Orders loaded", shop.listOrders(memberId, status, channel));
    }

    @PatchMapping("/orders/{id}/status")
    public ApiResponse<ShopOrderResponse> updateStatus(@PathVariable UUID id,
                                                       @Valid @RequestBody UpdateShopOrderStatusRequest request) {
        return ApiResponse.success("Order status updated", shop.updateOrderStatus(id, request));
    }

    @PostMapping("/orders/{id}/pay")
    public ApiResponse<ShopOrderResponse> payOrder(@PathVariable UUID id, @Valid @RequestBody PayShopOrderRequest request) {
        return ApiResponse.success("Payment recorded", shop.payOrder(id, request));
    }

    @PostMapping("/orders/{id}/cancel")
    public ApiResponse<ShopOrderResponse> cancelOrder(@PathVariable UUID id,
                                                      @Valid @RequestBody(required = false) ReasonRequest body) {
        return ApiResponse.success("Order cancelled", shop.cancelOrder(id, body == null ? null : body.reason()));
    }

    /** SHP-13: manager only - restores stock (or writes off damaged) and requests the refund / credit note. */
    @PostMapping("/orders/{id}/return")
    @PreAuthorize(MANAGER)
    public ApiResponse<ShopOrderResponse> returnOrder(@PathVariable UUID id, @Valid @RequestBody ReturnShopOrderRequest request) {
        return ApiResponse.success("Return processed", shop.returnOrder(id, request));
    }

    @PostMapping("/pos/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ShopOrderResponse> checkoutPos(@Valid @RequestBody PosCheckoutRequest request) {
        return ApiResponse.success("POS checkout completed", shop.checkoutPos(request));
    }

    // ------------------------------------------------------------ reports (SHP-16)
    @GetMapping("/reports/sales")
    @PreAuthorize(REPORTS)
    public ApiResponse<ShopSalesReportResponse> salesReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.success("Sales report loaded", reports.sales(from, to));
    }

    // ------------------------------------------------------------ suppliers & purchase orders (SHP-14)
    @PostMapping("/suppliers")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(MANAGER)
    public ApiResponse<SupplierResponse> createSupplier(@Valid @RequestBody SupplierRequest request) {
        return ApiResponse.success("Supplier created", purchases.createSupplier(request));
    }

    @GetMapping("/suppliers")
    public ApiResponse<List<SupplierResponse>> listSuppliers() {
        return ApiResponse.success("Suppliers loaded", purchases.listSuppliers());
    }

    @PostMapping("/purchase-orders")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(MANAGER)
    public ApiResponse<PurchaseOrderResponse> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        return ApiResponse.success("Purchase order created", purchases.createPurchaseOrder(request));
    }

    @GetMapping("/purchase-orders")
    public ApiResponse<List<PurchaseOrderResponse>> listPurchaseOrders(@RequestParam(required = false) String status) {
        return ApiResponse.success("Purchase orders loaded", purchases.list(status));
    }

    @GetMapping("/purchase-orders/{id}")
    public ApiResponse<PurchaseOrderResponse> getPurchaseOrder(@PathVariable UUID id) {
        return ApiResponse.success("Purchase order loaded", purchases.get(id));
    }

    @PostMapping("/purchase-orders/{id}/receive")
    public ApiResponse<PurchaseOrderResponse> receivePurchase(@PathVariable UUID id,
                                                              @Valid @RequestBody ReceivePurchaseRequest request) {
        return ApiResponse.success("Goods received", purchases.receive(id, request));
    }

    @PostMapping("/purchase-orders/{id}/cancel")
    @PreAuthorize(MANAGER)
    public ApiResponse<PurchaseOrderResponse> cancelPurchase(@PathVariable UUID id,
                                                             @Valid @RequestBody(required = false) ReasonRequest body) {
        return ApiResponse.success("Purchase order cancelled", purchases.cancel(id, body == null ? null : body.reason()));
    }
}