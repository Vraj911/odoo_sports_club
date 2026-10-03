package com.bookmycourt.membership.job;

import com.bookmycourt.common.job.JobRunner;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.repository.MembershipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class MembershipStatusJob {

    private static final Logger log = LoggerFactory.getLogger(MembershipStatusJob.class);

    private final MembershipRepository memberships;
    private final JobRunner jobRunner;

    public MembershipStatusJob(MembershipRepository memberships, JobRunner jobRunner) {
        this.memberships = memberships;
        this.jobRunner = jobRunner;
    }

    @Scheduled(cron = "${membership.status-cron:0 0 * * * *}")
    public void run() {
        jobRunner.run("membership.status", () -> {
            LocalDate today = LocalDate.now();
            List<Membership> activeList = memberships.findByStatusIn(List.of("ACTIVE", "EXPIRING_SOON"));
            int updated = 0;
            for (Membership m : activeList) {
                if (m.getEndDate() != null && m.getEndDate().isBefore(today)) {
                    m.setStatus("EXPIRED");
                    memberships.save(m);
                    updated++;
                } else if (m.getEndDate() != null && !m.getEndDate().isAfter(today.plusDays(15)) && "ACTIVE".equalsIgnoreCase(m.getStatus())) {
                    m.setStatus("EXPIRING_SOON");
                    memberships.save(m);
                    updated++;
                }
            }
            log.info("MembershipStatusJob finished. Updated {} memberships", updated);
        });
    }
}
