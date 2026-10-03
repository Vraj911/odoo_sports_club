package com.bookmycourt.bar.service;

import com.bookmycourt.admin.service.AuditService;
import com.bookmycourt.bar.dto.AddOrderItemsRequest;
import com.bookmycourt.bar.dto.BarFloorTableResponse;
import com.bookmycourt.bar.dto.BarOrderLineRequest;
import com.bookmycourt.bar.dto.BarOrderLineResponse;
import com.bookmycourt.bar.dto.BarOrderResponse;
import com.bookmycourt.bar.dto.BarTableRequest;
import com.bookmycourt.bar.dto.BarTableResponse;
import com.bookmycourt.bar.dto.CreateBarOrderRequest;
import com.bookmycourt.bar.dto.KdsLineResponse;
import com.bookmycourt.bar.dto.MenuItemRequest;
import com.bookmycourt.bar.dto.MenuItemResponse;
import com.bookmycourt.bar.dto.SplitBillResponse;
import com.bookmycourt.bar.dto.UpdateBarOrderStatusRequest;
import com.bookmycourt.bar.dto.UpdateKitchenStatusRequest;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarOrderLine;
import com.bookmycourt.bar.entity.BarTab;
import com.bookmycourt.bar.entity.BarTable;
import com.bookmycourt.bar.entity.MenuItem;
import com.bookmycourt.bar.mapper.BarMapper;
import com.bookmycourt.bar.repository.BarOrderLineRepository;
import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.bar.repository.BarPaymentRepository;
import com.bookmycourt.bar.repository.BarTabRepository;
import com.bookmycourt.bar.repository.BarTableRepository;
import com.bookmycourt.bar.repository.CashShiftRepository;
import com.bookmycourt.bar.repository.MenuItemRepository;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.common.money.Money;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BarService {

    private final MenuItemRepository menuItems;
    private final BarTableRepository tables;
    private final BarOrderRepository orders;
    private final BarOrderLineRepository lines;
    private final BarPaymentRepository barPayments;
    private final BarTabRepository tabs;
    private final CashShiftRepository cashShifts;
    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final AppUserRepository users;
    private final BarMapper mapper;
    private final BarPricingService pricing;
    private final BarDayLock dayLock;
    private final BarTableSupport tableSupport;
    private final BarTabService tabService;
    private final AuditService audit;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public BarService(MenuItemRepository menuItems, BarTableRepository tables, BarOrderRepository orders,
                      BarOrderLineRepository lines, BarPaymentRepository barPayments, BarTabRepository tabs,
                      CashShiftRepository cashShifts, MemberRepository members, MembershipRepository memberships,
                      AppUserRepository users, BarMapper mapper, BarPricingService pricing, BarDayLock dayLock,
                      BarTableSupport tableSupport, BarTabService tabService, AuditService audit,
                      ApplicationEventPublisher events, Clock clock) {
        this.menuItems = menuItems;
        this.tables = tables;
        this.orders = orders;
        this.lines = lines;
        this.barPayments = barPayments;
        this.tabs = tabs;
        this.cashShifts = cashShifts;
        this.members = members;
        this.memberships = memberships;
        this.users = users;
        this.mapper = mapper;
        this.pricing = pricing;
        this.dayLock = dayLock;
        this.tableSupport = tableSupport;
        this.tabService = tabService;
        this.audit = audit;
        this.events = events;
        this.clock = clock;
    }

    // ================================================================== menu (BAR-01)

    @Transactional
    public MenuItemResponse createMenuItem(MenuItemRequest r) {
        MenuItem m = new MenuItem();
        applyMenu(m, r);
        menuItems.save(m);
        changed("MENU_CHANGED", null, null, null);
        return mapper.toResponse(m);
    }

    @Transactional
    public MenuItemResponse updateMenuItem(UUID id, MenuItemRequest r) {
        MenuItem m = menuItems.findById(id).orElseThrow(() -> new NotFoundException("Menu item not found"));
        MenuItemResponse before = mapper.toResponse(m);
        applyMenu(m, r);
        menuItems.save(m);
        MenuItemResponse after = mapper.toResponse(m);
        audit.record("MENU_ITEM_UPDATED", "MENU_ITEM", id, before, after);   // price / tax edits are sensitive
        changed("MENU_CHANGED", null, null, null);
        return after;
    }

    /** "86" an item: unavailable items can no longer be ordered. */
    @Transactional
    public MenuItemResponse setAvailability(UUID id, boolean available) {
        MenuItem m = menuItems.findById(id).orElseThrow(() -> new NotFoundException("Menu item not found"));
        m.setAvailable(available);
        menuItems.save(m);
        changed("MENU_CHANGED", null, null, null);
        return mapper.toResponse(m);
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> listMenuItems(String category, boolean includeUnavailable) {
        boolean hasCat = category != null && !category.isBlank();
        List<MenuItem> list;
        if (includeUnavailable && BarRoles.isManager()) {
            list = menuItems.findAll().stream()
                    .filter(m -> !hasCat || m.getCategory().equalsIgnoreCase(category.trim())).toList();
        } else {
            list = hasCat ? menuItems.findByCategoryIgnoreCaseAndAvailableTrue(category.trim())
                    : menuItems.findByAvailableTrue();
        }
        return list.stream()
                .sorted(Comparator.comparing(MenuItem::getCategory, String.CASE_INSENSITIVE_ORDER)
                        .thenComparing(MenuItem::getName, String.CASE_INSENSITIVE_ORDER))
                .map(mapper::toResponse).toList();
    }

    private void applyMenu(MenuItem m, MenuItemRequest r) {
        m.setCategory(r.category().trim());
        m.setName(r.name().trim());
        m.setDescription(r.description());
        m.setPrice(r.price());
        m.setTaxRate(r.taxRate() != null ? r.taxRate() : BigDecimal.ZERO);
        m.setAvailable(r.isAvailable() == null || r.isAvailable());
        m.setStation(r.station() != null ? r.station() : BarStatus.KITCHEN);
        m.setTaxInclusive(Boolean.TRUE.equals(r.taxInclusive()));
    }

    // ================================================================== tables (BAR-02)

    @Transactional
    public BarTableResponse createTable(BarTableRequest r) {
        String status = normaliseTableStatus(r.status());
        if (tables.findByTableNumber(r.tableNumber().trim()).isPresent()) {
            throw BarErrors.conflict("Table " + r.tableNumber() + " already exists");
        }
        BarTable t = new BarTable();
        t.setTableNumber(r.tableNumber().trim());
        t.setCapacity(r.capacity());
        t.setStatus(status);
        tables.save(t);
        changed("TABLE_CHANGED", null, t.getId(), null);
        return mapper.toResponse(t);
    }

    @Transactional
    public BarTableResponse updateTable(UUID id, BarTableRequest r) {
        BarTable t = tables.findByIdForUpdate(id).orElseThrow(() -> new NotFoundException("Table not found"));
        String number = r.tableNumber().trim();
        tables.findByTableNumber(number).filter(o -> !o.getId().equals(id)).ifPresent(o -> {
            throw BarErrors.conflict("Table " + number + " already exists");
        });
        t.setTableNumber(number);
        t.setCapacity(r.capacity());
        if (r.status() != null) {
            String status = normaliseTableStatus(r.status());
            boolean busy = orders.existsByTable_IdAndStatusIn(id, BarStatus.ACTIVE);
            if (busy && (BarStatus.FREE.equals(status) || BarStatus.RESERVED.equals(status))) {
                throw BarErrors.conflict("Table has an open order - settle or move it first");
            }
            t.setStatus(status);
        }
        tables.save(t);
        changed("TABLE_CHANGED", null, id, null);
        return mapper.toResponse(t);
    }

    @Transactional(readOnly = true)
    public List<BarTableResponse> listTables() {
        return tables.findAll().stream()
                .sorted(Comparator.comparing(BarTable::getTableNumber, String.CASE_INSENSITIVE_ORDER))
                .map(mapper::toResponse).toList();
    }

    private String normaliseTableStatus(String s) {
        if (s == null || s.isBlank()) return BarStatus.FREE;
        String v = s.trim().toUpperCase(Locale.ROOT);
        if ("AVAILABLE".equals(v)) v = BarStatus.FREE;   // legacy value
        if (!BarStatus.TABLE_STATUSES.contains(v)) {
            throw BarErrors.bad("Table status must be FREE, OCCUPIED, BILL_REQUESTED or RESERVED");
        }
        return v;
    }

    // ================================================================== orders (BAR-03/05)

    @Transactional
    public BarOrderResponse createOrder(CreateBarOrderRequest r) {
        dayLock.assertOpenToday();
        AppUser actor = currentUser();

        BarTable table = null;
        if (r.tableId() != null) {
            table = tables.findByIdForUpdate(r.tableId()).orElseThrow(() -> new NotFoundException("Table not found"));
        }
        BarOrder order = new BarOrder();
        order.setOrderNumber(String.format("BAR-%06d", orders.nextOrderNo()));
        order.setTable(table);
        order.setGuestName(blankToNull(r.guestName()));
        order.setOpenedBy(actor);
        if (actor != null) {
            order.setCashShift(cashShifts.findByStaffUser_IdAndStatus(actor.getId(), "OPEN").orElse(null));
        }
        if (r.memberId() != null) {
            Member m = members.findById(r.memberId()).orElseThrow(() -> new NotFoundException("Member not found"));
            order.setMember(m);
            applyMemberDiscount(order, m);
        }
        if (r.tabId() != null) {
            BarTab tab = tabs.findByIdForUpdate(r.tabId()).orElseThrow(() -> new NotFoundException("Tab not found"));
            tabService.requireOpen(tab);
            if (tab.getMember() != null) {
                if (order.getMember() == null) {
                    order.setMember(tab.getMember());
                    applyMemberDiscount(order, tab.getMember());
                } else if (!order.getMember().getId().equals(tab.getMember().getId())) {
                    throw BarErrors.conflict("Member does not match the tab owner");
                }
            }
            order.setTab(tab);
        }
        addLines(order, r.items(), actor);
        pricing.recalculate(order);
        if (order.getTab() != null) tabService.enforceLimit(order.getTab(), order);
        order.setStatus(order.getLines().isEmpty() ? BarStatus.OPEN : BarStatus.SENT);

        if (table != null) {
            table.setStatus(BarStatus.OCCUPIED);
            tables.save(table);
        }
        orders.save(order);
        changed("ORDER_CREATED", order.getId(), table == null ? null : table.getId(), null);
        return view(order);
    }

    /** Add a round to an existing order (the old API could only create an order once, with all items). */
    @Transactional
    public BarOrderResponse addItems(UUID orderId, AddOrderItemsRequest r) {
        BarOrder order = lockEditable(orderId);
        addLines(order, r.items(), currentUser());
        pricing.recalculate(order);
        if (order.getTab() != null) tabService.enforceLimit(order.getTab(), order);
        order.setStatus(order.getAmountPaid().signum() > 0 ? BarStatus.PARTIALLY_PAID : BarStatus.SENT);
        BarTable table = order.getTable();
        if (table != null && BarStatus.BILL_REQUESTED.equals(table.getStatus())) {
            table.setStatus(BarStatus.OCCUPIED);
            tables.save(table);
        }
        orders.save(order);
        changed("ORDER_UPDATED", orderId, table == null ? null : table.getId(), null);
        return view(order);
    }

    /** BAR-05: identify the member after the order was started - discount is re-applied to every line. */
    @Transactional
    public BarOrderResponse attachMember(UUID orderId, UUID memberId) {
        BarOrder order = lockEditable(orderId);
        Member m = members.findById(memberId).orElseThrow(() -> new NotFoundException("Member not found"));
        order.setMember(m);
        applyMemberDiscount(order, m);
        pricing.recalculate(order);
        settleAfterEdit(order);
        orders.save(order);
        changed("ORDER_UPDATED", orderId, tableId(order), null);
        return view(order);
    }

    @Transactional
    public BarOrderResponse requestBill(UUID orderId) {
        BarOrder order = lockEditable(orderId);
        if (order.getTable() != null) {
            BarTable t = tables.findByIdForUpdate(order.getTable().getId()).orElse(order.getTable());
            t.setStatus(BarStatus.BILL_REQUESTED);
            tables.save(t);
        }
        changed("BILL_REQUESTED", orderId, tableId(order), null);
        return view(order);
    }

    @Transactional(readOnly = true)
    public BarOrderResponse getOrder(UUID id) {
        return view(orders.findById(id).orElseThrow(() -> new NotFoundException("Bar order not found")));
    }

    @Transactional(readOnly = true)
    public List<BarOrderResponse> listOrders(UUID memberId, List<String> status) {
        if (memberId != null) {
            return orders.findByMember_IdOrderByCreatedAtDesc(memberId).stream().map(mapper::toResponse).toList();
        }
        if (status != null && !status.isEmpty()) {
            List<String> up = status.stream().map(s -> s.trim().toUpperCase(Locale.ROOT)).toList();
            return orders.findByStatusIn(up).stream().map(mapper::toResponse).toList();
        }
        return orders.findTop200ByOrderByCreatedAtDesc().stream().map(mapper::toResponse).toList();
    }

    /**
     * Only CANCELLED can be set here. PAID is reached only through payments (BAR-09) and VOID only through the
     * manager void endpoint (BAR-14) - previously any caller could PATCH any order to PAID with no money taken.
     */
    @Transactional
    public BarOrderResponse updateOrderStatus(UUID orderId, UpdateBarOrderStatusRequest r) {
        String target = r.status().trim().toUpperCase(Locale.ROOT);
        if (!BarStatus.CANCELLED.equals(target)) {
            throw BarErrors.bad("Only CANCELLED can be set here. Use /pay to settle and the manager /void endpoint to void.");
        }
        BarOrder order = lockEditable(orderId);
        if (order.getAmountPaid().signum() > 0) {
            throw BarErrors.conflict("Order has payments - void it as a manager and refund");
        }
        boolean started = order.getLines().stream().anyMatch(l ->
                !BarStatus.LINE_VOID.equals(l.getKitchenStatus()) && !BarStatus.NEW.equals(l.getKitchenStatus()));
        if (started) throw BarErrors.conflict("Kitchen has started this order - a manager must void it with a reason");
        close(order, BarStatus.CANCELLED, "Cancelled");
        orders.save(order);
        changed("ORDER_UPDATED", orderId, tableId(order), null);
        return view(order);
    }

    // ================================================================== lines / kitchen (BAR-04)

    @Transactional
    public BarOrderLineResponse updateKitchenStatus(UUID lineId, UpdateKitchenStatusRequest r) {
        String to = r.kitchenStatus().trim().toUpperCase(Locale.ROOT);
        if (!BarStatus.LINE_FLOW.contains(to)) {
            throw BarErrors.bad("kitchenStatus must be NEW, PREPARING, READY or SERVED (void a line via the void endpoint)");
        }
        BarOrderLine line = lines.findById(lineId).orElseThrow(() -> new NotFoundException("Bar order line not found"));
        String from = line.getKitchenStatus();
        if (BarStatus.LINE_VOID.equals(from)) throw BarErrors.conflict("Line is void");
        if (BarStatus.LINE_FLOW.indexOf(to) <= BarStatus.LINE_FLOW.indexOf(from)) {
            throw BarErrors.conflict("Cannot move a line from " + from + " to " + to);
        }
        Instant now = clock.instant();
        line.setKitchenStatus(to);
        if (BarStatus.READY.equals(to)) line.setReadyAt(now);
        if (BarStatus.SERVED.equals(to)) {
            line.setServedAt(now);
            if (line.getReadyAt() == null) line.setReadyAt(now);
        }
        lines.save(line);
        BarOrder o = line.getBarOrder();
        // "Staff are notified when ready": KDS/floor screens receive LINE_READY over the SSE stream
        changed("LINE_" + to, o.getId(), tableId(o), line.getId());
        return mapper.toResponse(line);
    }

    @Transactional(readOnly = true)
    public List<KdsLineResponse> getKitchenDisplayQueue() {
        return lines.findKds(List.of(BarStatus.NEW, BarStatus.PREPARING)).stream().map(mapper::toKds).toList();
    }

    @Transactional(readOnly = true)
    public List<KdsLineResponse> getKdsQueue(String station) {
        List<BarOrderLine> list = lines.findKds(List.of(BarStatus.NEW, BarStatus.PREPARING, BarStatus.READY));
        if (station != null && !station.isBlank()) {
            list = list.stream().filter(l -> station.trim().equalsIgnoreCase(l.getStation())).toList();
        }
        return list.stream().map(mapper::toKds).toList();
    }

    /** Remove a line the kitchen has not started yet (any bar staff). */
    @Transactional
    public BarOrderResponse removeLine(UUID orderId, UUID lineId) {
        BarOrder order = lockEditable(orderId);
        BarOrderLine l = findLine(order, lineId);
        if (!BarStatus.NEW.equals(l.getKitchenStatus())) {
            throw BarErrors.conflict("Kitchen has started this item - a manager must void it with a reason");
        }
        order.getLines().remove(l);
        pricing.recalculate(order);
        settleAfterEdit(order);
        orders.save(order);
        changed("ORDER_UPDATED", orderId, tableId(order), lineId);
        return view(order);
    }

    /** BAR-14: manager-only, reason required, audited. */
    @Transactional
    public BarOrderResponse voidLine(UUID orderId, UUID lineId, String reason) {
        BarOrder order = lockEditable(orderId);
        BarOrderLine l = findLine(order, lineId);
        if (BarStatus.LINE_VOID.equals(l.getKitchenStatus())) throw BarErrors.conflict("Line is already void");
        BarOrderLineResponse before = mapper.toResponse(l);
        l.setKitchenStatus(BarStatus.LINE_VOID);
        l.setVoidReason(reason);
        pricing.recalculate(order);
        settleAfterEdit(order);
        orders.save(order);
        audit.record("BAR_LINE_VOID", "BAR_ORDER_LINE", lineId, before, mapper.toResponse(l), reason);
        changed("ORDER_UPDATED", orderId, tableId(order), lineId);
        return view(order);
    }

    @Transactional
    public BarOrderResponse compLine(UUID orderId, UUID lineId, String reason) {
        BarOrder order = lockEditable(orderId);
        BarOrderLine l = findLine(order, lineId);
        if (BarStatus.LINE_VOID.equals(l.getKitchenStatus())) throw BarErrors.conflict("Line is void");
        BarOrderLineResponse before = mapper.toResponse(l);
        l.setComped(true);
        pricing.recalculate(order);
        settleAfterEdit(order);
        orders.save(order);
        audit.record("BAR_LINE_COMP", "BAR_ORDER_LINE", lineId, before, mapper.toResponse(l), reason);
        changed("ORDER_UPDATED", orderId, tableId(order), lineId);
        return view(order);
    }

    @Transactional
    public BarOrderResponse voidOrder(UUID orderId, String reason) {
        BarOrder order = lockEditable(orderId);
        if (order.getAmountPaid().signum() > 0) {
            throw BarErrors.conflict("Order has payments - refund them first, then void");
        }
        BarOrderResponse before = mapper.toResponse(order);
        close(order, BarStatus.VOID, reason);
        orders.save(order);
        audit.record("BAR_ORDER_VOID", "BAR_ORDER", orderId, before, mapper.toResponse(order), reason);
        changed("ORDER_UPDATED", orderId, tableId(order), null);
        return view(order);
    }

    // ================================================================== floor, transfer, merge, split (BAR-02/08)

    @Transactional(readOnly = true)
    public List<BarFloorTableResponse> getFloorPlan() {
        Map<UUID, List<BarOrder>> byTable = orders.findByStatusIn(BarStatus.ACTIVE).stream()
                .filter(o -> o.getTable() != null)
                .collect(Collectors.groupingBy(o -> o.getTable().getId()));

        return tables.findAll().stream()
                .sorted(Comparator.comparing(BarTable::getTableNumber, String.CASE_INSENSITIVE_ORDER))
                .map(t -> {
                    List<BarOrder> active = byTable.getOrDefault(t.getId(), List.of()).stream()
                            .sorted(Comparator.comparing(BarOrder::getCreatedAt)).toList();
                    String status = t.getStatus();
                    if (!active.isEmpty() && !BarStatus.BILL_REQUESTED.equals(status)) status = BarStatus.OCCUPIED;
                    BarOrder latest = active.isEmpty() ? null : active.get(active.size() - 1);
                    BigDecimal total = active.stream().map(BarOrder::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                    int unserved = (int) active.stream().flatMap(o -> o.getLines().stream())
                            .filter(l -> !BarStatus.SERVED.equals(l.getKitchenStatus())
                                    && !BarStatus.LINE_VOID.equals(l.getKitchenStatus())).count();
                    return new BarFloorTableResponse(
                            t.getId(), t.getTableNumber(), t.getCapacity(), status,
                            latest == null ? null : latest.getId(),
                            latest == null ? null : latest.getOrderNumber(),
                            total,
                            active.isEmpty() ? null : active.get(0).getCreatedAt(),
                            unserved);
                }).toList();
    }

    @Transactional
    public BarOrderResponse transferTable(UUID orderId, UUID newTableId) {
        BarOrder order = lockEditable(orderId);
        BarTable oldTable = order.getTable();
        if (oldTable != null && oldTable.getId().equals(newTableId)) return view(order);
        BarTable newTable = tables.findByIdForUpdate(newTableId)
                .orElseThrow(() -> new NotFoundException("New table not found: " + newTableId));
        order.setTable(newTable);
        newTable.setStatus(BarStatus.OCCUPIED);
        tables.save(newTable);
        orders.save(order);
        tableSupport.releaseIfIdle(oldTable);   // old table is freed only if nothing else is open on it
        changed("ORDER_UPDATED", orderId, newTableId, null);
        return view(order);
    }

    /** BAR-08: merge one order's items into another (e.g. two tables join). Source is cancelled. */
    @Transactional
    public BarOrderResponse mergeOrders(UUID sourceId, UUID targetId) {
        if (sourceId.equals(targetId)) throw BarErrors.bad("Choose a different target order");
        UUID first = sourceId.toString().compareTo(targetId.toString()) < 0 ? sourceId : targetId;   // lock order = no deadlock
        UUID second = first.equals(sourceId) ? targetId : sourceId;
        BarOrder a = orders.findByIdForUpdate(first).orElseThrow(() -> new NotFoundException("Bar order not found"));
        BarOrder b = orders.findByIdForUpdate(second).orElseThrow(() -> new NotFoundException("Bar order not found"));
        BarOrder source = first.equals(sourceId) ? a : b;
        BarOrder target = first.equals(sourceId) ? b : a;
        assertEditable(source);
        assertEditable(target);
        if (source.getAmountPaid().signum() > 0) throw BarErrors.conflict("Source order already has payments");

        for (BarOrderLine s : new ArrayList<>(source.getLines())) {
            if (BarStatus.LINE_VOID.equals(s.getKitchenStatus())) continue;
            target.getLines().add(copyLine(s, target));
            s.setKitchenStatus(BarStatus.LINE_VOID);
            s.setVoidReason("Merged into " + target.getOrderNumber());
        }
        pricing.recalculate(source);
        pricing.recalculate(target);
        if (target.getTab() != null) tabService.enforceLimit(target.getTab(), target);
        source.setStatus(BarStatus.CANCELLED);
        source.setClosedAt(clock.instant());
        source.setVoidReason("Merged into " + target.getOrderNumber());
        orders.save(source);
        orders.save(target);
        tableSupport.releaseIfIdle(source.getTable());
        audit.record("BAR_ORDER_MERGED", "BAR_ORDER", sourceId, mapper.toResponse(source), mapper.toResponse(target));
        changed("ORDER_UPDATED", targetId, tableId(target), null);
        return view(target);
    }

    @Transactional(readOnly = true)
    public SplitBillResponse splitBill(UUID orderId, int ways) {
        if (ways < 2 || ways > 50) throw BarErrors.bad("ways must be between 2 and 50");
        BarOrder order = orders.findById(orderId).orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        Money totalMoney = Money.ofRupees(order.getTotal());
        int[] weights = new int[ways];
        Arrays.fill(weights, 1);
        List<BigDecimal> amounts = totalMoney.allocate(weights).stream().map(Money::toRupees).toList();
        return new SplitBillResponse(order.getId(), order.getOrderNumber(), order.getTotal(), ways, amounts);
    }

    /** BAR-08: split by item - one amount per guest, every non-void line assigned exactly once. */
    @Transactional(readOnly = true)
    public SplitBillResponse splitByItems(UUID orderId, List<List<UUID>> groups) {
        BarOrder order = orders.findById(orderId).orElseThrow(() -> new NotFoundException("Order not found: " + orderId));
        Map<UUID, BarOrderLine> live = order.getLines().stream()
                .filter(l -> !BarStatus.LINE_VOID.equals(l.getKitchenStatus()))
                .collect(Collectors.toMap(BarOrderLine::getId, l -> l));
        Set<UUID> seen = new HashSet<>();
        List<BigDecimal> amounts = new ArrayList<>();
        for (List<UUID> g : groups) {
            BigDecimal sum = BigDecimal.ZERO;
            for (UUID id : g) {
                BarOrderLine l = live.get(id);
                if (l == null) throw BarErrors.bad("Line " + id + " does not belong to this order (or is void)");
                if (!seen.add(id)) throw BarErrors.bad("Line " + id + " is assigned to more than one guest");
                sum = sum.add(l.getLineTotal());
            }
            amounts.add(sum);
        }
        if (seen.size() != live.size()) throw BarErrors.bad("Every item must be assigned to a guest");
        return new SplitBillResponse(order.getId(), order.getOrderNumber(), order.getTotal(), groups.size(), amounts);
    }

    // ================================================================== helpers

    private BarOrder lockEditable(UUID orderId) {
        BarOrder o = orders.findByIdForUpdate(orderId).orElseThrow(() -> new NotFoundException("Bar order not found"));
        assertEditable(o);
        return o;
    }

    private void assertEditable(BarOrder o) {
        if (!BarStatus.ACTIVE.contains(o.getStatus())) {
            throw BarErrors.conflict("Order " + o.getOrderNumber() + " is " + o.getStatus() + " and can no longer be changed");
        }
        dayLock.assertOpen(dayLock.dayOf(o.getCreatedAt()));   // BR-14
    }

    private BarOrderLine findLine(BarOrder order, UUID lineId) {
        return order.getLines().stream().filter(l -> l.getId().equals(lineId)).findFirst()
                .orElseThrow(() -> new NotFoundException("Line not found on this order"));
    }

    private void addLines(BarOrder order, List<BarOrderLineRequest> items, AppUser actor) {
        if (items == null) return;
        Instant now = clock.instant();
        for (BarOrderLineRequest item : items) {
            MenuItem mi = menuItems.findById(item.menuItemId())
                    .orElseThrow(() -> new NotFoundException("Menu item not found: " + item.menuItemId()));
            if (!mi.isAvailable()) throw BarErrors.conflict(mi.getName() + " is currently unavailable");   // 86'd
            BarOrderLine l = new BarOrderLine();
            l.setBarOrder(order);
            l.setMenuItem(mi);
            l.setItemNameSnapshot(mi.getName());
            l.setQuantity(BigDecimal.valueOf(item.quantity()));
            l.setUnitPrice(mi.getPrice());
            l.setTaxRate(mi.getTaxRate());
            l.setTaxInclusive(mi.isTaxInclusive());
            l.setStation(mi.getStation());
            l.setNotes(blankToNull(item.notes()));
            l.setOrderedBy(actor);
            l.setSentAt(now);
            l.setKitchenStatus(BarStatus.NEW);
            order.getLines().add(l);
        }
    }

    /** BR-09: discount rule is recorded on the order. LocalDate is computed in Asia/Kolkata (was LocalDate.now()). */
    private void applyMemberDiscount(BarOrder order, Member member) {
        BigDecimal pct = BigDecimal.ZERO;
        String source = "NO_ACTIVE_MEMBERSHIP";
        Membership active = memberships.findCurrent(member.getId(), dayLock.today()).orElse(null);
        if (active != null && active.getPlan() != null && active.getPlan().getBarDiscountPercent() != null) {
            pct = active.getPlan().getBarDiscountPercent();
            source = "PLAN:" + active.getPlan().getName();
        }
        order.setMemberDiscountPercent(pct);
        order.setDiscountSource(source);
    }

    /** After totals change: never below what was already paid; exactly equal means the bill is now settled. */
    private void settleAfterEdit(BarOrder order) {
        int cmp = order.getAmountPaid().compareTo(order.getTotal());
        if (cmp > 0) {
            throw BarErrors.conflict("The customer has already paid more than the new total - refund the difference first");
        }
        if (cmp == 0 && order.getAmountPaid().signum() > 0) {
            order.setStatus(BarStatus.PAID);
            order.setClosedAt(clock.instant());
            tableSupport.releaseIfIdle(order.getTable());
        }
    }

    private void close(BarOrder order, String status, String reason) {
        for (BarOrderLine l : order.getLines()) {
            if (!BarStatus.LINE_VOID.equals(l.getKitchenStatus())) {
                l.setKitchenStatus(BarStatus.LINE_VOID);
                l.setVoidReason(reason);
            }
        }
        pricing.recalculate(order);
        order.setStatus(status);
        order.setVoidReason(reason);
        order.setClosedAt(clock.instant());
        tableSupport.releaseIfIdle(order.getTable());
    }

    private BarOrderLine copyLine(BarOrderLine s, BarOrder target) {
        BarOrderLine c = new BarOrderLine();
        c.setBarOrder(target);
        c.setMenuItem(s.getMenuItem());
        c.setItemNameSnapshot(s.getItemNameSnapshot());
        c.setQuantity(s.getQuantity());
        c.setUnitPrice(s.getUnitPrice());
        c.setTaxRate(s.getTaxRate());
        c.setTaxInclusive(s.isTaxInclusive());
        c.setComped(s.isComped());
        c.setNotes(s.getNotes());
        c.setStation(s.getStation());
        c.setOrderedBy(s.getOrderedBy());
        c.setKitchenStatus(s.getKitchenStatus());
        c.setSentAt(s.getSentAt());
        c.setReadyAt(s.getReadyAt());
        c.setServedAt(s.getServedAt());
        return c;
    }

    private BarOrderResponse view(BarOrder order) {
        return mapper.toResponse(order, barPayments.findByBarOrder_IdOrderByCreatedAtAsc(order.getId()));
    }

    private AppUser currentUser() {
        UUID id = audit.currentActorId();
        return id == null ? null : users.findById(id).orElse(null);
    }

    private static UUID tableId(BarOrder o) {
        return o.getTable() == null ? null : o.getTable().getId();
    }

    private void changed(String type, UUID orderId, UUID tableId, UUID lineId) {
        events.publishEvent(new BarEventHub.BarChanged(type, orderId, tableId, lineId));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}