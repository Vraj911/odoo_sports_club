package com.bookmycourt.common.actor;

import java.util.function.Supplier;

public final class ActorHolder {

    private static final ThreadLocal<Actor> CURRENT = new ThreadLocal<>();

    private ActorHolder() {
    }

    public static Actor current() {
        Actor actor = CURRENT.get();
        return actor != null ? actor : Actor.SYSTEM;
    }

    public static void set(Actor actor) {
        if (actor == null) {
            CURRENT.remove();
        } else {
            CURRENT.set(actor);
        }
    }

    public static void clear() {
        CURRENT.remove();
    }

    public static void runAs(Actor actor, Runnable runnable) {
        Actor previous = CURRENT.get();
        try {
            CURRENT.set(actor != null ? actor : Actor.SYSTEM);
            runnable.run();
        } finally {
            if (previous != null) {
                CURRENT.set(previous);
            } else {
                CURRENT.remove();
            }
        }
    }

    public static <T> T runAs(Actor actor, Supplier<T> supplier) {
        Actor previous = CURRENT.get();
        try {
            CURRENT.set(actor != null ? actor : Actor.SYSTEM);
            return supplier.get();
        } finally {
            if (previous != null) {
                CURRENT.set(previous);
            } else {
                CURRENT.remove();
            }
        }
    }
}
