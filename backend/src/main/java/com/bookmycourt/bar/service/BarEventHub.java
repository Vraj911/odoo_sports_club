package com.bookmycourt.bar.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * BAR-03 / NFR-02: floor, order and KDS screens stay in sync via Server-Sent Events (SRS risk table allows SSE first).
 * Services publish BarChanged; it is pushed to clients only AFTER the transaction commits.
 * Browser EventSource cannot send an Authorization header - accept the JWT as a query param or use a cookie.
 */
@Component
public class BarEventHub {

    public record BarChanged(String type, UUID orderId, UUID tableId, UUID lineId) {
    }

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));
        return emitter;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void on(BarChanged ev) {
        for (SseEmitter e : emitters) {
            try {
                e.send(SseEmitter.event().name(ev.type()).data(ev));
            } catch (IOException | IllegalStateException ex) {
                emitters.remove(e);
            }
        }
    }
}
