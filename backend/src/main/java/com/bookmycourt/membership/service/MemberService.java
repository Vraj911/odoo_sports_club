package com.bookmycourt.membership.service;

import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.error.DomainException;
import com.bookmycourt.common.error.ErrorCode;
import com.bookmycourt.common.event.DomainEventPublisher;
import com.bookmycourt.common.event.Events;
import com.bookmycourt.common.event.events.MembershipEvents.MemberRegistered;
import com.bookmycourt.common.sequence.NumberSeriesService;
import com.bookmycourt.membership.dto.MemberResponse;
import com.bookmycourt.membership.dto.MemberScanResponse;
import com.bookmycourt.membership.dto.MemberTimelineItem;
import com.bookmycourt.membership.dto.RegisterRequest;
import com.bookmycourt.membership.dto.UpdateMemberRequest;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.mapper.MemberMapper;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class MemberService {

    private final MemberRepository members;
    private final AppUserRepository users;
    private final MembershipRepository memberships;
    private final BookingRepository bookings;
    private final MemberMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final NumberSeriesService numberSeries;
    private final DomainEventPublisher eventPublisher;
    private final Clock clock;

    public MemberService(MemberRepository members,
                         AppUserRepository users,
                         MembershipRepository memberships,
                         BookingRepository bookings,
                         MemberMapper mapper,
                         PasswordEncoder passwordEncoder,
                         NumberSeriesService numberSeries,
                         DomainEventPublisher eventPublisher,
                         Clock clock) {
        this.members = members;
        this.users = users;
        this.memberships = memberships;
        this.bookings = bookings;
        this.mapper = mapper;
        this.passwordEncoder = passwordEncoder;
        this.numberSeries = numberSeries;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    public static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String digits = phone.replaceAll("\\D", "");
        if (digits.startsWith("91") && digits.length() == 12) {
            digits = digits.substring(2);
        } else if (digits.startsWith("0") && digits.length() == 11) {
            digits = digits.substring(1);
        }
        return digits;
    }

    public static String normalizeEmail(String email) {
        return (email == null || email.isBlank()) ? null : email.trim().toLowerCase();
    }

    @Transactional
    public MemberResponse register(RegisterRequest req) {
        String normPhone = normalizePhone(req.phone());
        String normEmail = normalizeEmail(req.email());

        if (normPhone == null && normEmail == null) {
            throw new DomainException(ErrorCode.VALIDATION_FAILED, "Email or phone is required");
        }

        // Validate DOB and guardian requirements
        if (req.dateOfBirth() != null) {
            int age = Period.between(req.dateOfBirth(), LocalDate.now(clock)).getYears();
            if (age < 18) {
                if (req.guardianName() == null || req.guardianName().isBlank() ||
                        req.guardianPhone() == null || req.guardianPhone().isBlank()) {
                    throw new DomainException(ErrorCode.MINOR_GUARDIAN_REQUIRED,
                            "Guardian name and guardian phone are required for minors under 18 years old");
                }
            }
        }

        // Check for duplicates
        if (normEmail != null) {
            Optional<Member> byEmail = members.findAll().stream()
                    .filter(m -> normEmail.equalsIgnoreCase(normalizeEmail(m.getEmail())))
                    .findFirst();
            if (byEmail.isPresent()) {
                throw new DomainException(ErrorCode.DUPLICATE,
                        "Member already exists with email: " + normEmail,
                        Map.of("existingMemberId", byEmail.get().getId()));
            }
        }
        if (normPhone != null) {
            Optional<Member> byPhone = members.findAll().stream()
                    .filter(m -> normPhone.equalsIgnoreCase(normalizePhone(m.getPhone())))
                    .findFirst();
            if (byPhone.isPresent()) {
                throw new DomainException(ErrorCode.DUPLICATE,
                        "Member already exists with phone: " + normPhone,
                        Map.of("existingMemberId", byPhone.get().getId()));
            }
        }

        // Optional app user creation if password is provided
        AppUser user = null;
        if (req.password() != null && !req.password().isBlank()) {
            user = new AppUser();
            user.setEmail(normEmail);
            user.setPhone(normPhone);
            user.setPasswordHash(passwordEncoder.encode(req.password()));
            user.setFirstName(req.firstName());
            user.setLastName(req.lastName());
            user.setRole("MEMBER");
            user.setActive(true);
            users.save(user);
        }

        Member member = new Member();
        member.setUser(user);
        member.setMemberCode(numberSeries.nextMemberCode());
        member.setFirstName(req.firstName());
        member.setLastName(req.lastName());
        member.setEmail(normEmail);
        member.setPhone(normPhone);
        member.setAddress(req.address());
        member.setDateOfBirth(req.dateOfBirth());
        member.setGuardianName(req.guardianName());
        member.setGuardianPhone(normalizePhone(req.guardianPhone()));
        member.setGuardianEmail(normalizeEmail(req.guardianEmail()));
        member.setQrToken(UUID.randomUUID());
        member.setActive(true);
        members.save(member);

        eventPublisher.publish(new MemberRegistered(
                Events.nextId(),
                Events.now(clock),
                member.getId(),
                member.getFirstName() + " " + member.getLastName(),
                member.getPhone(),
                member.getEmail()
        ));

        String role = user != null ? user.getRole() : "MEMBER";
        return mapper.toResponse(member, null, role);
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return members.findAll().stream()
                    .map(m -> mapper.toResponse(m, memberships.findCurrent(m.getId(), LocalDate.now(clock)).orElse(null), "MEMBER"))
                    .toList();
        }
        String q = query.trim().toLowerCase();
        String normPhone = normalizePhone(query);

        return members.findAll().stream()
                .filter(m -> (m.getMemberCode() != null && m.getMemberCode().toLowerCase().contains(q))
                        || (m.getFirstName() != null && m.getFirstName().toLowerCase().contains(q))
                        || (m.getLastName() != null && m.getLastName().toLowerCase().contains(q))
                        || (normPhone != null && m.getPhone() != null && normalizePhone(m.getPhone()).startsWith(normPhone)))
                .limit(20)
                .map(m -> mapper.toResponse(m, memberships.findCurrent(m.getId(), LocalDate.now(clock)).orElse(null), "MEMBER"))
                .toList();
    }

    @Transactional(readOnly = true)
    public MemberScanResponse scan(UUID qrToken) {
        Member member = members.findAll().stream()
                .filter(m -> qrToken.equals(m.getQrToken()))
                .findFirst()
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "No member matches the scanned QR token"));

        LocalDate today = LocalDate.now(clock);
        Optional<Membership> currentMembership = memberships.findCurrent(member.getId(), today);

        String activePlan = currentMembership.map(m -> m.getPlan().getName()).orElse("NONE");
        Integer daysToExpiry = currentMembership.map(m -> (int) ChronoUnit.DAYS.between(today, m.getEndDate())).orElse(null);

        var nextBookingOpt = bookings.findUpcomingForMember(member.getId(), OffsetDateTime.now(clock))
                .stream().findFirst();
        String nextBooking = nextBookingOpt.map(b -> b.getCourt().getName() + " at " + b.getStartTime()).orElse(null);

        return new MemberScanResponse(
                member.getId(),
                member.getMemberCode(),
                member.getFirstName() + " " + member.getLastName(),
                activePlan,
                daysToExpiry,
                BigDecimal.ZERO,
                nextBooking
        );
    }

    @Transactional(readOnly = true)
    public List<MemberTimelineItem> timeline(UUID memberId) {
        Member member = members.findById(memberId)
                .orElseThrow(() -> new DomainException(ErrorCode.NOT_FOUND, "Member not found: " + memberId));

        List<MemberTimelineItem> items = new ArrayList<>();

        // Add memberships
        memberships.findByMember_IdOrderByStartDateDesc(memberId).forEach(m ->
                items.add(new MemberTimelineItem(
                        "MEMBERSHIP",
                        m.getCreatedAt(),
                        "Membership: " + m.getPlan().getName() + " (" + m.getStatus() + ")",
                        m.getPricePaid(),
                        m.getId()
                )));

        // Add bookings
        bookings.findByMemberIdOrderByStartTimeDesc(memberId, Pageable.unpaged()).forEach(b ->
                items.add(new MemberTimelineItem(
                        "BOOKING",
                        b.getCreatedAt(),
                        "Booking: " + b.getCourt().getName() + " (" + b.getStatus() + ")",
                        b.getPrice(),
                        b.getId()
                )));

        items.sort(Comparator.comparing(MemberTimelineItem::at).reversed());
        return items;
    }

    @Transactional(readOnly = true)
    public List<Member> turning18Candidates(LocalDate today) {
        LocalDate startWindow = today.minusYears(18);
        LocalDate endWindow = today.minusYears(18).plusDays(30);

        return members.findAll().stream()
                .filter(m -> m.getDateOfBirth() != null &&
                        !m.getDateOfBirth().isBefore(startWindow) &&
                        !m.getDateOfBirth().isAfter(endWindow))
                .toList();
    }
}
