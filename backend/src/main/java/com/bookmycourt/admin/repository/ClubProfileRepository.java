package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.ClubProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClubProfileRepository extends JpaRepository<ClubProfile, UUID> {
}
