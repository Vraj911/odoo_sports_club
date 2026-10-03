package com.bookmycourt.crm.mapper;

import com.bookmycourt.crm.dto.FollowUpResponse;
import com.bookmycourt.crm.dto.LeadResponse;
import com.bookmycourt.crm.entity.FollowUp;
import com.bookmycourt.crm.entity.Lead;
import org.springframework.stereotype.Component;

@Component
public class CrmMapper {

    public LeadResponse toResponse(Lead l) {
        String memberName = null;
        if (l.getMember() != null) {
            memberName = l.getMember().getFirstName() + " " + l.getMember().getLastName();
        }
        String assignedTo = null;
        if (l.getAssignedTo() != null) {
            assignedTo = l.getAssignedTo().getFirstName() + " " + l.getAssignedTo().getLastName();
        }
        return new LeadResponse(
                l.getId(),
                l.getLeadNumber(),
                l.getMember() == null ? null : l.getMember().getId(),
                memberName,
                l.getAssignedTo() == null ? null : l.getAssignedTo().getId(),
                assignedTo,
                l.getFirstName(),
                l.getLastName(),
                l.getEmail(),
                l.getPhone(),
                l.getSource(),
                l.getStatus(),
                l.getNotes(),
                l.getConvertedAt(),
                l.getLostReason(),
                l.getLastContactAt(),
                l.getNextFollowUpAt(),
                l.getCreatedAt()
        );
    }

    public FollowUpResponse toResponse(FollowUp f) {
        String assignedTo = null;
        if (f.getAssignedTo() != null) {
            assignedTo = f.getAssignedTo().getFirstName() + " " + f.getAssignedTo().getLastName();
        }
        String completedBy = null;
        if (f.getCompletedBy() != null) {
            completedBy = f.getCompletedBy().getFirstName() + " " + f.getCompletedBy().getLastName();
        }
        return new FollowUpResponse(
                f.getId(),
                f.getLead().getId(),
                f.getLead().getFirstName() + " " + (f.getLead().getLastName() != null ? f.getLead().getLastName() : ""),
                f.getAssignedTo() == null ? null : f.getAssignedTo().getId(),
                assignedTo,
                f.getDueAt(),
                f.getStatus(),
                f.getSubject(),
                f.getNotes(),
                f.getCompletedAt(),
                completedBy,
                f.getCreatedAt()
        );
    }
}
