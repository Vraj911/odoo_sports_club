package com.bookmycourt.finance.entity;

import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.membership.entity.AppUser;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "ledger_transaction")
public class LedgerTransaction extends BaseEntity {

    @Column(nullable = false, length = 40)
    private String kind;

    @Column(name = "ref_type", nullable = false, length = 40)
    private String refType;

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt = OffsetDateTime.now();

    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reversal_of")
    private LedgerTransaction reversalOf;

    @Column(nullable = false)
    private boolean simulated = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private AppUser createdBy;

    @OneToMany(mappedBy = "transaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LedgerEntry> entries = new ArrayList<>();
}
