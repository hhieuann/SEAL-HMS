package com.fpt.seal.hms.teammember;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.dto.TeamMemberRequest;
import com.fpt.seal.hms.teammember.dto.TeamMemberResponse;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamMemberService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final AccountRepository accountRepository;

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getMembersByTeamId(Long teamId) {
        return teamMemberRepository.findByTeamId(teamId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TeamMemberResponse inviteMember(Long teamId, TeamMemberRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        if (team.getStatus() != TeamStatus.CREATED) {
            throw new BusinessException("Cannot invite members. Team is already registered or processed.");
        }

        long activeMembers = teamMemberRepository.countByTeamIdAndStatusNot(teamId, MemberStatus.DECLINED);
        // Assuming WITHDRAWN/DECLINED members don't count towards the 5-member limit.
        if (activeMembers >= 5) {
            throw new BusinessException("Cannot invite more members. The team has reached the maximum limit of 5 members.");
        }

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found to invite"));

        Optional<TeamMember> existingOpt = teamMemberRepository.findByTeamIdAndAccountId(teamId, account.getId());
        if (existingOpt.isPresent()) {
            throw new BusinessException("User is already in the team or has been invited.");
        }

        List<TeamMember> existingInEvent = teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(
                account.getId(), team.getEvent().getId(), MemberStatus.DECLINED);
        if (!existingInEvent.isEmpty()) {
            throw new BusinessException("This user is already a member of another team in this event.");
        }

        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setAccount(account);
        member.setRole(MemberRole.MEMBER);
        member.setStatus(MemberStatus.INVITED);

        return mapToResponse(teamMemberRepository.save(member));
    }

    @Transactional
    public TeamMemberResponse acceptInvitation(Long teamId, Long accountId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndAccountId(teamId, accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation not found for this account in the team"));

        if (member.getStatus() != MemberStatus.INVITED) {
            throw new BusinessException("Cannot accept. Current status is: " + member.getStatus());
        }

        member.setStatus(MemberStatus.ACCEPTED);
        return mapToResponse(teamMemberRepository.save(member));
    }

    private TeamMemberResponse mapToResponse(TeamMember member) {
        TeamMemberResponse response = new TeamMemberResponse();
        response.setId(member.getId());
        response.setTeamId(member.getTeam().getId());
        response.setAccountId(member.getAccount().getId());
        response.setAccountName(member.getAccount().getEmail());
        response.setRole(member.getRole());
        response.setStatus(member.getStatus());
        return response;
    }
}
