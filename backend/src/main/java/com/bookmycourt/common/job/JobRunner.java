package com.bookmycourt.common.job;

import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

@Component
public class JobRunner {

    private static final Logger log = LoggerFactory.getLogger(JobRunner.class);

    private final ConcurrentHashMap<String, ReentrantLock> locks = new ConcurrentHashMap<>();
    private final MeterRegistry meterRegistry;

    public JobRunner(@Autowired(required = false) MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void run(String jobName, Runnable task) {
        ReentrantLock lock = locks.computeIfAbsent(jobName, k -> new ReentrantLock());
        if (!lock.tryLock()) {
            log.warn("Job [{}] skipped: already running on another thread", jobName);
            return;
        }

        long start = System.nanoTime();
        String outcome = "SUCCESS";

        try {
            ActorHolder.runAs(Actor.SYSTEM, () -> {
                log.info("Starting scheduled job [{}]", jobName);
                task.run();
                log.info("Completed scheduled job [{}]", jobName);
            });
        } catch (Throwable t) {
            outcome = "FAILED";
            log.error("Scheduled job [{}] failed with exception: {}", jobName, t.getMessage(), t);
        } finally {
            lock.unlock();
            long durationNanos = System.nanoTime() - start;
            if (meterRegistry != null) {
                meterRegistry.counter("job.runs", "job", jobName, "outcome", outcome).increment();
                Timer.builder("job.duration")
                        .tag("job", jobName)
                        .tag("outcome", outcome)
                        .register(meterRegistry)
                        .record(durationNanos, TimeUnit.NANOSECONDS);
            }
        }
    }
}
