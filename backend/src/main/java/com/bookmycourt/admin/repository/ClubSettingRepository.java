package com.bookmycourt.admin.repository;

import com.bookmycourt.admin.entity.ClubSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ClubSettingRepository extends JpaRepository<ClubSetting, UUID> {
    Optional<ClubSetting> findBySettingKey(String settingKey);
}
