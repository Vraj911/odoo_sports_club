package com.bookmycourt.bar.service;

import com.bookmycourt.bar.dto.SplitBillResponse;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarTable;
import com.bookmycourt.bar.mapper.BarMapper;
import com.bookmycourt.bar.repository.BarOrderLineRepository;
import com.bookmycourt.bar.repository.BarOrderRepository;
import com.bookmycourt.bar.repository.BarTableRepository;
import com.bookmycourt.bar.repository.CashShiftRepository;
import com.bookmycourt.bar.repository.MenuItemRepository;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

class BarServiceTest {

    private BarOrderRepository orders;
    private BarTableRepository tables;
    private BarService service;

    @BeforeEach
    void setUp() {
        MenuItemRepository menuItems = Mockito.mock(MenuItemRepository.class);
        tables = Mockito.mock(BarTableRepository.class);
        orders = Mockito.mock(BarOrderRepository.class);
        BarOrderLineRepository lines = Mockito.mock(BarOrderLineRepository.class);
        MemberRepository members = Mockito.mock(MemberRepository.class);
        MembershipRepository memberships = Mockito.mock(MembershipRepository.class);
        AppUserRepository users = Mockito.mock(AppUserRepository.class);
        CashShiftRepository cashShifts = Mockito.mock(CashShiftRepository.class);
        PaymentRepository payments = Mockito.mock(PaymentRepository.class);
        BarMapper mapper = new BarMapper();

        service = new BarService(
                menuItems, tables, orders, lines, members,
                memberships, users, mapper, cashShifts, payments
        );
    }

    @Test
    void splitBill_3Ways_sumsExactlyToOriginalTotal() {
        UUID orderId = UUID.randomUUID();
        BarOrder order = new BarOrder();
        order.setOrderNumber("ORD-100");
        order.setTotal(new BigDecimal("100.00")); // 100 split 3 ways is 33.34, 33.33, 33.33

        when(orders.findById(orderId)).thenReturn(Optional.of(order));

        SplitBillResponse resp = service.splitBill(orderId, 3);
        assertNotNull(resp);
        assertEquals(3, resp.splitAmounts().size());

        BigDecimal sum = resp.splitAmounts().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("100.00"), sum);
    }

    @Test
    void transferTable_updatesOldAndNewTableStatuses() {
        UUID orderId = UUID.randomUUID();
        UUID oldTableId = UUID.randomUUID();
        UUID newTableId = UUID.randomUUID();

        BarTable oldTable = new BarTable();
        oldTable.setId(oldTableId);
        oldTable.setStatus("OCCUPIED");

        BarTable newTable = new BarTable();
        newTable.setId(newTableId);
        newTable.setStatus("AVAILABLE");

        BarOrder order = new BarOrder();
        order.setId(orderId);
        order.setTable(oldTable);

        when(orders.findById(orderId)).thenReturn(Optional.of(order));
        when(tables.findById(newTableId)).thenReturn(Optional.of(newTable));

        service.transferTable(orderId, newTableId);

        assertEquals("AVAILABLE", oldTable.getStatus());
        assertEquals("OCCUPIED", newTable.getStatus());
        assertEquals(newTable, order.getTable());
    }
}
