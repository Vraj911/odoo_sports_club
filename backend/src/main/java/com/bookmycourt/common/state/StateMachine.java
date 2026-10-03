package com.bookmycourt.common.state;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public final class StateMachine<S extends Enum<S>> {

    private final Map<S, Set<S>> allowed;

    private StateMachine(Map<S, Set<S>> allowed) {
        this.allowed = Map.copyOf(allowed);
    }

    public static <S extends Enum<S>> Builder<S> of(Class<S> type) {
        return new Builder<>();
    }

    public boolean canTransition(S from, S to) {
        if (from == null || to == null) {
            return false;
        }
        return allowed.getOrDefault(from, Collections.emptySet()).contains(to);
    }

    public void check(S from, S to, String entity) {
        if (!canTransition(from, to)) {
            throw new DomainException(ErrorCode.INVALID_STATE,
                    entity + ": transition from " + from + " to " + to + " not allowed");
        }
    }

    public static final class Builder<S extends Enum<S>> {
        private final Map<S, Set<S>> map = new HashMap<>();

        @SafeVarargs
        public final Builder<S> allow(S from, S... to) {
            if (from != null && to != null) {
                Set<S> targets = map.computeIfAbsent(from, k -> new HashSet<>());
                for (S target : to) {
                    if (target != null) {
                        targets.add(target);
                    }
                }
            }
            return this;
        }

        public StateMachine<S> build() {
            return new StateMachine<>(map);
        }
    }
}
