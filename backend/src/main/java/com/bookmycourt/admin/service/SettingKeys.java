package com.bookmycourt.admin.service;

import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;

import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/** Known club_setting keys (CFG-02) with their allowed ranges. Unknown keys are allowed but format-checked. */
public final class SettingKeys {

    public static final String SLOT_LENGTH_MINUTES   = "booking.slot_length_minutes";   // default 60
    public static final String SLOT_INTERVAL_MINUTES = "booking.slot_interval_minutes"; // default 30
    public static final String DAILY_CAP             = "booking.daily_cap";             // default 2
    public static final String HOLD_MINUTES          = "booking.hold_minutes";          // default 5
    public static final String CANCEL_FREE_HOURS     = "booking.cancellation_free_hours"; // default 4
    public static final String CANCEL_LATE_FEE_PCT   = "booking.cancellation_late_fee_percent";
    public static final String EXPIRING_SOON_DAYS    = "membership.expiring_soon_days"; // default 15
    public static final String REMINDER_DAYS         = "membership.reminder_days";      // csv, default 30,7,1,0

    private record IntRule(int min, int max) {}

    private static final Map<String, IntRule> INT_RULES = Map.of(
            SLOT_LENGTH_MINUTES, new IntRule(30, 240),
            // The slot bitmask is 48 half-hour cells, so the interval is fixed at 30 for now.
            SLOT_INTERVAL_MINUTES, new IntRule(30, 30),
            DAILY_CAP, new IntRule(1, 10),
            HOLD_MINUTES, new IntRule(1, 60),
            CANCEL_FREE_HOURS, new IntRule(0, 168),
            CANCEL_LATE_FEE_PCT, new IntRule(0, 100),
            EXPIRING_SOON_DAYS, new IntRule(1, 90));

    private static final Pattern KEY = Pattern.compile("^[a-z0-9_.\\-]{1,100}$");
    private static final Pattern CSV_INTS = Pattern.compile("^\\d{1,3}(,\\d{1,3})*$");
    private static final Pattern SENSITIVE = Pattern.compile("(secret|password|passwd|token|api[_.-]?key|private)");

    private SettingKeys() {
    }

    public static void validate(String key, String value) {
        if (key == null || !KEY.matcher(key).matches()) {
            throw bad("Setting key must be 1-100 chars of a-z, 0-9, '_', '.', '-'");
        }
        IntRule rule = INT_RULES.get(key);
        if (rule != null) {
            int v;
            try {
                v = Integer.parseInt(value == null ? "" : value.trim());
            } catch (NumberFormatException e) {
                throw bad(key + " must be a whole number");
            }
            if (v < rule.min() || v > rule.max()) {
                throw bad(key + " must be between " + rule.min() + " and " + rule.max());
            }
            if (SLOT_LENGTH_MINUTES.equals(key) && v % 30 != 0) {
                throw bad(key + " must be a multiple of 30");
            }
        }
        if (REMINDER_DAYS.equals(key) && (value == null || !CSV_INTS.matcher(value.trim()).matches())) {
            throw bad(key + " must be a comma separated list of days, e.g. 30,7,1,0");
        }
    }

    /** Values of sensitive keys are masked in API responses and audit snapshots (NFR-04). */
    public static boolean isSensitive(String key) {
        return key != null && SENSITIVE.matcher(key.toLowerCase(Locale.ROOT)).find();
    }

    private static DomainException bad(String msg) {
        return new DomainException(ErrorCode.VALIDATION_ERROR, msg);
    }
}
