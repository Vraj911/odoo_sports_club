package com.bookmycourt.social.entity;

import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.facility.entity.Court;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "social_template")
public class SocialTemplate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;

    @Column(nullable = false)
    private Short weekday; // 1 = Monday .. 7 = Sunday

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Integer capacity = 8;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "price_by_tier")
    private String priceByTier;

    @Column(nullable = false)
    private Boolean active = true;
}
