package com.bookmycourt.common.mapping;

import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.facility.entity.Court;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public final class SportMapper {
    private static final DateTimeFormatter HH_MM = DateTimeFormatter.ofPattern("HH:mm");

    private SportMapper() {}

    public static String toApiSport(String dbSport) {
        if (dbSport == null) {
            return null;
        }
        return switch (dbSport.toUpperCase(Locale.ROOT)) {
            case "CRICKET_NET", "CRICKET-NET" -> "cricket-net";
            default -> dbSport.toLowerCase(Locale.ROOT);
        };
    }

    public static String toDbSport(String apiSport) {
        if (apiSport == null || apiSport.isBlank()) {
            return null;
        }
        return switch (apiSport.toLowerCase(Locale.ROOT)) {
            case "cricket-net", "cricket_net" -> "CRICKET_NET";
            default -> apiSport.toUpperCase(Locale.ROOT);
        };
    }

    public static boolean indoor(Court court) {
        return "INDOOR".equalsIgnoreCase(court.getIndoorOutdoor());
    }

    public static String slotToTime(int startSlot) {
        return LocalTime.of(startSlot / 2, (startSlot % 2) * 30).format(HH_MM);
    }

    public static String localTime(java.time.OffsetDateTime instant) {
        return instant.atZoneSameInstant(BookingEngine.IST).toLocalTime().withSecond(0).withNano(0).format(HH_MM);
    }
}
