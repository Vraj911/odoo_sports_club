package com.bookmycourt.social.repository;

import com.bookmycourt.social.entity.SocialTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SocialTemplateRepository extends JpaRepository<SocialTemplate, UUID> {
    List<SocialTemplate> findByActiveTrue();
    List<SocialTemplate> findByCourt_Id(UUID courtId);
}
