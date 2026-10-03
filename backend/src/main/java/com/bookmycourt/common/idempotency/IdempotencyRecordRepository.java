package com.bookmycourt.common.idempotency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, UUID> {

    Optional<IdempotencyRecord> findByIdemKeyAndMethodAndPath(String idemKey, String method, String path);

    long deleteByCreatedAtBefore(Instant cutoff);
}
