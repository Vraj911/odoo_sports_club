package com.bookmycourt.hr.repository;

import com.bookmycourt.hr.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByEmployeeNumber(String employeeNumber);
    Optional<Employee> findByUser_Id(UUID userId);
    List<Employee> findByEmploymentStatus(String status);
    List<Employee> findByOrderByJoiningDateDesc();

    @org.springframework.data.jpa.repository.Query("SELECT MAX(e.employeeNumber) FROM Employee e")
    String findMaxEmployeeNumber();
}
