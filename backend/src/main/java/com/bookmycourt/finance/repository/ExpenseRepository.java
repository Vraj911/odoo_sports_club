package com.bookmycourt.finance.repository;

import com.bookmycourt.finance.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    Optional<Expense> findByExpenseNumber(String expenseNumber);
    List<Expense> findByExpenseType(String expenseType);
    List<Expense> findByOrderByIncurredAtDesc();
}
