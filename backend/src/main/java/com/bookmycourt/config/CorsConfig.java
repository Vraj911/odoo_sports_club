package com.bookmycourt.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * One backend, many frontends. Origins come from CORS_ALLOWED_ORIGINS (comma
 * separated).
 *
 * If you use Spring Security you MUST also enable it in the filter chain:
 * http.cors(org.springframework.security.config.Customizer.withDefaults()); and
 * permit OPTIONS preflight. If you already have a CorsFilter /
 * WebMvcConfigurer.addCorsMappings, delete it or this bean, otherwise you will
 * have two competing configs.
 *
 * Also set the same list on your WebSocket endpoint:
 * registry.addEndpoint("/ws").setAllowedOriginPatterns(origins.toArray(String[]::new));
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:}") String allowedOrigins) {

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOriginPatterns(origins);
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setExposedHeaders(List.of("Authorization", "Location"));
        cfg.setAllowCredentials(true);
        cfg.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
