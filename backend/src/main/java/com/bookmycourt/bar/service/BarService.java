package com.bookmycourt.bar.service;

import com.bookmycourt.bar.dto.BarOrderLineRequest;
import com.bookmycourt.bar.dto.BarOrderLineResponse;
import com.bookmycourt.bar.dto.BarOrderResponse;
import com.bookmycourt.bar.dto.BarTableRequest;
import com.bookmycourt.bar.dto.BarTableResponse;
import com.bookmycourt.bar.dto.CreateBarOrderRequest;
import com.bookmycourt.bar.dto.MenuItemRequest;
import com.bookmycourt.bar.dto.MenuItemResponse;
import com.bookmycourt.bar.dto.UpdateBarOrderStatusRequest;
import com.bookmycourt.bar.dto.UpdateKitchenStatusRequest;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarOrderLine;
import com.bookmycourt.bar.entity.BarTable;
import com.bookmycourt.bar.entity.MenuItem;
import com.bookmycourt.bar.mapper.BarMapper;
import com.bookmycourt.bar.repository.BarOrderLineRepository;
import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.bar.repository.BarTableRepository;
import com.bookmycourt.bar.repository.MenuItemRepository;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class BarService {

    private final MenuItemRepository menuItems;
    private final BarTableRepository tables;
    private final BarOrderRepository orders;
    private final BarOrderLineRepository lines;
    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final AppUserRepository users;
    private final BarMapper mapper;

    public BarService(
            MenuItemRepository menuItems,
            BarTableRepository tables,
            BarOrderRepository orders,
            BarOrderLineRepository lines,
            MemberRepository members,
            MembershipRepository memberships,
            AppUserRepository users,
            BarMapper mapper) {
        this.menuItems = menuItems;
        this.tables = tables;
        this.orders = orders;
        this.lines = lines;
        this.members = members;
        this.memberships = memberships;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional
    public MenuItemResponse createMenuItem(MenuItemRequest request) {
        MenuItem m = new MenuItem();
        m.setCategory(request.category());
        m.setName(request.name());
        m.setDescription(request.description());
        m.setPrice(request.price());
        m.setTaxRate(request.taxRate() != null ? request.taxRate() : BigDecimal.ZERO);
        m.setAvailable(request.isAvailable() != null ? request.isAvailable() : true);
        menuItems.save(m);
        return mapper.toResponse(m);
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponse> listMenuItems(String category) {
        List<MenuItem> list = (category != null && !category.isBlank())
                ? menuItems.findByCategoryIgnoreCaseAndAvailableTrue(category)
                : menuItems.findByAvailableTrue();
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public BarTableResponse createTable(BarTableRequest request) {
        BarTable t = new BarTable();
        t.setTableNumber(request.tableNumber());
        t.setCapacity(request.capacity());
        t.setStatus(request.status() != null ? request.status() : "AVAILABLE");
        tables.save(t);
        return mapper.toResponse(t);
    }

    @Transactional(readOnly = true)
    public List<BarTableResponse> listTables() {
        return tables.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public BarOrderResponse createOrder(CreateBarOrderRequest request) {
        BarTable table = null;
        if (request.tableId() != null) {
            table = tables.findById(request.tableId())
                    .orElseThrow(() -> new NotFoundException("Table not found"));
            table.setStatus("OCCUPIED");
            tables.save(table);
        }

        Member member = null;
        BigDecimal memberDiscountPercent = BigDecimal.ZERO;
        if (request.memberId() != null) {
            member = members.findById(request.memberId())
                    .orElseThrow(() -> new NotFoundException("Member not found"));
            Membership active = memberships.findCurrent(member.getId(), LocalDate.now()).orElse(null);
            if (active != null && active.getPlan() != null) {
                memberDiscountPercent = active.getPlan().getBarDiscountPercent();
            }
        }

        BarOrder order = new BarOrder();
        order.setOrderNumber("BAR-" + System.currentTimeMillis());
        order.setTable(table);
        order.setMember(member);
        order.setGuestName(request.guestName());
        order.setStatus("OPEN");
        if (request.openedByUserId() != null) {
            AppUser u = users.findById(request.openedByUserId()).orElse(null);
            order.setOpenedBy(u);
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        List<BarOrderLine> orderLines = new ArrayList<>();
        if (request.items() != null) {
            for (BarOrderLineRequest item : request.items()) {
                MenuItem mi = menuItems.findById(item.menuItemId())
                        .orElseThrow(() -> new NotFoundException("Menu item not found: " + item.menuItemId()));

                BigDecimal lineSubtotal = mi.getPrice().multiply(item.quantity());
                BigDecimal lineDiscount = lineSubtotal.multiply(memberDiscountPercent)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                BigDecimal lineNet = lineSubtotal.subtract(lineDiscount);
                BigDecimal lineTax = lineNet.multiply(mi.getTaxRate())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                BigDecimal lineTotal = lineNet.add(lineTax);

                BarOrderLine line = new BarOrderLine();
                line.setBarOrder(order);
                line.setMenuItem(mi);
                line.setItemNameSnapshot(mi.getName());
                line.setQuantity(item.quantity());
                line.setUnitPrice(mi.getPrice());
                line.setTaxRate(mi.getTaxRate());
                line.setLineTotal(lineTotal);
                line.setKitchenStatus("NEW");
                orderLines.add(line);

                subtotal = subtotal.add(lineSubtotal);
                discountTotal = discountTotal.add(lineDiscount);
                taxTotal = taxTotal.add(lineTax);
            }
        }

        order.setMemberDiscountAmount(discountTotal);
        order.setSubtotal(subtotal);
        order.setTaxTotal(taxTotal);
        order.setTotal(subtotal.subtract(discountTotal).add(taxTotal));
        order.setLines(orderLines);

        orders.save(order);
        return mapper.toResponse(order);
    }

    @Transactional
    public BarOrderLineResponse updateKitchenStatus(UUID lineId, UpdateKitchenStatusRequest request) {
        BarOrderLine line = lines.findById(lineId)
                .orElseThrow(() -> new NotFoundException("Bar order line not found"));
        line.setKitchenStatus(request.kitchenStatus());
        lines.save(line);
        return mapper.toResponse(line);
    }

    @Transactional
    public BarOrderResponse updateOrderStatus(UUID orderId, UpdateBarOrderStatusRequest request) {
        BarOrder order = orders.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Bar order not found"));
        order.setStatus(request.status());

        if (("PAID".equalsIgnoreCase(request.status()) || "VOID".equalsIgnoreCase(request.status()) || "CANCELLED".equalsIgnoreCase(request.status()))
                && order.getTable() != null) {
            order.getTable().setStatus("AVAILABLE");
            tables.save(order.getTable());
        }

        orders.save(order);
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public List<BarOrderLineResponse> getKitchenDisplayQueue() {
        return lines.findByKitchenStatusIn(List.of("NEW", "PREPARING"))
                .stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BarOrderResponse getOrder(UUID id) {
        BarOrder order = orders.findById(id).orElseThrow(() -> new NotFoundException("Bar order not found"));
        return mapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public List<BarOrderResponse> listOrders(UUID memberId, List<String> status) {
        if (memberId != null) {
            return orders.findByMember_IdOrderByCreatedAtDesc(memberId).stream().map(mapper::toResponse).toList();
        }
        if (status != null && !status.isEmpty()) {
            return orders.findByStatusIn(status).stream().map(mapper::toResponse).toList();
        }
        return orders.findByOrderByCreatedAtDesc().stream().map(mapper::toResponse).toList();
    }
}
