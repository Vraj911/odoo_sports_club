package com.bookmycourt.booking.service;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
public class OccupancyService {

    private final JdbcClient jdbcClient;

    public OccupancyService(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public record OccupancyItem(
            UUID id,
            UUID courtId,
            UUID bookingId,
            UUID sessionId,
            String occupancyType,
            OffsetDateTime startTime,
            OffsetDateTime endTime,
            String status,
            String reason,
            UUID createdBy
    ) {}

    @Transactional
    public UUID recordBooking(UUID courtId, UUID bookingId, OffsetDateTime start, OffsetDateTime end, UUID createdBy) {
        UUID id = UUID.randomUUID();
        jdbcClient.sql("""
                INSERT INTO occupancy (id, court_id, booking_id, occupancy_type, occupied_period, status, created_by)
                VALUES (:id, :courtId, :bookingId, 'BOOKING', tstzrange(:start, :end, '[)'), 'ACTIVE', :createdBy)
                """)
                .param("id", id)
                .param("courtId", courtId)
                .param("bookingId", bookingId)
                .param("start", start)
                .param("end", end)
                .param("createdBy", createdBy)
                .update();
        return id;
    }

    @Transactional
    public UUID recordSocialSession(UUID courtId, UUID sessionId, OffsetDateTime start, OffsetDateTime end, UUID createdBy) {
        UUID id = UUID.randomUUID();
        jdbcClient.sql("""
                INSERT INTO occupancy (id, court_id, session_id, occupancy_type, occupied_period, status, created_by)
                VALUES (:id, :courtId, :sessionId, 'SOCIAL_SESSION', tstzrange(:start, :end, '[)'), 'ACTIVE', :createdBy)
                """)
                .param("id", id)
                .param("courtId", courtId)
                .param("sessionId", sessionId)
                .param("start", start)
                .param("end", end)
                .param("createdBy", createdBy)
                .update();
        return id;
    }

    @Transactional
    public UUID recordMaintenance(UUID courtId, OffsetDateTime start, OffsetDateTime end, String reason, UUID createdBy) {
        UUID id = UUID.randomUUID();
        jdbcClient.sql("""
                INSERT INTO occupancy (id, court_id, occupancy_type, occupied_period, status, reason, created_by)
                VALUES (:id, :courtId, 'MAINTENANCE', tstzrange(:start, :end, '[)'), 'ACTIVE', :reason, :createdBy)
                """)
                .param("id", id)
                .param("courtId", courtId)
                .param("start", start)
                .param("end", end)
                .param("reason", reason)
                .param("createdBy", createdBy)
                .update();
        return id;
    }

    @Transactional
    public void releaseBooking(UUID bookingId) {
        jdbcClient.sql("""
                UPDATE occupancy SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
                WHERE booking_id = :bookingId AND status = 'ACTIVE'
                """)
                .param("bookingId", bookingId)
                .update();
    }

    @Transactional
    public void releaseSocialSession(UUID sessionId) {
        jdbcClient.sql("""
                UPDATE occupancy SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
                WHERE session_id = :sessionId AND status = 'ACTIVE'
                """)
                .param("sessionId", sessionId)
                .update();
    }

    @Transactional
    public void releaseMaintenance(UUID occupancyId) {
        jdbcClient.sql("""
                UPDATE occupancy SET status = 'RELEASED', updated_at = CURRENT_TIMESTAMP
                WHERE id = :id AND status = 'ACTIVE'
                """)
                .param("id", occupancyId)
                .update();
    }

    @Transactional(readOnly = true)
    public List<OccupancyItem> findActiveBetween(OffsetDateTime from, OffsetDateTime to) {
        return jdbcClient.sql("""
                SELECT id, court_id, booking_id, session_id, occupancy_type,
                       lower(occupied_period) AS start_time, upper(occupied_period) AS end_time,
                       status, reason, created_by
                FROM occupancy
                WHERE status = 'ACTIVE'
                  AND occupied_period && tstzrange(:from, :to, '[)')
                """)
                .param("from", from)
                .param("to", to)
                .query((rs, rowNum) -> new OccupancyItem(
                        rs.getObject("id", UUID.class),
                        rs.getObject("court_id", UUID.class),
                        rs.getObject("booking_id", UUID.class),
                        rs.getObject("session_id", UUID.class),
                        rs.getString("occupancy_type"),
                        rs.getObject("start_time", OffsetDateTime.class),
                        rs.getObject("end_time", OffsetDateTime.class),
                        rs.getString("status"),
                        rs.getString("reason"),
                        rs.getObject("created_by", UUID.class)
                ))
                .list();
    }

    @Transactional(readOnly = true)
    public List<UUID> findActiveBookingIdsOverlapping(UUID courtId, OffsetDateTime start, OffsetDateTime end) {
        return jdbcClient.sql("""
                SELECT booking_id
                FROM occupancy
                WHERE court_id = :courtId
                  AND status = 'ACTIVE'
                  AND occupancy_type = 'BOOKING'
                  AND occupied_period && tstzrange(:start, :end, '[)')
                """)
                .param("courtId", courtId)
                .param("start", start)
                .param("end", end)
                .query((rs, rowNum) -> rs.getObject("booking_id", UUID.class))
                .list();
    }
}
