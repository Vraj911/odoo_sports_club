package com.bookmycourt.admin.service;

import com.bookmycourt.admin.dto.AuditLogRequest;
import com.bookmycourt.admin.dto.AuditLogResponse;
import com.bookmycourt.admin.dto.ClubHolidayRequest;
import com.bookmycourt.admin.dto.ClubHolidayResponse;
import com.bookmycourt.admin.dto.ClubPublicResponse;
import com.bookmycourt.admin.dto.ClubSettingRequest;
import com.bookmycourt.admin.dto.ClubSettingResponse;
import com.bookmycourt.admin.dto.TaxRateRequest;
import com.bookmycourt.admin.dto.TaxRateResponse;
import com.bookmycourt.admin.dto.UpdateClubProfileRequest;
import com.bookmycourt.admin.entity.AuditLog;
import com.bookmycourt.admin.entity.ClubHoliday;
import com.bookmycourt.admin.entity.ClubOpeningHours;
import com.bookmycourt.admin.entity.ClubProfile;
import com.bookmycourt.admin.entity.ClubSetting;
import com.bookmycourt.admin.entity.TaxRate;
import com.bookmycourt.admin.mapper.AdminMapper;
import com.bookmycourt.admin.repository.AuditLogRepository;
import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.admin.repository.ClubOpeningHoursRepository;
import com.bookmycourt.admin.repository.ClubProfileRepository;
import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.admin.repository.TaxRateRepository;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.Events;
import com.bookmycourt.common.event.events.SystemEvents.ClubConfigChanged;
import com.bookmycourt.common.mapping.SportMapper;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final ClubProfileRepository profiles;
    private final ClubHolidayRepository holidays;
    private final ClubSettingRepository settings;
    private final TaxRateRepository taxRates;
    private final AuditLogRepository auditLogs;
    private final AppUserRepository users;
    private final ClubOpeningHoursRepository openingHours;
    private final AdminMapper mapper;
    private final BookingEngine bookingEngine;
    private final DomainEventPublisher eventPublisher;
    private final Clock clock;

    public AdminService(
            ClubProfileRepository profiles,
            ClubHolidayRepository holidays,
            ClubSettingRepository settings,
            TaxRateRepository taxRates,
            AuditLogRepository auditLogs,
            AppUserRepository users,
            ClubOpeningHoursRepository openingHours,
            AdminMapper mapper,
            BookingEngine bookingEngine,
            DomainEventPublisher eventPublisher,
            Clock clock) {
        this.profiles = profiles;
        this.holidays = holidays;
        this.settings = settings;
        this.taxRates = taxRates;
        this.auditLogs = auditLogs;
        this.users = users;
        this.openingHours = openingHours;
        this.mapper = mapper;
        this.bookingEngine = bookingEngine;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public ClubPublicResponse getProfile() {
        ClubProfile p = profiles.findAll().stream().findFirst()
                .orElseGet(() -> {
                    ClubProfile np = new ClubProfile();
                    np.setClubName("Champions Club");
                    np.setTimezone("Asia/Kolkata");
                    np.setCurrency("INR");
                    return np;
                });
        var config = bookingEngine.config();
        return new ClubPublicResponse(
                p.getClubName(),
                p.getTimezone(),
                p.getCurrency(),
                SportMapper.slotToTime(config.openSlot()),
                SportMapper.slotToTime(config.closeSlot()),
                config.dailyCap(),
                config.holdMinutes());
    }

    @Transactional
    public ClubPublicResponse updateProfile(UpdateClubProfileRequest request) {
        ClubProfile p = profiles.findAll().stream().findFirst()
                .orElseGet(() -> {
                    ClubProfile np = new ClubProfile();
                    np.setClubName("Champions Club");
                    return np;
                });
        if (request.clubName() != null) p.setClubName(request.clubName());
        if (request.legalName() != null) p.setLegalName(request.legalName());
        if (request.phone() != null) p.setPhone(request.phone());
        if (request.email() != null) p.setEmail(request.email());
        if (request.address() != null) p.setAddress(request.address());
        if (request.website() != null) p.setWebsite(request.website());
        if (request.currency() != null) p.setCurrency(request.currency());
        if (request.timezone() != null) p.setTimezone(request.timezone());
        profiles.save(p);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Profile updated"));
        return getProfile();
    }

    @Transactional
    public ClubHolidayResponse addHoliday(ClubHolidayRequest request) {
        ClubHoliday h = holidays.findByHolidayDate(request.holidayDate())
                .orElseGet(ClubHoliday::new);
        h.setHolidayDate(request.holidayDate());
        h.setName(request.name());
        h.setActive(request.isActive() != null ? request.isActive() : true);
        holidays.save(h);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Holiday added"));
        return mapper.toResponse(h);
    }

    @Transactional(readOnly = true)
    public List<ClubHolidayResponse> listHolidays() {
        return holidays.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public void deleteHoliday(UUID id) {
        holidays.deleteById(id);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Holiday deleted"));
    }

    @Transactional(readOnly = true)
    public ClubSettingResponse getSetting(String key) {
        ClubSetting s = settings.findBySettingKey(key)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Setting not found: " + key));
        return mapper.toResponse(s);
    }

    @Transactional
    public ClubSettingResponse setSetting(ClubSettingRequest request) {
        ClubSetting s = settings.findBySettingKey(request.settingKey())
                .orElseGet(() -> {
                    ClubSetting ns = new ClubSetting();
                    ns.setSettingKey(request.settingKey());
                    return ns;
                });
        s.setSettingValue(request.settingValue());
        if (request.description() != null) s.setDescription(request.description());
        s.setUpdatedBy(request.updatedByUserId());
        settings.save(s);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Setting changed: " + request.settingKey()));
        return mapper.toResponse(s);
    }

    @Transactional(readOnly = true)
    public List<ClubSettingResponse> listSettings() {
        return settings.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ClubOpeningHours> getOpeningHours() {
        return openingHours.findAll();
    }

    @Transactional
    public List<ClubOpeningHours> updateOpeningHours(List<ClubOpeningHours> hoursList) {
        if (hoursList != null) {
            openingHours.saveAll(hoursList);
            eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Opening hours updated"));
        }
        return openingHours.findAll();
    }

    @Transactional
    public TaxRateResponse createTaxRate(TaxRateRequest request) {
        TaxRate tr = new TaxRate();
        tr.setName(request.name());
        tr.setRate(request.rate());
        tr.setEffectiveFrom(request.effectiveFrom());
        tr.setEffectiveTo(request.effectiveTo());
        tr.setActive(request.isActive() != null ? request.isActive() : true);
        taxRates.save(tr);
        return mapper.toResponse(tr);
    }

    @Transactional
    public TaxRateResponse updateTaxRate(UUID id, TaxRateRequest request) {
        TaxRate tr = taxRates.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Tax rate not found: " + id));
        if (request.name() != null) tr.setName(request.name());
        if (request.rate() != null) tr.setRate(request.rate());
        if (request.effectiveFrom() != null) tr.setEffectiveFrom(request.effectiveFrom());
        if (request.effectiveTo() != null) tr.setEffectiveTo(request.effectiveTo());
        if (request.isActive() != null) tr.setActive(request.isActive());
        taxRates.save(tr);
        return mapper.toResponse(tr);
    }

    @Transactional(readOnly = true)
    public List<TaxRateResponse> listTaxRates() {
        return taxRates.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public AuditLogResponse recordAuditLog(AuditLogRequest request) {
        AuditLog a = new AuditLog();
        if (request.actorUserId() != null) {
            AppUser u = users.findById(request.actorUserId()).orElse(null);
            a.setActor(u);
        }
        a.setAction(request.action());
        a.setEntityType(request.entityType());
        a.setEntityId(request.entityId());
        a.setUserAgent(request.userAgent());
        if (request.details() != null) {
            a.setDetails(request.details());
        }
        auditLogs.save(a);
        return mapper.toResponse(a);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> listAuditLogs(String entityType) {
        List<AuditLog> list = (entityType != null && !entityType.isBlank())
                ? auditLogs.findByEntityTypeOrderByOccurredAtDesc(entityType)
                : auditLogs.findByOrderByOccurredAtDesc();
        return list.stream().map(mapper::toResponse).toList();
    }
}
