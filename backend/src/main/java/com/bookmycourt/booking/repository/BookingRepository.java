package com.bookmycourt.booking.repository;

import com.bookmycourt.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    @Query("""
            SELECT b FROM Booking b
            WHERE b.court.id = :courtId
              AND b.startTime < :to
              AND b.endTime > :from
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
              AND b.bookingDay = :day
              AND b.status IN :statuses
            """)
    int countActiveForMemberDay(
            @Param("memberId") UUID memberId,
            @Param("day") LocalDate day,
            @Param("statuses") Collection<String> statuses);

    @Query("""
            SELECT DISTINCT b FROM Booking b
            JOIN FETCH b.court
            LEFT JOIN FETCH b.member
            WHERE b.id = :id
            """)
    Optional<Booking> findDetailedById(@Param("id") UUID id);

    @Query("""
            SELECT DISTINCT b FROM Booking b
            JOIN FETCH b.court
            LEFT JOIN FETCH b.member
            WHERE b.member.id = :memberId
            ORDER BY b.startTime DESC
            """)
    List<Booking> findDetailedByMember(@Param("memberId") UUID memberId);

    List<Booking> findByExpiresAtLessThanEqualAndStatus(OffsetDateTime now, String status);

    List<Booking> findByCourt_IdAndStatusAndExpiresAtBefore(UUID courtId, String status, OffsetDateTime before);

    List<Booking> findByStatusAndExpiresAtBefore(String status, OffsetDateTime before);

    List<Booking> findByStatusAndEndTimeBefore(String status, OffsetDateTime before);

    List<Booking> findByMember_IdAndStatusInAndPaymentStatusIn(
            UUID memberId,
            Collection<String> statuses,
            Collection<String> paymentStatuses);

    List<Booking> findByCourt_Id(UUID courtId);

    List<Booking> findByMember_Id(UUID memberId);

    List<Booking> findByStatus(String status);

    List<Booking> findByStartTimeBetween(OffsetDateTime from, OffsetDateTime to);

    List<Booking> findByCourt_IdAndStartTimeBetween(UUID courtId, OffsetDateTime from, OffsetDateTime to);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = 'CANCELLED',
                   b.cancelReason = :reason,
                   b.cancelledAt = :now,
                   b.notes = COALESCE(:reason, b.notes)
             WHERE b.id = :id
               AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
            """)
    int markCancelled(@Param("id") UUID id, @Param("reason") String reason, @Param("now") OffsetDateTime now);

    default int markCancelled(UUID id, String reason) {
        return markCancelled(id, reason, OffsetDateTime.now());
    }

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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = 'NO_SHOW'
             WHERE b.id = :id
               AND b.status = 'CONFIRMED'
            """)
    int markNoShow(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Booking b
               SET b.status = 'COMPLETED'
             WHERE b.id = :id
               AND b.status = 'CHECKED_IN'
            """)
    int markCompleted(@Param("id") UUID id);
}
