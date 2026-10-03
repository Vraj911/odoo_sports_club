package com.bookmycourt.bar.mapper;

import com.bookmycourt.bar.dto.BarOrderLineResponse;
import com.bookmycourt.bar.dto.BarOrderResponse;
import com.bookmycourt.bar.dto.BarTableResponse;
import com.bookmycourt.bar.dto.MenuItemResponse;
import com.bookmycourt.bar.entity.BarOrder;
import com.bookmycourt.bar.entity.BarOrderLine;
import com.bookmycourt.bar.entity.BarTable;
import com.bookmycourt.bar.entity.MenuItem;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class BarMapper {

    public MenuItemResponse toResponse(MenuItem m) {
        return new MenuItemResponse(
                m.getId(),
                m.getCategory(),
                m.getName(),
                m.getDescription(),
                m.getPrice(),
                m.getTaxRate(),
                m.isAvailable(),
                m.getCreatedAt()
        );
    }

    public BarTableResponse toResponse(BarTable t) {
        return new BarTableResponse(
                t.getId(),
                t.getTableNumber(),
                t.getCapacity(),
                t.getStatus(),
                t.getCreatedAt()
        );
    }

    public BarOrderLineResponse toResponse(BarOrderLine l) {
        return new BarOrderLineResponse(
                l.getId(),
                l.getMenuItem().getId(),
                l.getItemNameSnapshot(),
                l.getQuantity(),
                l.getUnitPrice(),
                l.getTaxRate(),
                l.getLineTotal(),
                l.getKitchenStatus()
        );
    }

    public BarOrderResponse toResponse(BarOrder o) {
        String memberName = null;
        if (o.getMember() != null) {
            memberName = o.getMember().getFirstName() + " " + o.getMember().getLastName();
        }
        List<BarOrderLineResponse> items = o.getLines() == null
                ? Collections.emptyList()
                : o.getLines().stream().map(this::toResponse).toList();

        return new BarOrderResponse(
                o.getId(),
                o.getOrderNumber(),
                o.getTable() == null ? null : o.getTable().getId(),
                o.getTable() == null ? null : o.getTable().getTableNumber(),
                o.getMember() == null ? null : o.getMember().getId(),
                memberName,
                o.getGuestName(),
                o.getStatus(),
                o.getMemberDiscountAmount(),
                o.getSubtotal(),
                o.getTaxTotal(),
                o.getTotal(),
                items,
                o.getCreatedAt()
        );
    }
}
