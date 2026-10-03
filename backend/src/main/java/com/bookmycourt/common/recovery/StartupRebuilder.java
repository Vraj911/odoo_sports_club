package com.bookmycourt.common.recovery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class StartupRebuilder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupRebuilder.class);

    private final List<Rebuildable> rebuildables;

    public StartupRebuilder(List<Rebuildable> rebuildables) {
        this.rebuildables = rebuildables;
    }

    @Override
    public void run(ApplicationArguments args) {
        log.info("Running startup recovery rebuilders (count: {})...", rebuildables.size());
        for (Rebuildable r : rebuildables) {
            try {
                log.info("Rebuilding {}...", r.name());
                r.rebuild();
                List<String> discrepancies = r.verify();
                if (!discrepancies.isEmpty()) {
                    log.warn("{} discrepancies detected after rebuild: {}", r.name(), discrepancies);
                } else {
                    log.info("{} verified cleanly.", r.name());
                }
            } catch (Exception e) {
                log.error("Failed to rebuild {}", r.name(), e);
            }
        }
    }
}
