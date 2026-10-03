package com.bookmycourt.facility.entity;

import com.bookmycourt.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "court")
public class Court extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String sport;

    @Column(name = "indoor_outdoor", nullable = false)
    private String indoorOutdoor;

    private String location;

    @Column(name = "slot_duration_minutes", nullable = false)
    private int slotDurationMinutes = 60;

    @Column(name = "slot_interval_minutes", nullable = false)
    private int slotIntervalMinutes = 30;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
