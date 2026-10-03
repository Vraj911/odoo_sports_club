package com.bookmycourt.common.concurrency;

import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.function.Supplier;

@Component
public class Guard {

    private static final ThreadLocal<Boolean> INSIDE = ThreadLocal.withInitial(() -> false);
    private final LockTable locks = new LockTable(2048);
    private final TransactionTemplate tx;

    public record Decision<T>(Supplier<T> persist, Runnable apply) {
        public static <T> Decision<T> noop(T result) {
            return new Decision<>(() -> result, () -> {
            });
        }
    }

    public Guard(PlatformTransactionManager transactionManager) {
        this.tx = new TransactionTemplate(transactionManager);
        this.tx.setIsolationLevel(TransactionDefinition.ISOLATION_READ_COMMITTED);
        this.tx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    public <T> T run(List<?> keys, Supplier<Decision<T>> decide) {
        if (INSIDE.get()) {
            throw new IllegalStateException("Nested Guard.run is forbidden");
        }
        INSIDE.set(true);
        Object[] keyArray = keys != null ? keys.toArray() : new Object[0];
        try (var ignored = locks.acquire(keyArray)) {
            Decision<T> d = decide.get();
            T result = tx.execute(status -> d.persist().get());
            d.apply().run();
            return result;
        } finally {
            INSIDE.set(false);
        }
    }
}
