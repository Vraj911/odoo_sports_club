package com.bookmycourt.booking.entity;
import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.pricing.entity.PricingRule;
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
import java.time.OffsetDateTime;
import java.util.UUID;
@Getter
@Setter
@Entity
@Table(name = "booking")
public class Booking extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "court_id", nullable = false)
    private Court court;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pricing_rule_id")
    private PricingRule pricingRule;
    @Column(name = "guest_name")
    private String guestName;
    @Column(name = "guest_phone")
    private String guestPhone;
    @Column(name = "start_time", nullable = false)
    private OffsetDateTime startTime;
    @Column(name = "end_time", nullable = false)
    private OffsetDateTime endTime;
    @Column(nullable = false)
    private String status = "PENDING";
    @Column(name = "price_charged", nullable = false)
    private BigDecimal priceCharged = BigDecimal.ZERO;
    @Column(name = "payment_status", nullable = false)
    private String paymentStatus = "UNPAID";
    private String notes;
    @Column(name = "expires_at")
    private OffsetDateTime expiresAt;
    @Column(name = "created_by")
    private UUID createdBy;
    @Column(name = "price_breakdown")
    private String priceBreakdown;
    @Column(name = "payment_policy")
    private String paymentPolicy;
    @Column(name = "source")
    private String source;
    @Column(name = "cancel_reason")
    private String cancelReason;
    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;
    /** PostgreSQL-generated Asia/Kolkata booking date; read-only in JPA. */
    @Column(name = "booking_day", insertable = false, updatable = false)
    private LocalDate bookingDay;
    /** PostgreSQL-generated half-hour start index (0-47); read-only in JPA. */
    @Column(name = "start_slot", insertable = false, updatable = false)
    private Short startSlot;
    @jakarta.persistence.Version
    @Column(name = "version")
    private Long version;
}
