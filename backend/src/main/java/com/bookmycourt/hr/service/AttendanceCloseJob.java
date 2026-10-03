// ===== hr/service/AttendanceCloseJob.java  (NEW) =====
package com.bookmycourt.hr.service;

import java.time.Clock;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.bookmycourt.common.time.ClubTime;

/**
 * HR-03: flags absences at the end of each day. Scheduling is already enabled
 * by HoldReaper's @EnableScheduling.
 */
@Component
public class AttendanceCloseJob {

    private static final Logger log = LoggerFactory.getLogger(AttendanceCloseJob.class);

    private final HrService hr;
    private final Clock clock;

    public AttendanceCloseJob(HrService hr, Clock clock) {
        this.hr = hr;
        this.clock = clock;
    }

    @Scheduled(cron = "0 55 23 * * *", zone = "Asia/Kolkata")
    public void closeToday() {
        try {
            hr.closeDay(LocalDate.now(clock.withZone(ClubTime.IST)));
        } catch (Exception e) {
            log.error("Attendance close-day failed", e);
        }
    }
}
