package com.bookmycourt.common.event;

import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
public class DomainEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(DomainEventPublisher.class);

    private final ApplicationEventPublisher publisher;
    private final MeterRegistry meterRegistry;

    public DomainEventPublisher(ApplicationEventPublisher publisher,
                                @Autowired(required = false) MeterRegistry meterRegistry) {
        this.publisher = publisher;
        this.meterRegistry = meterRegistry;
    }

    public void publish(DomainEvent event) {
        if (event == null) {
            return;
        }
        log.debug("Publishing domain event: type={}, aggregateKey={}", event.type(), event.aggregateKey());
        publisher.publishEvent(event);
        if (meterRegistry != null) {
            meterRegistry.counter("events.published", "type", event.type()).increment();
        }
    }
}
