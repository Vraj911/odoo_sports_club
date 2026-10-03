package com.bookmycourt.membership.repository;

import com.bookmycourt.membership.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlanRepository extends JpaRepository<Plan, UUID> {
    List<Plan> findByActiveTrue();
    Optional<Plan> findByName(String name);
}
