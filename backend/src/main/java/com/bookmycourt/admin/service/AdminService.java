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
import com.bookmycourt.admin.entity.ClubProfile;
import com.bookmycourt.admin.entity.ClubSetting;
import com.bookmycourt.admin.entity.TaxRate;
import com.bookmycourt.admin.mapper.AdminMapper;
import com.bookmycourt.admin.repository.AuditLogRepository;
import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.admin.repository.ClubProfileRepository;
import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.admin.repository.TaxRateRepository;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final AdminMapper mapper;

    public AdminService(
            ClubProfileRepository profiles,
            ClubHolidayRepository holidays,
            ClubSettingRepository settings,
            TaxRateRepository taxRates,
            AuditLogRepository auditLogs,
            AppUserRepository users,
            AdminMapper mapper) {
        this.profiles = profiles;
        this.holidays = holidays;
        this.settings = settings;
        this.taxRates = taxRates;
        this.auditLogs = auditLogs;
        this.users = users;
        this.mapper = mapper;
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
        return new ClubPublicResponse(p.getClubName(), p.getPhone(), p.getEmail(), p.getAddress(), p.getWebsite(), p.getCurrency(), p.getTimezone());
    }

    @Transactional
    public ClubHolidayResponse addHoliday(ClubHolidayRequest request) {
        ClubHoliday h = holidays.findByHolidayDate(request.holidayDate())
                .orElseGet(ClubHoliday::new);
        h.setHolidayDate(request.holidayDate());
        h.setName(request.name());
        h.setActive(request.isActive() != null ? request.isActive() : true);
        holidays.save(h);
        return mapper.toResponse(h);
    }

    @Transactional(readOnly = true)
    public List<ClubHolidayResponse> listHolidays() {
        return holidays.findAll().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public void deleteHoliday(UUID id) {
        holidays.deleteById(id);
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
        return mapper.toResponse(s);
    }

    @Transactional(readOnly = true)
    public List<ClubSettingResponse> listSettings() {
        return settings.findAll().stream().map(mapper::toResponse).toList();
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
