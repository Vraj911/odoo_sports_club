package com.bookmycourt.finance.repository;

import com.bookmycourt.finance.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    Optional<Expense> findByExpenseNumber(String expenseNumber);
    List<Expense> findByExpenseType(String expenseType);
    List<Expense> findByOrderByIncurredAtDesc();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e")
    BigDecimal sumAll();

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.incurredAt >= :from AND e.incurredAt < :to")
    BigDecimal sumBetween(@Param("from") Instant from, @Param("to") Instant to);
}
