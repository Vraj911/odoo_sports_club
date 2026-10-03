package com.bookmycourt.social.job;

import com.bookmycourt.common.job.JobRunner;
import com.bookmycourt.social.service.SocialService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RecurrenceExpanderJob {

    private static final Logger log = LoggerFactory.getLogger(RecurrenceExpanderJob.class);

    private final SocialService socialService;
    private final JobRunner jobRunner;

    public RecurrenceExpanderJob(SocialService socialService, JobRunner jobRunner) {
        this.socialService = socialService;
        this.jobRunner = jobRunner;
    }

    @Scheduled(cron = "${social.recurrence-cron:0 0 2 * * *}")
    public void run() {
        jobRunner.run("RecurrenceExpanderJob", () -> {
            log.info("Expanding social session templates for the next 4 weeks...");
            socialService.expandTemplatesForNext4Weeks();
        });
    }
}
