package com.bookmycourt.common.event;

import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.function.Consumer;

@Component
public class EventHandlerRunner {

    private static final Logger log = LoggerFactory.getLogger(EventHandlerRunner.class);

    private final EventLoopGuard guard;
    private final TransactionTemplate requiresNew;
    private final MeterRegistry meters;

    public EventHandlerRunner(EventLoopGuard guard,
                              PlatformTransactionManager tm,
                              @Autowired(required = false) MeterRegistry meters) {
        this.guard = guard;
        this.requiresNew = new TransactionTemplate(tm);
        this.requiresNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.meters = meters;
    }

    public <E extends DomainEvent> void run(E event, String handlerName, Consumer<E> handler) {
        if (!guard.enter(event)) {
            log.warn("Event dropped due to loop guard: handler={}, event={}", handlerName, event);
            if (meters != null) {
                meters.counter("events.dropped.loop", "handler", handlerName).increment();
            }
            return;
        }
        try {
            requiresNew.executeWithoutResult(status -> handler.accept(event));
        } catch (Throwable t) {
            log.error("Handler {} failed for event {}: {}", handlerName, event, t.getMessage(), t);
            if (meters != null) {
                meters.counter("events.handler.failed", "handler", handlerName).increment();
            }
        } finally {
            guard.exit();
        }
    }
}
