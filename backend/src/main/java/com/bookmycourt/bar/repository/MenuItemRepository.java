package com.bookmycourt.bar.repository;

import com.bookmycourt.bar.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByAvailableTrue();
    List<MenuItem> findByCategoryIgnoreCaseAndAvailableTrue(String category);
}
