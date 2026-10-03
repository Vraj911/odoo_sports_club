package com.bookmycourt.hr.repository;

import com.bookmycourt.hr.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, UUID> {
    List<LeaveRequest> findByEmployee_IdOrderByFromDateDesc(UUID employeeId);
    List<LeaveRequest> findByStatusOrderByFromDateDesc(String status);
}
