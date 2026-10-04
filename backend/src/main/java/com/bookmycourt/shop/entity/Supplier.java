package com.bookmycourt.shop.entity;

import com.bookmycourt.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "supplier")
public class Supplier extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String name;

    @Column(length = 15)
    private String gstin;

    private String phone;
    private String email;
    private String address;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
