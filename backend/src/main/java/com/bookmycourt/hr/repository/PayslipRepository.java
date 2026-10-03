package com.bookmycourt.hr.repository;

import com.bookmycourt.hr.entity.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PayslipRepository extends JpaRepository<Payslip, UUID> {
    List<Payslip> findByPayrollRun_Id(UUID runId);
    List<Payslip> findByEmployee_IdOrderByCreatedAtDesc(UUID employeeId);
    boolean existsByPayrollRun_IdAndEmployee_Id(UUID payrollRunId, UUID employeeId);
}
