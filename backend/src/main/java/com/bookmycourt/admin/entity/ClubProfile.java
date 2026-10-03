package com.bookmycourt.admin.entity;

import com.bookmycourt.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "club_profile")
public class ClubProfile extends BaseEntity {

    @Column(name = "club_name", nullable = false)
    private String clubName;

    @Column(name = "legal_name")
    private String legalName;

    private String phone;
    private String email;
    private String address;
    private String website;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(nullable = false)
    private String timezone = "Asia/Kolkata";
}
