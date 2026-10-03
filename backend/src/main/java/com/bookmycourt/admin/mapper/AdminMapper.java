package com.bookmycourt.admin.mapper;

import com.bookmycourt.admin.dto.AuditLogResponse;
import com.bookmycourt.admin.dto.ClubHolidayResponse;
import com.bookmycourt.admin.dto.ClubSettingResponse;
import com.bookmycourt.admin.dto.TaxRateResponse;
import com.bookmycourt.admin.entity.AuditLog;
import com.bookmycourt.admin.entity.ClubHoliday;
import com.bookmycourt.admin.entity.ClubSetting;
import com.bookmycourt.admin.entity.TaxRate;
import org.springframework.stereotype.Component;

@Component
public class AdminMapper {

    public ClubHolidayResponse toResponse(ClubHoliday h) {
        return new ClubHolidayResponse(
                h.getId(),
                h.getHolidayDate(),
                h.getName(),
                h.isActive()
        );
    }

    public ClubSettingResponse toResponse(ClubSetting s) {
        return new ClubSettingResponse(
                s.getId(),
                s.getSettingKey(),
                s.getSettingValue(),
                s.getDescription(),
                s.getUpdatedBy(),
                s.getUpdatedAt()
        );
    }

    public TaxRateResponse toResponse(TaxRate tr) {
        return new TaxRateResponse(
                tr.getId(),
                tr.getName(),
                tr.getRate(),
                tr.getEffectiveFrom(),
                tr.getEffectiveTo(),
                tr.isActive()
        );
    }

    public AuditLogResponse toResponse(AuditLog a) {
        String actorName = null;
        if (a.getActor() != null) {
            actorName = a.getActor().getFirstName() + " " + a.getActor().getLastName();
        }
        return new AuditLogResponse(
                a.getId(),
                a.getActor() == null ? null : a.getActor().getId(),
                actorName,
                a.getAction(),
                a.getEntityType(),
                a.getEntityId(),
                a.getOccurredAt(),
                a.getUserAgent(),
                a.getDetails()
        );
    }
}
