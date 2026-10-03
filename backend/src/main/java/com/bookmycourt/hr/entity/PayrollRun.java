package com.bookmycourt.hr.entity;

import com.bookmycourt.common.entity.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "payroll_run")
public class PayrollRun extends BaseEntity {

    @Column(nullable = false, unique = true, length = 7)
    private String month;

    @Column(nullable = false, length = 20)
    private String status = "DRAFT";

    @Column(name = "total_gross", nullable = false)
    private BigDecimal totalGross = BigDecimal.ZERO;

    @Column(name = "total_deductions", nullable = false)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "total_net", nullable = false)
    private BigDecimal totalNet = BigDecimal.ZERO;

    @Column(name = "finalised_at")
    private OffsetDateTime finalisedAt;

    @OneToMany(mappedBy = "payrollRun", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payslip> payslips = new ArrayList<>();
}
