package com.bookmycourt.shop.service;

import com.bookmycourt.admin.repository.ClubSettingRepository;
import com.bookmycourt.admin.entity.ClubSetting;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Admin-configurable shop values (CFG-02/03), read from club_setting with safe defaults. */
@Component
public class ShopSettings {

    public static final String RESERVATION_MINUTES = "shop.reservation_minutes";   // default 30
    public static final String DELIVERY_FEE = "shop.delivery_fee";                 // default 0

    private final ClubSettingRepository settings;

    public ShopSettings(ClubSettingRepository settings) {
        this.settings = settings;
    }

    public int reservationMinutes() {
        try {
            int v = Integer.parseInt(raw(RESERVATION_MINUTES).trim());
            return v >= 1 && v <= 1440 ? v : 30;
        } catch (RuntimeException e) {
            return 30;
        }
    }

    public BigDecimal deliveryFee() {
        try {
            BigDecimal v = new BigDecimal(raw(DELIVERY_FEE).trim());
            return v.signum() >= 0 ? v.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        } catch (RuntimeException e) {
            return BigDecimal.ZERO;
        }
    }

    private String raw(String key) {
        return settings.findBySettingKey(key).map(ClubSetting::getSettingValue).orElse("");
    }
}
