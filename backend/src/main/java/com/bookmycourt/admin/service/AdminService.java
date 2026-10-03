package com.bookmycourt.admin.service;

import com.bookmycourt.admin.dto.ClubHolidayRequest;
import com.bookmycourt.admin.dto.ClubHolidayResponse;
import com.bookmycourt.admin.dto.ClubProfileResponse;
import com.bookmycourt.admin.dto.ClubSettingRequest;
import com.bookmycourt.admin.dto.ClubSettingResponse;
import com.bookmycourt.admin.dto.OpeningHoursRequest;
import com.bookmycourt.admin.dto.OpeningHoursResponse;
import com.bookmycourt.admin.dto.TaxRateRequest;
import com.bookmycourt.admin.dto.TaxRateResponse;
import com.bookmycourt.admin.dto.UpdateClubProfileRequest;
import com.bookmycourt.admin.entity.ClubHoliday;
import com.bookmycourt.admin.entity.ClubOpeningHours;
import com.bookmycourt.admin.entity.ClubProfile;
import com.bookmycourt.admin.entity.ClubSetting;
import com.bookmycourt.admin.entity.TaxRate;
import com.bookmycourt.admin.mapper.AdminMapper;
import com.bookmycourt.admin.repository.ClubHolidayRepository;
import com.bookmycourt.admin.repository.ClubOpeningHoursRepository;
import com.bookmycourt.admin.repository.ClubProfileRepository;
import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.admin.repository.TaxRateRepository;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.Events;
import com.bookmycourt.common.event.events.SystemEvents.ClubConfigChanged;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Currency;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final int SLOT_MINUTES = 30;
    private static final int MIN_SESSION_MINUTES = 60;

    private final ClubProfileRepository profiles;
    private final ClubHolidayRepository holidays;
    private final ClubSettingRepository settings;
    private final TaxRateRepository taxRates;
    private final ClubOpeningHoursRepository openingHours;
    private final AdminMapper mapper;
    private final AuditService audit;
    private final DomainEventPublisher eventPublisher;
    private final Clock clock;

    public AdminService(
            ClubProfileRepository profiles,
            ClubHolidayRepository holidays,
            ClubSettingRepository settings,
            TaxRateRepository taxRates,
            ClubOpeningHoursRepository openingHours,
            AdminMapper mapper,
            AuditService audit,
            DomainEventPublisher eventPublisher,
            Clock clock) {
        this.profiles = profiles;
        this.holidays = holidays;
        this.settings = settings;
        this.taxRates = taxRates;
        this.openingHours = openingHours;
        this.mapper = mapper;
        this.audit = audit;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    // ------------------------------------------------------------------ profile (CFG-01)

    @Transactional(readOnly = true)
    public ClubProfileResponse getProfile() {
        return mapper.toProfileResponse(loadProfile());
    }

    @Transactional
    public ClubProfileResponse updateProfile(UpdateClubProfileRequest r) {
        ClubProfile p = loadProfile();
        ClubProfileResponse before = mapper.toProfileResponse(p);

        if (r.clubName() != null) {
            if (r.clubName().isBlank()) throw bad("Club name cannot be blank");
            p.setClubName(r.clubName().trim());
        }
        if (r.legalName() != null) p.setLegalName(blankToNull(r.legalName()));
        if (r.phone() != null) p.setPhone(blankToNull(r.phone()));
        if (r.email() != null) p.setEmail(blankToNull(r.email()));
        if (r.address() != null) p.setAddress(blankToNull(r.address()));
        if (r.website() != null) p.setWebsite(blankToNull(r.website()));
        if (r.logoUrl() != null) p.setLogoUrl(blankToNull(r.logoUrl()));
        if (r.gstin() != null) p.setGstin(blankToNull(r.gstin()));
        if (r.currency() != null) {
            try {
                p.setCurrency(Currency.getInstance(r.currency().toUpperCase()).getCurrencyCode());
            } catch (IllegalArgumentException e) {
                throw bad("Unknown currency code: " + r.currency());
            }
        }
        if (r.timezone() != null) {
            try {
                p.setTimezone(ZoneId.of(r.timezone()).getId());
            } catch (Exception e) {
                throw bad("Unknown timezone: " + r.timezone());
            }
        }
        if (r.invoicePrefix() != null) p.setInvoicePrefix(r.invoicePrefix());
        if (r.receiptPrefix() != null) p.setReceiptPrefix(r.receiptPrefix());
        if (r.billPrefix() != null) p.setBillPrefix(r.billPrefix());

        profiles.save(p);
        ClubProfileResponse after = mapper.toProfileResponse(p);
        audit.record("CLUB_PROFILE_UPDATED", "CLUB_PROFILE", null, before, after);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Profile updated"));
        return after;
    }

    private ClubProfile loadProfile() {
        return profiles.findAll().stream().findFirst().orElseGet(() -> {
            ClubProfile np = new ClubProfile();
            np.setClubName(ClubQueryService.DEFAULT_NAME);
            return np;
        });
    }

    // ------------------------------------------------------------------ holidays (BKG-02, HR-09)

    @Transactional
    public ClubHolidayResponse addHoliday(ClubHolidayRequest r) {
        boolean closed = r.closed() == null || r.closed();
        validateTimes(closed, r.openTime(), r.closeTime(), "Holiday " + r.holidayDate());

        ClubHoliday h = holidays.findByHolidayDate(r.holidayDate()).orElseGet(ClubHoliday::new);
        ClubHolidayResponse before = h.getId() == null ? null : mapper.toResponse(h);

        h.setHolidayDate(r.holidayDate());
        h.setName(r.name().trim());
        h.setActive(r.isActive() == null || r.isActive());
        h.setClosed(closed);
        h.setOpenTime(closed ? null : r.openTime());
        h.setCloseTime(closed ? null : r.closeTime());
        holidays.save(h);

        ClubHolidayResponse after = mapper.toResponse(h);
        audit.record(before == null ? "HOLIDAY_CREATED" : "HOLIDAY_UPDATED", "CLUB_HOLIDAY", h.getId(), before, after);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Holiday saved"));
        return after;
    }

    @Transactional(readOnly = true)
    public List<ClubHolidayResponse> listHolidays(LocalDate from, LocalDate to) {
        List<ClubHoliday> list = (from == null && to == null)
                ? holidays.findAllByOrderByHolidayDateAsc()
                : holidays.findByHolidayDateBetweenOrderByHolidayDateAsc(
                        from == null ? LocalDate.of(1970, 1, 1) : from,
                        to == null ? LocalDate.of(2999, 12, 31) : to);
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public void deleteHoliday(UUID id) {
        ClubHoliday h = holidays.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Holiday not found: " + id));
        ClubHolidayResponse before = mapper.toResponse(h);
        holidays.delete(h);
        audit.record("HOLIDAY_DELETED", "CLUB_HOLIDAY", id, before, null);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Holiday deleted"));
    }

    // ------------------------------------------------------------------ settings (CFG-02)

    @Transactional(readOnly = true)
    public ClubSettingResponse getSetting(String key) {
        ClubSetting s = settings.findBySettingKey(key)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Setting not found: " + key));
        return mapper.toResponse(s);
    }

    @Transactional
    public ClubSettingResponse setSetting(ClubSettingRequest r) {
        String key = r.settingKey() == null ? null : r.settingKey().trim();
        SettingKeys.validate(key, r.settingValue());

        ClubSetting s = settings.findBySettingKey(key).orElseGet(() -> {
            ClubSetting ns = new ClubSetting();
            ns.setSettingKey(key);
            return ns;
        });
        ClubSettingResponse before = s.getId() == null ? null : mapper.toResponse(s);

        s.setSettingValue(r.settingValue() == null ? null : r.settingValue().trim());
        if (r.description() != null) s.setDescription(r.description());
        s.setUpdatedBy(audit.currentActorId());
        s.setUpdatedAt(Instant.now(clock));
        settings.save(s);

        ClubSettingResponse after = mapper.toResponse(s);
        audit.record("SETTING_CHANGED", "CLUB_SETTING", s.getId(), before, after, r.reason());
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Setting changed: " + key));
        return after;
    }

    @Transactional(readOnly = true)
    public List<ClubSettingResponse> listSettings() {
        return settings.findAll().stream()
                .sorted(Comparator.comparing(ClubSetting::getSettingKey))
                .map(mapper::toResponse).toList();
    }

    // ------------------------------------------------------------------ opening hours (BKG-02/03)

    @Transactional(readOnly = true)
    public List<OpeningHoursResponse> getOpeningHours() {
        return openingHours.findAll().stream()
                .sorted(Comparator.comparingInt(ClubOpeningHours::getWeekday))
                .map(mapper::toResponse).toList();
    }

    @Transactional
    public List<OpeningHoursResponse> updateOpeningHours(List<OpeningHoursRequest> req) {
        if (req == null || req.isEmpty()) throw bad("At least one weekday must be supplied");

        Map<Short, ClubOpeningHours> existing = openingHours.findAll().stream()
                .collect(Collectors.toMap(ClubOpeningHours::getWeekday, Function.identity()));
        List<OpeningHoursResponse> before = existing.values().stream()
                .sorted(Comparator.comparingInt(ClubOpeningHours::getWeekday))
                .map(mapper::toResponse).toList();

        Set<Short> seen = new HashSet<>();
        List<ClubOpeningHours> toSave = new ArrayList<>();
        for (OpeningHoursRequest r : req) {
            if (r.weekday() == null || r.weekday() < 1 || r.weekday() > 7) {
                throw bad("weekday must be 1 (Monday) .. 7 (Sunday)");
            }
            if (!seen.add(r.weekday())) throw bad("Duplicate weekday: " + r.weekday());
            boolean closed = Boolean.TRUE.equals(r.closed());
            validateTimes(closed, r.openTime(), r.closeTime(), "Weekday " + r.weekday());

            ClubOpeningHours e = existing.getOrDefault(r.weekday(), new ClubOpeningHours());
            e.setWeekday(r.weekday());
            e.setClosed(closed);
            if (!closed) {
                e.setOpenTime(r.openTime());
                e.setCloseTime(r.closeTime());
            } else {
                if (e.getOpenTime() == null) e.setOpenTime(LocalTime.of(6, 0));
                if (e.getCloseTime() == null) e.setCloseTime(LocalTime.of(22, 0));
            }
            toSave.add(e);
        }
        openingHours.saveAll(toSave);

        List<OpeningHoursResponse> after = getOpeningHours();
        audit.record("OPENING_HOURS_UPDATED", "CLUB_OPENING_HOURS", null, before, after);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Opening hours updated"));
        return after;
    }

    // ------------------------------------------------------------------ tax rates (FIN-07, CFG-03)

    @Transactional
    public TaxRateResponse createTaxRate(TaxRateRequest r) {
        validateTax(r, null);
        TaxRate t = new TaxRate();
        applyTax(t, r);
        taxRates.save(t);
        TaxRateResponse after = mapper.toResponse(t);
        audit.record("TAX_RATE_CREATED", "TAX_RATE", t.getId(), null, after);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Tax rate created"));
        return after;
    }

    /** Full replace (PUT semantics) - effectiveTo = null now really clears the end date. */
    @Transactional
    public TaxRateResponse updateTaxRate(UUID id, TaxRateRequest r) {
        TaxRate t = taxRates.findById(id)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Tax rate not found: " + id));
        validateTax(r, id);
        TaxRateResponse before = mapper.toResponse(t);
        applyTax(t, r);
        taxRates.save(t);
        TaxRateResponse after = mapper.toResponse(t);
        audit.record("TAX_RATE_UPDATED", "TAX_RATE", id, before, after);
        eventPublisher.publish(new ClubConfigChanged(Events.nextId(), Events.now(clock), "Tax rate updated"));
        return after;
    }

    @Transactional(readOnly = true)
    public List<TaxRateResponse> listTaxRates(LocalDate activeOn) {
        List<TaxRate> list = activeOn != null
                ? taxRates.findEffectiveOn(activeOn)
                : taxRates.findAllByOrderByNameAscEffectiveFromDesc();
        return list.stream().map(mapper::toResponse).toList();
    }

    private void applyTax(TaxRate t, TaxRateRequest r) {
        t.setName(r.name().trim());
        t.setItemType(r.itemType());
        t.setHsnCode(blankToNull(r.hsnCode()));
        t.setRate(r.rate());
        t.setTaxInclusive(Boolean.TRUE.equals(r.taxInclusive()));
        t.setEffectiveFrom(r.effectiveFrom());
        t.setEffectiveTo(r.effectiveTo());
        t.setActive(r.isActive() == null || r.isActive());
    }

    private void validateTax(TaxRateRequest r, UUID selfId) {
        if (r.effectiveTo() != null && r.effectiveTo().isBefore(r.effectiveFrom())) {
            throw bad("effectiveTo cannot be before effectiveFrom");
        }
        List<TaxRate> sameName = taxRates.findByNameIgnoreCase(r.name().trim()).stream()
                .filter(t -> !t.getId().equals(selfId)).toList();

        if (sameName.stream().anyMatch(t -> t.getEffectiveFrom().equals(r.effectiveFrom()))) {
            throw new DomainException(ErrorCode.CONFLICT,
                    "A '" + r.name().trim() + "' rate already starts on " + r.effectiveFrom());
        }
        if (r.isActive() == null || r.isActive()) {
            LocalDate nf = r.effectiveFrom();
            LocalDate nt = orMax(r.effectiveTo());
            boolean overlap = sameName.stream().filter(TaxRate::isActive)
                    .anyMatch(t -> !nf.isAfter(orMax(t.getEffectiveTo())) && !t.getEffectiveFrom().isAfter(nt));
            if (overlap) {
                throw new DomainException(ErrorCode.CONFLICT,
                        "Active '" + r.name().trim() + "' rate overlaps an existing period; end the old rate first");
            }
        }
    }

    // ------------------------------------------------------------------ helpers

    /** BR-02: bookings start on 30-min boundaries and a session is 60 min, so hours must allow that. */
    private void validateTimes(boolean closed, LocalTime open, LocalTime close, String label) {
        if (closed) return;
        if (open == null || close == null) throw bad(label + ": open and close times are required");
        if (open.getMinute() % SLOT_MINUTES != 0 || close.getMinute() % SLOT_MINUTES != 0
                || open.getSecond() != 0 || close.getSecond() != 0) {
            throw bad(label + ": times must fall on 30-minute boundaries");
        }
        if (!close.isAfter(open)) throw bad(label + ": close time must be after open time");
        if (Duration.between(open, close).toMinutes() < MIN_SESSION_MINUTES) {
            throw bad(label + ": must be open at least " + MIN_SESSION_MINUTES + " minutes");
        }
    }

    private static LocalDate orMax(LocalDate d) {
        return d == null ? LocalDate.MAX : d;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static DomainException bad(String msg) {
        return new DomainException(ErrorCode.VALIDATION_ERROR, msg);
    }
}