package com.bookmycourt.common.idempotency;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class IdempotencyService {

    private final IdempotencyRecordRepository repository;
    private final Clock clock;

    public record StoredResponse(int statusCode, String responseBody) {
    }

    public IdempotencyService(IdempotencyRecordRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public static String computeHash(byte[] content) {
        if (content == null || content.length == 0) {
            content = new byte[0];
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    @Transactional(readOnly = true)
    public Optional<IdempotencyRecord> find(String key, String method, String path) {
        return repository.findByIdemKeyAndMethodAndPath(key, method, path);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void save(String key, String method, String path, String requestHash, int statusCode, String responseBody) {
        if (statusCode >= 200 && statusCode < 500) {
            IdempotencyRecord record = IdempotencyRecord.builder()
                    .idemKey(key)
                    .method(method)
                    .path(path)
                    .requestHash(requestHash)
                    .statusCode(statusCode)
                    .responseBody(responseBody)
                    .createdAt(clock.instant())
                    .build();
            repository.save(record);
        }
    }

    @Transactional
    public long cleanup(Instant cutoff) {
        return repository.deleteByCreatedAtBefore(cutoff);
    }
}
