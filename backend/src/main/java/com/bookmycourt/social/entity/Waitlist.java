package com.bookmycourt.social.entity;

import com.bookmycourt.common.entity.BaseEntity;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.membership.entity.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "waitlist")
public class Waitlist extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private SocialSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "court_id")
    private Court court;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(name = "guest_name", length = 200)
    private String guestName;

    @Column(name = "requested_start_at")
    private Instant requestedStartAt;

    @Column(name = "requested_end_at")
    private Instant requestedEndAt;

    @Column(nullable = false)
    private Integer position = 1;

    @Column(nullable = false, length = 15)
    private String status = "WAITING";
}
