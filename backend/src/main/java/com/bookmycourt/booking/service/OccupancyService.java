package com.bookmycourt.booking.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            ) {

    }

    // ---------------------------------------------------------------- locking
    /**
     * Transaction-scoped Postgres advisory lock. Released automatically at
     * commit/rollback. Serialises writers per key even across several JVMs, so
     * the guarantee does not depend on Railway running exactly one replica.
     * MUST be called inside the persist transaction.
     */
    public void lockKey(String key) {
        jdbcClient.sql("SELECT pg_advisory_xact_lock(hashtextextended(:k, 0))")
                .param("k", key)
                .query()
                .listOfRows();
    }

    // ----------------------------------------------------------- free checks
    /**
     * True when no ACTIVE occupancy of this court overlaps [start, end).
     */
    @Transactional(readOnly = true)
    public boolean isRangeFree(UUID courtId, OffsetDateTime start, OffsetDateTime end) {
        Boolean free = jdbcClient.sql("""
                SELECT NOT EXISTS (
                    SELECT 1 FROM occupancy
                    WHERE court_id = :courtId
                      AND status = 'ACTIVE'
                      AND occupied_period && tstzrange(:start, :end, '[)')
                )
                """)
                .param("courtId", courtId)
                .param("start", start)
                .param("end", end)
                .query(Boolean.class)
                .single();
        return Boolean.TRUE.equals(free);
    }

    /**
     * True while the booking still owns an ACTIVE occupancy row.
     */
    @Transactional(readOnly = true)
    public boolean isActiveForBooking(UUID bookingId) {
        Boolean active = jdbcClient.sql("""
                SELECT EXISTS (
                    SELECT 1 FROM occupancy WHERE booking_id = :id AND status = 'ACTIVE'
                )
                """)
                .param("id", bookingId)
                .query(Boolean.class)
                .single();
        return Boolean.TRUE.equals(active);
    }

    /**
     * Active social sessions / maintenance blocks overlapping the range
     * (anything that is not a BOOKING).
     */
    @Transactional(readOnly = true)
    public long countActiveNonBookingOverlapping(UUID courtId, OffsetDateTime start, OffsetDateTime end) {
        Long n = jdbcClient.sql("""
                SELECT COUNT(*) FROM occupancy
                WHERE court_id = :courtId
                  AND status = 'ACTIVE'
                  AND occupancy_type <> 'BOOKING'
                  AND occupied_period && tstzrange(:start, :end, '[)')
                """)
                .param("courtId", courtId)
                .param("start", start)
                .param("end", end)
                .query(Long.class)
                .single();
        return n == null ? 0 : n;
    }

    // ----------------------------------------------------------------- writes
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

    // ------------------------------------------------------------------ reads
    private static final String ITEM_COLUMNS = """
            id, court_id, booking_id, session_id, occupancy_type,
            lower(occupied_period) AS start_time, upper(occupied_period) AS end_time,
            status, reason, created_by
            """;

    private OccupancyItem map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new OccupancyItem(
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
        );
    }

    @Transactional(readOnly = true)
    public List<OccupancyItem> findActiveBetween(OffsetDateTime from, OffsetDateTime to) {
        return jdbcClient.sql("SELECT " + ITEM_COLUMNS + """
                FROM occupancy
                WHERE status = 'ACTIVE'
                  AND occupied_period && tstzrange(:from, :to, '[)')
                """)
                .param("from", from)
                .param("to", to)
                .query((rs, rowNum) -> map(rs))
                .list();
    }

    @Transactional(readOnly = true)
    public Optional<OccupancyItem> findMaintenance(UUID occupancyId) {
        return jdbcClient.sql("SELECT " + ITEM_COLUMNS + """
                FROM occupancy
                WHERE id = :id AND occupancy_type = 'MAINTENANCE' AND status = 'ACTIVE'
                """)
                .param("id", occupancyId)
                .query((rs, rowNum) -> map(rs))
                .optional();
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
