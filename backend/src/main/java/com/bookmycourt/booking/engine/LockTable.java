package com.bookmycourt.booking.engine;

final class LockTable {
    interface Held extends AutoCloseable {
        @Override
        void close();
    }

    private final com.bookmycourt.common.concurrency.LockTable delegate;

    LockTable(int size) {
        this.delegate = new com.bookmycourt.common.concurrency.LockTable(size);
    }

    Held acquire(Object... keys) {
        com.bookmycourt.common.concurrency.LockTable.Held held = delegate.acquire(keys);
        return held::close;
    }
}
