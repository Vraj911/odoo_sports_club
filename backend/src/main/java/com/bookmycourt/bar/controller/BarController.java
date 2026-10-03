package com.bookmycourt.bar.controller;

import com.bookmycourt.bar.dto.BarOrderLineResponse;
import com.bookmycourt.bar.dto.BarOrderResponse;
import com.bookmycourt.bar.dto.BarTableRequest;
import com.bookmycourt.bar.dto.BarTableResponse;
import com.bookmycourt.bar.dto.CreateBarOrderRequest;
import com.bookmycourt.bar.dto.MenuItemRequest;
import com.bookmycourt.bar.dto.MenuItemResponse;
import com.bookmycourt.bar.dto.UpdateBarOrderStatusRequest;
import com.bookmycourt.bar.dto.UpdateKitchenStatusRequest;
import com.bookmycourt.bar.service.BarService;
import com.bookmycourt.common.response.ApiResponse;
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
@RequestMapping("/api/bar")
public class BarController {

    private final BarService bar;

    public BarController(BarService bar) {
        this.bar = bar;
    }

    @PostMapping("/menu")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MenuItemResponse> createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        return ApiResponse.success("Menu item created", bar.createMenuItem(request));
    }

    @GetMapping("/menu")
    public ApiResponse<List<MenuItemResponse>> listMenu(@RequestParam(required = false) String category) {
        return ApiResponse.success("Menu loaded", bar.listMenuItems(category));
    }

    @PostMapping("/tables")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BarTableResponse> createTable(@Valid @RequestBody BarTableRequest request) {
        return ApiResponse.success("Table created", bar.createTable(request));
    }

    @GetMapping("/tables")
    public ApiResponse<List<BarTableResponse>> listTables() {
        return ApiResponse.success("Tables loaded", bar.listTables());
    }

    @PostMapping("/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BarOrderResponse> createOrder(@Valid @RequestBody CreateBarOrderRequest request) {
        return ApiResponse.success("Bar order created", bar.createOrder(request));
    }

    @GetMapping("/orders/{id}")
    public ApiResponse<BarOrderResponse> getOrder(@PathVariable UUID id) {
        return ApiResponse.success("Order loaded", bar.getOrder(id));
    }

    @GetMapping("/orders")
    public ApiResponse<List<BarOrderResponse>> listOrders(
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) List<String> status) {
        return ApiResponse.success("Orders loaded", bar.listOrders(memberId, status));
    }

    @PatchMapping("/orders/{id}/status")
    public ApiResponse<BarOrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBarOrderStatusRequest request) {
        return ApiResponse.success("Order status updated", bar.updateOrderStatus(id, request));
    }

    @PatchMapping("/lines/{id}/kitchen-status")
    public ApiResponse<BarOrderLineResponse> updateKitchenStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateKitchenStatusRequest request) {
        return ApiResponse.success("Kitchen status updated", bar.updateKitchenStatus(id, request));
    }

    @GetMapping("/kitchen/queue")
    public ApiResponse<List<BarOrderLineResponse>> getKitchenQueue() {
        return ApiResponse.success("Kitchen queue loaded", bar.getKitchenDisplayQueue());
    }

    @GetMapping("/kds")
    public ApiResponse<List<BarOrderLineResponse>> getKdsQueue(@RequestParam(required = false) String station) {
        return ApiResponse.success("KDS queue loaded", bar.getKdsQueue(station));
    }

    @GetMapping("/floor")
    public ApiResponse<List<com.bookmycourt.bar.dto.BarFloorTableResponse>> getFloorPlan() {
        return ApiResponse.success("Bar floor plan loaded", bar.getFloorPlan());
    }

    @GetMapping("/orders/{id}/split")
    public ApiResponse<com.bookmycourt.bar.dto.SplitBillResponse> splitBill(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "2") int ways) {
        return ApiResponse.success("Bill split calculated", bar.splitBill(id, ways));
    }

    @PostMapping("/shifts/open")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<com.bookmycourt.bar.dto.CashShiftResponse> openShift(@Valid @RequestBody com.bookmycourt.bar.dto.OpenShiftRequest request) {
        return ApiResponse.success("Shift opened", bar.openShift(request));
    }

    @PostMapping("/shifts/{id}/close")
    public ApiResponse<com.bookmycourt.bar.dto.CashShiftResponse> closeShift(
            @PathVariable UUID id,
            @Valid @RequestBody com.bookmycourt.bar.dto.CloseShiftRequest request) {
        return ApiResponse.success("Shift closed", bar.closeShift(id, request));
    }

    @GetMapping("/shifts/current")
    public ApiResponse<com.bookmycourt.bar.dto.CashShiftResponse> getCurrentShift(@RequestParam UUID staffUserId) {
        return ApiResponse.success("Current shift loaded", bar.getCurrentShift(staffUserId));
    }

    @PostMapping("/tables/{id}/transfer")
    public ApiResponse<BarOrderResponse> transferTable(
            @PathVariable UUID id,
            @RequestParam UUID orderId) {
        return ApiResponse.success("Table transferred", bar.transferTable(orderId, id));
    }
}
