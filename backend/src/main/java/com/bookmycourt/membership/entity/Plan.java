package com.bookmycourt.membership.entity;

import com.bookmycourt.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Table(name = "plan")
public class Plan extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "validity_days", nullable = false)
    private int validityDays;

    @Column(name = "advance_booking_days", nullable = false)
    private int advanceBookingDays;

    @Column(name = "max_bookings_per_day", nullable = false)
    private int maxBookingsPerDay;

    @Column(name = "shop_discount_percent", nullable = false)
    private BigDecimal shopDiscountPercent;

    @Column(name = "bar_discount_percent", nullable = false)
    private BigDecimal barDiscountPercent;

    @Column(name = "price", nullable = false)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
