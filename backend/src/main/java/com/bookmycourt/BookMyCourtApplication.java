package com.bookmycourt;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import com.bookmycourt.booking.config.BookingProperties;

@SpringBootApplication
@EnableConfigurationProperties(BookingProperties.class)
public class BookMyCourtApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookMyCourtApplication.class, args);
    }
}
