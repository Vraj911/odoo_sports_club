package com.bookmycourt.admin.mapper;

import com.bookmycourt.admin.dto.AuditLogResponse;
import com.bookmycourt.admin.dto.ClubHolidayResponse;
import com.bookmycourt.admin.dto.ClubProfileResponse;
import com.bookmycourt.admin.dto.ClubSettingResponse;
import com.bookmycourt.admin.dto.OpeningHoursResponse;
import com.bookmycourt.admin.dto.TaxRateResponse;
import com.bookmycourt.admin.entity.AuditLog;
import com.bookmycourt.admin.entity.ClubHoliday;
import com.bookmycourt.admin.entity.ClubOpeningHours;
import com.bookmycourt.admin.entity.ClubProfile;
import com.bookmycourt.admin.entity.ClubSetting;
import com.bookmycourt.admin.entity.TaxRate;
import com.bookmycourt.admin.service.SettingKeys;
import com.bookmycourt.membership.entity.AppUser;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.format.TextStyle;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class AdminMapper {

    public ClubProfileResponse toProfileResponse(ClubProfile p) {
        return new ClubProfileResponse(
                p.getClubName(), p.getLegalName(), p.getPhone(), p.getEmail(), p.getAddress(),
                p.getWebsite(), p.getLogoUrl(), p.getGstin(), p.getCurrency(), p.getTimezone(),
                p.getInvoicePrefix(), p.getReceiptPrefix(), p.getBillPrefix());
    }

    public OpeningHoursResponse toResponse(ClubOpeningHours h) {
        return new OpeningHoursResponse(
                h.getWeekday(),
                DayOfWeek.of(h.getWeekday()).getDisplayName(TextStyle.FULL, Locale.ENGLISH),
                h.getOpenTime(),
                h.getCloseTime(),
                h.isClosed());
    }

    public ClubHolidayResponse toResponse(ClubHoliday h) {
        return new ClubHolidayResponse(
                h.getId(), h.getHolidayDate(), h.getName(), h.isActive(),
                h.isClosed(), h.getOpenTime(), h.getCloseTime());
    }

    public ClubSettingResponse toResponse(ClubSetting s) {
        String value = SettingKeys.isSensitive(s.getSettingKey()) && s.getSettingValue() != null
                ? "********" : s.getSettingValue();
        return new ClubSettingResponse(
                s.getId(), s.getSettingKey(), value, s.getDescription(), s.getUpdatedBy(), s.getUpdatedAt());
    }

    public TaxRateResponse toResponse(TaxRate t) {
        return new TaxRateResponse(
                t.getId(), t.getName(), t.getItemType(), t.getHsnCode(), t.getRate(), t.isTaxInclusive(),
                t.getEffectiveFrom(), t.getEffectiveTo(), t.isActive());
    }

    public AuditLogResponse toResponse(AuditLog a) {
        AppUser actor = a.getActor();
        String actorName = null;
        if (actor != null) {
            String n = Stream.of(actor.getFirstName(), actor.getLastName())
                    .filter(Objects::nonNull).filter(s -> !s.isBlank())
                    .collect(Collectors.joining(" "));
            actorName = n.isBlank() ? null : n;
        }
        return new AuditLogResponse(
                a.getId(),
                actor == null ? null : actor.getId(),
                actorName,
                a.getAction(),
                a.getEntityType(),
                a.getEntityId(),
                a.getOccurredAt(),
                a.getUserAgent(),
                a.getReason(),
                a.getBeforeValue(),
                a.getAfterValue(),
                a.getDetails());
    }
}