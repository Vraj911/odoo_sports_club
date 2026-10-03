package com.bookmycourt.booking.repository;
import com.bookmycourt.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
public interface BookingRepository extends JpaRepository<Booking, UUID> {
    @Query("""
            SELECT b FROM Booking b
            WHERE b.court.id = :courtId
              AND b.startTime >= :from
              AND b.startTime < :to
              AND b.status IN :statuses
            """)
    List<Booking> findOccupying(
            @Param("courtId") UUID courtId,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("statuses") Collection<String> statuses);
    @Query("""
            SELECT COUNT(b) FROM Booking b
            WHERE b.member.id = :memberId
              AND b.startTime >= :from
              AND b.startTime < :to
              AND b.status IN :statuses
            """)
    int countActiveForMemberDay(
            @Param("memberId") UUID memberId,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            @Param("statuses") Collection<String> statuses);
    @Query("""
            SELECT DISTINCT b FROM Booking b
            JOIN FETCH b.court
            LEFT JOIN FETCH b.member
            WHERE b.id = :id
            """)
    java.util.Optional<Booking> findDetailedById(@Param("id") UUID id);
    @Query("""
            SELECT DISTINCT b FROM Booking b
            JOIN FETCH b.court
            LEFT JOIN FETCH b.member
            WHERE b.member.id = :memberId
            ORDER BY b.startTime DESC
            """)
    List<Booking> findDetailedByMember(@Param("memberId") UUID memberId);
    List<Booking> findByExpiresAtLessThanEqualAndStatus(OffsetDateTime now, String status);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = 'CANCELLED',
                   b.notes = COALESCE(:reason, b.notes)
             WHERE b.id = :id
               AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
            """)
    int markCancelled(@Param("id") UUID id, @Param("reason") String reason);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = 'CONFIRMED',
                   b.expiresAt = NULL,
                   b.paymentStatus = 'PAID'
             WHERE b.id = :id
               AND b.status = 'PENDING'
               AND (b.expiresAt IS NULL OR b.expiresAt > :now)
            """)
    int markConfirmed(@Param("id") UUID id, @Param("now") OffsetDateTime now);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = 'EXPIRED',
                   b.expiresAt = NULL
             WHERE b.id = :id
               AND b.status = 'PENDING'
               AND b.expiresAt IS NOT NULL
               AND b.expiresAt <= :now
            """)
    int markExpired(@Param("id") UUID id, @Param("now") OffsetDateTime now);
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = 'CHECKED_IN'
             WHERE b.id = :id
               AND b.status = 'CONFIRMED'
            """)
    int markCheckedIn(@Param("id") UUID id);
}
