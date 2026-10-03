package com.bookmycourt.shop.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.shop.dto.CreateShopOrderRequest;
import com.bookmycourt.shop.dto.ProductRequest;
import com.bookmycourt.shop.dto.ProductResponse;
import com.bookmycourt.shop.dto.ProductVariantRequest;
import com.bookmycourt.shop.dto.ProductVariantResponse;
import com.bookmycourt.shop.dto.ShopOrderResponse;
import com.bookmycourt.shop.dto.StockMovementRequest;
import com.bookmycourt.shop.dto.StockMovementResponse;
import com.bookmycourt.shop.dto.UpdateShopOrderStatusRequest;
import com.bookmycourt.shop.service.ShopService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/shop", "/api"})
public class ShopController {

    private final ShopService shop;

    public ShopController(ShopService shop) {
        this.shop = shop;
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ApiResponse.success("Product created", shop.createProduct(request));
    }

    @GetMapping({"/products", "/public/products"})
    public ApiResponse<List<ProductResponse>> listProducts(@RequestParam(required = false) String category) {
        return ApiResponse.success("Products loaded", shop.listProducts(category));
    }

    @GetMapping("/products/{id}")
    public ApiResponse<ProductResponse> getProduct(@PathVariable UUID id) {
        return ApiResponse.success("Product loaded", shop.getProduct(id));
    }

    @PostMapping("/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductVariantResponse> addVariant(@Valid @RequestBody ProductVariantRequest request) {
        return ApiResponse.success("Variant added", shop.addVariant(request));
    }

    @GetMapping("/inventory/low-stock")
    public ApiResponse<List<ProductVariantResponse>> getLowStock() {
        return ApiResponse.success("Low stock variants loaded", shop.getLowStockVariants());
    }

    @PostMapping("/inventory/movement")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StockMovementResponse> recordMovement(@Valid @RequestBody StockMovementRequest request) {
        return ApiResponse.success("Stock movement recorded", shop.recordStockMovement(request));
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ShopOrderResponse> placeOrder(@Valid @RequestBody CreateShopOrderRequest request) {
        return ApiResponse.success("Order placed successfully", shop.createOrder(request));
    }

    @GetMapping("/orders/{id}")
    public ApiResponse<ShopOrderResponse> getOrder(@PathVariable UUID id) {
        return ApiResponse.success("Order loaded", shop.getOrder(id));
    }

    @GetMapping("/orders")
    public ApiResponse<List<ShopOrderResponse>> listOrders(@RequestParam(required = false) UUID memberId) {
        return ApiResponse.success("Orders loaded", shop.listOrders(memberId));
    }

    @PatchMapping("/orders/{id}/status")
    public ApiResponse<ShopOrderResponse> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateShopOrderStatusRequest request) {
        return ApiResponse.success("Order status updated", shop.updateOrderStatus(id, request));
    }

    @PostMapping("/pos/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ShopOrderResponse> checkoutPos(@Valid @RequestBody com.bookmycourt.shop.dto.PosCheckoutRequest request) {
        return ApiResponse.success("POS checkout completed", shop.checkoutPos(request));
    }

    @PostMapping("/orders/{id}/cancel")
    public ApiResponse<ShopOrderResponse> cancelOrder(
            @PathVariable UUID id,
            @RequestBody(required = false) java.util.Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        return ApiResponse.success("Order cancelled", shop.cancelOrder(id, reason));
    }

    @GetMapping("/quick-sale")
    public ApiResponse<List<ProductVariantResponse>> getQuickSale() {
        return ApiResponse.success("Quick sale items loaded", shop.getQuickSaleVariants());
    }

    @GetMapping("/inventory/restock-suggestions")
    public ApiResponse<List<com.bookmycourt.shop.dto.RestockSuggestionResponse>> getRestockSuggestions() {
        return ApiResponse.success("Restock suggestions loaded", shop.getRestockSuggestions());
    }
}
