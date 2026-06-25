package com.fpt.seal.hms.teammember;

import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);
    Optional<TeamMember> findByTeamIdAndAccountId(Long teamId, Long accountId);
    long countByTeamIdAndStatus(Long teamId, MemberStatus status);
    long countByTeamIdAndStatusNot(Long teamId, MemberStatus status); // e.g. count all NOT declined/withdrawn
    List<TeamMember> findByAccountIdAndTeam_EventIdAndStatusNot(Long accountId, Long eventId, MemberStatus status);
}
