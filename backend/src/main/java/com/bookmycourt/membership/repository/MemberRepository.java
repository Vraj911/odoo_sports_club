package com.bookmycourt.membership.repository;

import com.bookmycourt.membership.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID> {
    Optional<Member> findByMemberCode(String memberCode);
    Optional<Member> findByUser_Id(UUID userId);
    long countByMemberCodeStartingWith(String prefix);
}
