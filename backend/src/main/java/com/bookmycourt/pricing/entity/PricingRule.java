package com.bookmycourt.pricing.entity;

import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.membership.entity.Plan;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Entity
@Table(name = "pricing_rule")
public class PricingRule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @Column(name = "customer_type", nullable = false)
    private String customerType;

    @Column(name = "day_type", nullable = false)
    private String dayType;

    @Column(name = "indoor_outdoor")
    private String indoorOutdoor;

    @Column(name = "time_start", nullable = false)
    private LocalTime timeStart;

    @Column(name = "time_end", nullable = false)
    private LocalTime timeEnd;

    @Column(name = "sport")
    private String sport;

    @Column(name = "priority", nullable = false)
    private int priority = 0;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
