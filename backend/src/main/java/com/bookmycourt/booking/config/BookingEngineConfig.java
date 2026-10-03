package com.bookmycourt.booking.config;
import com.bookmycourt.booking.engine.BookingEngine;
import com.bookmycourt.booking.engine.BookingStore;
import com.bookmycourt.booking.engine.Model.ClubConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
@Configuration
@EnableScheduling
public class BookingEngineConfig {
    @Bean
    public ClubConfig clubConfig(BookingProperties properties) {
        return new ClubConfig(
                properties.getOpenSlot(),
                properties.getCloseSlot(),
                properties.getDailyCap(),
                properties.getHoldMinutes()
        );
    }
    @Bean
    public BookingEngine bookingEngine(BookingStore store, ClubConfig clubConfig) {
        return new BookingEngine(store, clubConfig);
    }
}
