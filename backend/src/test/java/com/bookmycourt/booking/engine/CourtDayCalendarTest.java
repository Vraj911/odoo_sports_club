package com.bookmycourt.booking.engine;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CourtDayCalendarTest {

    @Test
    @DisplayName("Should maintain four independent masks and compute combined occupied mask correctly")
    void fourMasksIsolation() {
        CourtDayCalendar cal = new CourtDayCalendar();
        assertThat(cal.occupied()).isZero();
        assertThat(cal.isFree(SlotMask.session(20))).isTrue();

        // 1. Occupy booked at slot 10
        long mask10 = SlotMask.session(10);
        cal.occupyBooked(mask10);
        assertThat(cal.bookedMask()).isEqualTo(mask10);
        assertThat(cal.isFree(mask10)).isFalse();
        assertThat(cal.occupied()).isEqualTo(mask10);

        // 2. Occupy held at slot 14
        long mask14 = SlotMask.session(14);
        cal.occupyHeld(mask14);
        assertThat(cal.heldMask()).isEqualTo(mask14);
        assertThat(cal.isFree(mask14)).isFalse();
        assertThat(cal.occupied()).isEqualTo(mask10 | mask14);

        // 3. Occupy social at slot 18
        long mask18 = SlotMask.session(18);
        cal.occupySocial(mask18);
        assertThat(cal.socialMask()).isEqualTo(mask18);
        assertThat(cal.isFree(mask18)).isFalse();

        // 4. Occupy blocked at slot 22
        long mask22 = SlotMask.session(22);
        cal.occupyBlocked(mask22);
        assertThat(cal.blockedMask()).isEqualTo(mask22);
        assertThat(cal.isFree(mask22)).isFalse();

        assertThat(cal.occupied()).isEqualTo(mask10 | mask14 | mask18 | mask22);

        // 5. Release held converts to booked on confirmation
        cal.occupyBooked(mask14);
        assertThat(cal.heldMask()).isZero();
        assertThat(cal.bookedMask()).isEqualTo(mask10 | mask14);

        // 6. Release all for a slot
        cal.release(mask10);
        assertThat(cal.isFree(mask10)).isTrue();
    }

    @Test
    @DisplayName("Should correctly calculate startable slots given openStarts window")
    void startableSlots() {
        CourtDayCalendar cal = new CourtDayCalendar();
        long openStarts = SlotMask.openStarts(12, 44); // 06:00 to 22:00

        // Entire day is free, startable matches openStarts
        assertThat(cal.startable(openStarts)).isEqualTo(openStarts);

        // Book slot 14 (14 & 15). Slot 13 cannot start (needs 13 & 14), slot 14 cannot start (needs 14 & 15)
        cal.occupyBooked(SlotMask.session(14));
        long startable = cal.startable(openStarts);
        assertThat(startable & (1L << 13)).isZero();
        assertThat(startable & (1L << 14)).isZero();
        assertThat(startable & (1L << 12)).isNotZero(); // 12 & 13 free
        assertThat(startable & (1L << 16)).isNotZero(); // 16 & 17 free
    }
}
