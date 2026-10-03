package com.bookmycourt.common.event;

import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;

@Component
public class EventLoopGuard {

    private static final int MAX_DEPTH = 6;
    private final ThreadLocal<Deque<String>> stack = ThreadLocal.withInitial(ArrayDeque::new);

    public boolean enter(DomainEvent event) {
        if (event == null) {
            return false;
        }
        Deque<String> s = stack.get();
        String key = event.type() + ":" + event.aggregateKey();
        if (s.size() >= MAX_DEPTH || s.contains(key)) {
            return false;
        }
        s.push(key);
        return true;
    }

    public void exit() {
        Deque<String> s = stack.get();
        if (!s.isEmpty()) {
            s.pop();
        }
        if (s.isEmpty()) {
            stack.remove();
        }
    }
}
