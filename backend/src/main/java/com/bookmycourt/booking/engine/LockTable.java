package com.bookmycourt.booking.engine;

import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Fixed pool of locks ("stripes"). A key (court-day, member-day) is hashed to one stripe.
 *
 * DEADLOCK AVOIDANCE: every caller acquires its stripes in ASCENDING INDEX ORDER.
 */
final class LockTable {

    interface Held extends AutoCloseable {
        @Override void close();
    }

    private final ReentrantLock[] stripes;

    LockTable(int size) {
        stripes = new ReentrantLock[size];
        for (int i = 0; i < size; i++) {
            stripes[i] = new ReentrantLock();
        }
    }

    Held acquire(Object... keys) {
        int[] idx = Arrays.stream(keys)
                .filter(Objects::nonNull)
                .mapToInt(k -> Math.floorMod(k.hashCode(), stripes.length))
                .distinct()
                .sorted()
                .toArray();

        for (int i : idx) {
            stripes[i].lock();
        }

        return () -> {
            for (int j = idx.length - 1; j >= 0; j--) {
                stripes[idx[j]].unlock();
            }
        };
    }
}
