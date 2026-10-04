package com.bookmycourt.crm.service;

import com.bookmycourt.crm.entity.Lead;
import com.bookmycourt.crm.entity.LeadActivity;
import com.bookmycourt.crm.model.CrmEnums.ActivityType;
import com.bookmycourt.crm.repository.LeadActivityRepository;
import com.bookmycourt.crm.util.CrmClock;
import com.bookmycourt.membership.entity.AppUser;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** Writes the lead activity timeline (CRM-03) and tracks first/last contact. */
@Component
public class LeadActivityLogger {

    private final LeadActivityRepository activities;
    private final CrmClock clock;

    public LeadActivityLogger(LeadActivityRepository activities, CrmClock clock) {
        this.activities = activities;
        this.clock = clock;
    }

    public LeadActivity log(Lead lead, ActivityType type, String note, AppUser by, Instant at) {
        LeadActivity a = new LeadActivity();
        a.setLead(lead);
        a.setType(type.name());
        a.setNote(note);
        a.setCreatedBy(by);
        a.setOccurredAt(at != null ? at : clock.now());
        return activities.save(a);
    }

    /** The club contacted the lead: remember it, and remember the FIRST time for the response-time KPI. */
    public void recordContact(Lead lead) {
        Instant now = clock.now();
        lead.setLastContactAt(now);
        if (lead.getFirstContactAt() == null) {
            lead.setFirstContactAt(now);
        }
    }
}
