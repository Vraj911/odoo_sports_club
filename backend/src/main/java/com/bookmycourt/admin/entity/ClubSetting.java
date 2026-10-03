package com.bookmycourt.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "club_setting")
public class ClubSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "setting_key", nullable = false, unique = true)
    private String settingKey;

    @Column(name = "setting_value")
    private String settingValue;

    private String description;

    @Column(name = "updated_by")
    private UUID updatedBy;

    /** Now written by the service (was insertable/updatable=false, so API responses returned null/stale). */
    @Column(name = "updated_at")
    private Instant updatedAt;

    public String getValue() {
        return settingValue;
    }
}