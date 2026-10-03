package com.bookmycourt.common.concurrency;

import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.locks.ReentrantLock;

public final class LockTable {

    public interface Held extends AutoCloseable {
        @Override
        void close();
    }

    private final ReentrantLock[] stripes;

    public LockTable(int size) {
        if (size <= 0) {
            throw new IllegalArgumentException("LockTable size must be positive");
        }
        stripes = new ReentrantLock[size];
        for (int i = 0; i < size; i++) {
            stripes[i] = new ReentrantLock();
        }
    }

    public Held acquire(Object... keys) {
        if (keys == null || keys.length == 0) {
            return () -> {
            };
        }

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
