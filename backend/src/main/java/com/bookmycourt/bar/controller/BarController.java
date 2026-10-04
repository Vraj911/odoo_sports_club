package com.bookmycourt.bar.controller;

import com.bookmycourt.bar.dto.AddOrderItemsRequest;
import com.bookmycourt.bar.dto.AttachMemberRequest;
import com.bookmycourt.bar.dto.AvailabilityRequest;
import com.bookmycourt.bar.dto.BarFloorTableResponse;
import com.bookmycourt.bar.dto.BarOrderResponse;
import com.bookmycourt.bar.dto.BarOrderLineResponse;
import com.bookmycourt.bar.dto.BarTableRequest;
import com.bookmycourt.bar.dto.BarTableResponse;
import com.bookmycourt.bar.dto.CashMovementRequest;
import com.bookmycourt.bar.dto.CashShiftResponse;
import com.bookmycourt.bar.dto.CloseShiftRequest;
import com.bookmycourt.bar.dto.CreateBarOrderRequest;
import com.bookmycourt.bar.dto.DailyReportResponse;
import com.bookmycourt.bar.dto.KdsLineResponse;
import com.bookmycourt.bar.dto.MenuItemRequest;
import com.bookmycourt.bar.dto.MenuItemResponse;
import com.bookmycourt.bar.dto.MergeOrdersRequest;
import com.bookmycourt.bar.dto.OpenShiftRequest;
import com.bookmycourt.bar.dto.OpenTabRequest;
import com.bookmycourt.bar.dto.PayOrderRequest;
import com.bookmycourt.bar.dto.PayOrderResponse;
import com.bookmycourt.bar.dto.ReasonRequest;
import com.bookmycourt.bar.dto.SplitBillResponse;
import com.bookmycourt.bar.dto.SplitByItemsRequest;
import com.bookmycourt.bar.dto.TabResponse;
import com.bookmycourt.bar.dto.TabSettleResponse;
import com.bookmycourt.bar.dto.UpdateBarOrderStatusRequest;
import com.bookmycourt.bar.dto.UpdateKitchenStatusRequest;
import com.bookmycourt.bar.service.BarEventHub;
import com.bookmycourt.bar.service.BarPaymentService;
import com.bookmycourt.bar.service.BarReportService;
import com.bookmycourt.bar.service.BarService;
import com.bookmycourt.bar.service.BarShiftService;
import com.bookmycourt.bar.service.BarTabService;
import com.bookmycourt.common.response.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * AUTH-02: every endpoint is role-guarded.
 * ASSUMPTION: roles BAR_STAFF, KITCHEN, MANAGER, ACCOUNTANT, ADMIN, OWNER (authority ROLE_*). Adjust to your enum.
 * Requires @EnableMethodSecurity.
 */
@RestController
@RequestMapping("/api/bar")
@PreAuthorize("hasAnyRole('BAR_STAFF','MANAGER')")
public class BarController {

    private static final String MANAGER = "hasRole('MANAGER')";
    private static final String KITCHEN_OR_BAR = "hasAnyRole('KITCHEN','BAR_STAFF','MANAGER')";
    private static final String REPORTS = "hasAnyRole('MANAGER','ACCOUNTANT')";

    private final BarService bar;
    private final BarPaymentService payments;
    private final BarTabService tabs;
    private final BarShiftService shifts;
    private final BarReportService reports;
    private final BarEventHub hub;

    public BarController(BarService bar, BarPaymentService payments, BarTabService tabs,
                         BarShiftService shifts, BarReportService reports, BarEventHub hub) {
        this.bar = bar;
        this.payments = payments;
        this.tabs = tabs;
        this.shifts = shifts;
        this.reports = reports;
        this.hub = hub;
    }

    // ------------------------------------------------------------ real-time (BAR-03, NFR-02)
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @PreAuthorize(KITCHEN_OR_BAR)
    public SseEmitter stream() {
        return hub.subscribe();
    }

    // ------------------------------------------------------------ menu (BAR-01)
    @PostMapping("/menu")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(MANAGER)
    public ApiResponse<MenuItemResponse> createMenuItem(@Valid @RequestBody MenuItemRequest request) {
        return ApiResponse.success("Menu item created", bar.createMenuItem(request));
    }

    @PutMapping("/menu/{id}")
    @PreAuthorize(MANAGER)
    public ApiResponse<MenuItemResponse> updateMenuItem(@PathVariable UUID id, @Valid @RequestBody MenuItemRequest request) {
        return ApiResponse.success("Menu item updated", bar.updateMenuItem(id, request));
    }

    @PatchMapping("/menu/{id}/availability")
    public ApiResponse<MenuItemResponse> setAvailability(@PathVariable UUID id, @Valid @RequestBody AvailabilityRequest request) {
        return ApiResponse.success("Availability updated", bar.setAvailability(id, request.available()));
    }

    @GetMapping("/menu")
    public ApiResponse<List<MenuItemResponse>> listMenu(@RequestParam(required = false) String category,
                                                        @RequestParam(defaultValue = "false") boolean includeUnavailable) {
        return ApiResponse.success("Menu loaded", bar.listMenuItems(category, includeUnavailable));
    }

    // ------------------------------------------------------------ tables (BAR-02)
    @PostMapping("/tables")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize(MANAGER)
    public ApiResponse<BarTableResponse> createTable(@Valid @RequestBody BarTableRequest request) {
        return ApiResponse.success("Table created", bar.createTable(request));
    }

    @PutMapping("/tables/{id}")
    public ApiResponse<BarTableResponse> updateTable(@PathVariable UUID id, @Valid @RequestBody BarTableRequest request) {
        return ApiResponse.success("Table updated", bar.updateTable(id, request));
    }

    @GetMapping("/tables")
    public ApiResponse<List<BarTableResponse>> listTables() {
        return ApiResponse.success("Tables loaded", bar.listTables());
    }

    @GetMapping("/floor")
    public ApiResponse<List<BarFloorTableResponse>> getFloorPlan() {
        return ApiResponse.success("Bar floor plan loaded", bar.getFloorPlan());
    }

    @PostMapping("/tables/{id}/transfer")
    public ApiResponse<BarOrderResponse> transferTable(@PathVariable UUID id, @RequestParam UUID orderId) {
        return ApiResponse.success("Table transferred", bar.transferTable(orderId, id));
    }

    // ------------------------------------------------------------ orders (BAR-03/05/08)
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
    public ApiResponse<List<BarOrderResponse>> listOrders(@RequestParam(required = false) UUID memberId,
                                                          @RequestParam(required = false) List<String> status) {
        return ApiResponse.success("Orders loaded", bar.listOrders(memberId, status));
    }

    @PostMapping("/orders/{id}/items")
    public ApiResponse<BarOrderResponse> addItems(@PathVariable UUID id, @Valid @RequestBody AddOrderItemsRequest request) {
        return ApiResponse.success("Items added", bar.addItems(id, request));
    }

    @DeleteMapping("/orders/{id}/lines/{lineId}")
    public ApiResponse<BarOrderResponse> removeLine(@PathVariable UUID id, @PathVariable UUID lineId) {
        return ApiResponse.success("Item removed", bar.removeLine(id, lineId));
    }

    @PatchMapping("/orders/{id}/member")
    public ApiResponse<BarOrderResponse> attachMember(@PathVariable UUID id, @Valid @RequestBody AttachMemberRequest request) {
        return ApiResponse.success("Member attached", bar.attachMember(id, request.memberId()));
    }

    @PostMapping("/orders/{id}/request-bill")
    public ApiResponse<BarOrderResponse> requestBill(@PathVariable UUID id) {
        return ApiResponse.success("Bill requested", bar.requestBill(id));
    }

    @PatchMapping("/orders/{id}/status")
    public ApiResponse<BarOrderResponse> updateOrderStatus(@PathVariable UUID id,
                                                           @Valid @RequestBody UpdateBarOrderStatusRequest request) {
        return ApiResponse.success("Order status updated", bar.updateOrderStatus(id, request));
    }

    @PostMapping("/orders/{id}/merge")
    public ApiResponse<BarOrderResponse> merge(@PathVariable UUID id, @Valid @RequestBody MergeOrdersRequest request) {
        return ApiResponse.success("Orders merged", bar.mergeOrders(id, request.targetOrderId()));
    }

    @GetMapping("/orders/{id}/split")
    public ApiResponse<SplitBillResponse> splitBill(@PathVariable UUID id, @RequestParam(defaultValue = "2") int ways) {
        return ApiResponse.success("Bill split calculated", bar.splitBill(id, ways));
    }

    @PostMapping("/orders/{id}/split-by-items")
    public ApiResponse<SplitBillResponse> splitByItems(@PathVariable UUID id, @Valid @RequestBody SplitByItemsRequest request) {
        return ApiResponse.success("Bill split calculated", bar.splitByItems(id, request.groups()));
    }

    // ------------------------------------------------------------ payments (BAR-09)
    @PostMapping("/orders/{id}/pay")
    public ApiResponse<PayOrderResponse> pay(@PathVariable UUID id, @Valid @RequestBody PayOrderRequest request) {
        return ApiResponse.success("Payment recorded", payments.payOrder(id, request));
    }

    // ------------------------------------------------------------ void / comp (BAR-14) - manager only
    @PostMapping("/orders/{id}/lines/{lineId}/void")
    @PreAuthorize(MANAGER)
    public ApiResponse<BarOrderResponse> voidLine(@PathVariable UUID id, @PathVariable UUID lineId,
                                                  @Valid @RequestBody ReasonRequest request) {
        return ApiResponse.success("Item voided", bar.voidLine(id, lineId, request.reason()));
    }

    @PostMapping("/orders/{id}/lines/{lineId}/comp")
    @PreAuthorize(MANAGER)
    public ApiResponse<BarOrderResponse> compLine(@PathVariable UUID id, @PathVariable UUID lineId,
                                                  @Valid @RequestBody ReasonRequest request) {
        return ApiResponse.success("Item comped", bar.compLine(id, lineId, request.reason()));
    }

    @PostMapping("/orders/{id}/void")
    @PreAuthorize(MANAGER)
    public ApiResponse<BarOrderResponse> voidOrder(@PathVariable UUID id, @Valid @RequestBody ReasonRequest request) {
        return ApiResponse.success("Order voided", bar.voidOrder(id, request.reason()));
    }

    // ------------------------------------------------------------ kitchen (BAR-04)
    @PatchMapping("/lines/{id}/kitchen-status")
    @PreAuthorize(KITCHEN_OR_BAR)
    public ApiResponse<BarOrderLineResponse> updateKitchenStatus(@PathVariable UUID id,
                                                                 @Valid @RequestBody UpdateKitchenStatusRequest request) {
        return ApiResponse.success("Kitchen status updated", bar.updateKitchenStatus(id, request));
    }

    @GetMapping("/kitchen/queue")
    @PreAuthorize(KITCHEN_OR_BAR)
    public ApiResponse<List<KdsLineResponse>> getKitchenQueue() {
        return ApiResponse.success("Kitchen queue loaded", bar.getKitchenDisplayQueue());
    }

    @GetMapping("/kds")
    @PreAuthorize(KITCHEN_OR_BAR)
    public ApiResponse<List<KdsLineResponse>> getKdsQueue(@RequestParam(required = false) String station) {
        return ApiResponse.success("KDS queue loaded", bar.getKdsQueue(station));
    }

    // ------------------------------------------------------------ tabs (BAR-06/07)
    @PostMapping("/tabs")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TabResponse> openTab(@Valid @RequestBody OpenTabRequest request) {
        return ApiResponse.success("Tab opened", tabs.openTab(request));
    }

    @GetMapping("/tabs")
    public ApiResponse<List<TabResponse>> listTabs(@RequestParam(required = false) String status) {
        return ApiResponse.success("Tabs loaded", tabs.listTabs(status));
    }

    @GetMapping("/tabs/{id}")
    public ApiResponse<TabResponse> getTab(@PathVariable UUID id) {
        return ApiResponse.success("Tab loaded", tabs.getTab(id));
    }

    @PostMapping("/tabs/{id}/orders/{orderId}")
    public ApiResponse<TabResponse> attachOrder(@PathVariable UUID id, @PathVariable UUID orderId) {
        return ApiResponse.success("Order added to tab", tabs.attachOrder(id, orderId));
    }

    @PostMapping("/tabs/{id}/settle")
    public ApiResponse<TabSettleResponse> settleTab(@PathVariable UUID id, @Valid @RequestBody PayOrderRequest request) {
        return ApiResponse.success("Tab settled", payments.settleTab(id, request));
    }

    @PostMapping("/tabs/{id}/move-to-account")
    @PreAuthorize(MANAGER)
    public ApiResponse<TabResponse> moveToAccount(@PathVariable UUID id, @Valid @RequestBody ReasonRequest request) {
        return ApiResponse.success("Tab moved to member account", tabs.moveToAccount(id, request.reason()));
    }

    // ------------------------------------------------------------ shifts & cash drawer (BAR-11/12)
    @PostMapping("/shifts/open")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CashShiftResponse> openShift(@Valid @RequestBody OpenShiftRequest request) {
        return ApiResponse.success("Shift opened", shifts.openShift(request));
    }

    @PostMapping("/shifts/{id}/close")
    public ApiResponse<CashShiftResponse> closeShift(@PathVariable UUID id, @Valid @RequestBody CloseShiftRequest request) {
        return ApiResponse.success("Shift closed", shifts.closeShift(id, request));
    }

    @PostMapping("/shifts/{id}/cash-movements")
    public ApiResponse<CashShiftResponse> cashMovement(@PathVariable UUID id, @Valid @RequestBody CashMovementRequest request) {
        return ApiResponse.success("Cash movement recorded", shifts.addCashMovement(id, request));
    }

    @GetMapping("/shifts/current")
    public ApiResponse<CashShiftResponse> getCurrentShift(@RequestParam(required = false) UUID staffUserId) {
        return ApiResponse.success("Current shift loaded", shifts.getCurrentShift(staffUserId));
    }

    @GetMapping("/shifts")
    @PreAuthorize(MANAGER)
    public ApiResponse<List<CashShiftResponse>> listShifts(@RequestParam(required = false) String status) {
        return ApiResponse.success("Shifts loaded", shifts.listShifts(status));
    }

    // ------------------------------------------------------------ daily closing / Z-report (BAR-13)
    @GetMapping("/reports/daily")
    @PreAuthorize(REPORTS)
    public ApiResponse<DailyReportResponse> dailyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Daily report loaded", reports.preview(date));
    }

    @PostMapping("/reports/daily/close")
    @PreAuthorize(MANAGER)
    public ApiResponse<DailyReportResponse> closeDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.success("Day closed", reports.close(date));
    }

    @PostMapping("/reports/daily/reopen")
    @PreAuthorize(MANAGER)
    public ApiResponse<DailyReportResponse> reopenDay(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody ReasonRequest request) {
        return ApiResponse.success("Day reopened", reports.reopen(date, request.reason()));
    }
}