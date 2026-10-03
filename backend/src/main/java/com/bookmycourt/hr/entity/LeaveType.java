package com.bookmycourt.hr.entity;

import com.bookmycourt.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "leave_type")
public class LeaveType extends BaseEntity {

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "yearly_days", nullable = false)
    private int yearlyDays = 12;

    @Column(name = "is_paid", nullable = false)
    private boolean paid = true;
}
