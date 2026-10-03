package com.bookmycourt.membership.service;

import com.bookmycourt.common.exception.AuthFailedException;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.dto.LoginRequest;
import com.bookmycourt.membership.dto.MemberResponse;
import com.bookmycourt.membership.dto.PlanResponse;
import com.bookmycourt.membership.dto.RegisterRequest;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.entity.Membership;
import com.bookmycourt.membership.entity.Plan;
import com.bookmycourt.membership.mapper.MemberMapper;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.membership.repository.MembershipRepository;
import com.bookmycourt.membership.repository.PlanRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class MembershipService {

    private final AppUserRepository users;
    private final MemberRepository members;
    private final MembershipRepository memberships;
    private final PlanRepository plans;
    private final MemberMapper mapper;
    private final PasswordEncoder passwords;

    public MembershipService(
            AppUserRepository users,
            MemberRepository members,
            MembershipRepository memberships,
            PlanRepository plans,
            MemberMapper mapper,
            PasswordEncoder passwords) {
        this.users = users;
        this.members = members;
        this.memberships = memberships;
        this.plans = plans;
        this.mapper = mapper;
        this.passwords = passwords;
    }

    @Transactional
    public MemberResponse register(RegisterRequest request) {
        if ((request.email() == null || request.email().isBlank())
                && (request.phone() == null || request.phone().isBlank())) {
            throw new AuthFailedException("Email or phone is required");
        }
        if (request.email() != null && !request.email().isBlank()
                && users.findByEmailIgnoreCase(request.email()).isPresent()) {
            throw new AuthFailedException("Email already registered");
        }
        AppUser user = new AppUser();
        user.setEmail(blankToNull(request.email()));
        user.setPhone(blankToNull(request.phone()));
        user.setPasswordHash(passwords.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setRole("MEMBER");
        users.save(user);

        Member member = new Member();
        member.setUser(user);
        member.setMemberCode(nextMemberCode());
        member.setFirstName(request.firstName());
        member.setLastName(request.lastName());
        member.setEmail(blankToNull(request.email()));
        member.setPhone(blankToNull(request.phone()));
        member.setDateOfBirth(request.dateOfBirth());
        member.setGuardianName(request.guardianName());
        member.setGuardianPhone(request.guardianPhone());
        member.setGuardianEmail(request.guardianEmail());
        members.save(member);
        return mapper.toResponse(member, null, user.getRole());
    }

    @Transactional
    public MemberResponse login(LoginRequest request) {
        AppUser user = users.findByEmailIgnoreCase(request.login())
                .or(() -> users.findByPhone(request.login()))
                .orElseThrow(() -> new AuthFailedException("Invalid credentials"));
        if (!user.isActive() || !passwords.matches(request.password(), user.getPasswordHash())) {
            throw new AuthFailedException("Invalid credentials");
        }
        user.setLastLoginAt(Instant.now());
        Member member = members.findByUser_Id(user.getId())
                .orElseThrow(() -> new NotFoundException("Member profile not found"));
        Membership current = memberships.findCurrent(member.getId(), LocalDate.now()).orElse(null);
        return mapper.toResponse(member, current, user.getRole());
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers() {
        return members.findAll().stream().map(member -> {
            String role = member.getUser() == null ? "MEMBER" : member.getUser().getRole();
            Membership current = memberships.findCurrent(member.getId(), LocalDate.now()).orElse(null);
            return mapper.toResponse(member, current, role);
        }).toList();
    }

    @Transactional(readOnly = true)
    public MemberResponse getMember(UUID id) {
        Member member = members.findById(id).orElseThrow(() -> new NotFoundException("Member not found"));
        String role = member.getUser() == null ? "MEMBER" : member.getUser().getRole();
        Membership current = memberships.findCurrent(member.getId(), LocalDate.now()).orElse(null);
        return mapper.toResponse(member, current, role);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> listPlans() {
        return plans.findByActiveTrue().stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public com.bookmycourt.membership.dto.MembershipResponse subscribe(com.bookmycourt.membership.dto.CreateMembershipRequest request) {
        Member member = members.findById(request.memberId())
                .orElseThrow(() -> new NotFoundException("Member not found"));
        Plan plan = plans.findById(request.planId())
                .orElseThrow(() -> new NotFoundException("Plan not found"));

        Membership membership = new Membership();
        membership.setMember(member);
        membership.setPlan(plan);
        LocalDate start = LocalDate.now();
        membership.setStartDate(start);
        membership.setEndDate(start.plusDays(plan.getValidityDays()));
        membership.setStatus("ACTIVE");
        membership.setPricePaid(request.pricePaid() != null ? request.pricePaid() : java.math.BigDecimal.ZERO);
        memberships.save(membership);
        return mapper.toResponse(membership);
    }

    @Transactional
    public com.bookmycourt.membership.dto.MembershipResponse renew(UUID membershipId) {
        Membership old = memberships.findById(membershipId)
                .orElseThrow(() -> new NotFoundException("Membership not found"));
        LocalDate start = old.getEndDate().isBefore(LocalDate.now()) ? LocalDate.now() : old.getEndDate().plusDays(1);
        Membership renewal = new Membership();
        renewal.setMember(old.getMember());
        renewal.setPlan(old.getPlan());
        renewal.setPreviousMembershipId(old.getId());
        renewal.setStartDate(start);
        renewal.setEndDate(start.plusDays(old.getPlan().getValidityDays()));
        renewal.setStatus("ACTIVE");
        renewal.setPricePaid(old.getPricePaid());
        memberships.save(renewal);
        return mapper.toResponse(renewal);
    }

    @Transactional
    public com.bookmycourt.membership.dto.MembershipResponse updateStatus(UUID membershipId, com.bookmycourt.membership.dto.MembershipStatusRequest request) {
        Membership membership = memberships.findById(membershipId)
                .orElseThrow(() -> new NotFoundException("Membership not found"));
        membership.setStatus(request.status());
        if ("SUSPENDED".equalsIgnoreCase(request.status())) {
            membership.setSuspensionReason(request.reason() != null && !request.reason().isBlank() ? request.reason() : "Administrative suspension");
        } else if ("CANCELLED".equalsIgnoreCase(request.status())) {
            membership.setCancellationReason(request.reason() != null && !request.reason().isBlank() ? request.reason() : "Member cancellation");
        }
        memberships.save(membership);
        return mapper.toResponse(membership);
    }

    @Transactional(readOnly = true)
    public List<com.bookmycourt.membership.dto.MembershipResponse> getMembershipsForMember(UUID memberId) {
        return memberships.findByMember_IdOrderByStartDateDesc(memberId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public com.bookmycourt.membership.dto.MembershipResponse getMembership(UUID id) {
        Membership membership = memberships.findById(id)
                .orElseThrow(() -> new NotFoundException("Membership not found"));
        return mapper.toResponse(membership);
    }

    @Transactional
    public MemberResponse updateMember(UUID id, com.bookmycourt.membership.dto.UpdateMemberRequest request) {
        Member member = members.findById(id).orElseThrow(() -> new NotFoundException("Member not found"));
        if (request.firstName() != null && !request.firstName().isBlank()) member.setFirstName(request.firstName());
        if (request.lastName() != null && !request.lastName().isBlank()) member.setLastName(request.lastName());
        if (request.email() != null) member.setEmail(blankToNull(request.email()));
        if (request.phone() != null) member.setPhone(blankToNull(request.phone()));
        if (request.address() != null) member.setAddress(blankToNull(request.address()));
        if (request.dateOfBirth() != null) member.setDateOfBirth(request.dateOfBirth());
        if (request.guardianName() != null) member.setGuardianName(blankToNull(request.guardianName()));
        if (request.guardianPhone() != null) member.setGuardianPhone(blankToNull(request.guardianPhone()));
        if (request.guardianEmail() != null) member.setGuardianEmail(blankToNull(request.guardianEmail()));
        members.save(member);

        String role = member.getUser() == null ? "MEMBER" : member.getUser().getRole();
        Membership current = memberships.findCurrent(member.getId(), LocalDate.now()).orElse(null);
        return mapper.toResponse(member, current, role);
    }

    private String nextMemberCode() {
        long n = members.count() + 1;
        return "BMC-" + String.format("%04d", n);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
