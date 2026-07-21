package com.fpt.seal.hms.teammember;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.dto.TeamMemberRequest;
import com.fpt.seal.hms.teammember.dto.TeamMemberResponse;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TeamMemberServiceTest {

    @Mock private TeamMemberRepository teamMemberRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private AccountService accountService;
    @InjectMocks private TeamMemberService service;

    private Event openEvent() {
        Event e = new Event();
        e.setId(1L);
        e.setRegistrationStartDate(LocalDate.now().minusDays(2));
        e.setRegistrationEndDate(LocalDate.now().plusDays(2));
        return e;
    }

    private Team team(TeamStatus status) {
        Team t = new Team();
        t.setId(2L);
        t.setStatus(status);
        t.setEvent(openEvent());
        return t;
    }

    private Account account(long id) {
        Account a = new Account();
        a.setId(id);
        a.setEmail("u" + id + "@fpt.edu.vn");
        return a;
    }

    private TeamMemberRequest request(long accountId) {
        TeamMemberRequest r = new TeamMemberRequest();
        r.setAccountId(accountId);
        return r;
    }

    // ---------- invite ----------

    @Test
    void inviteMember_persistsInvitedMember() {
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team(TeamStatus.CREATED)));
        when(teamMemberRepository.countByTeamIdAndStatusNot(2L, MemberStatus.DECLINED)).thenReturn(2L);
        when(accountRepository.findById(20L)).thenReturn(Optional.of(account(20L)));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 20L)).thenReturn(Optional.empty());
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(20L, 1L, MemberStatus.DECLINED)).thenReturn(List.of());
        when(accountService.getFullName(any())).thenReturn("New Member");
        when(teamMemberRepository.save(any(TeamMember.class))).thenAnswer(inv -> {
            TeamMember m = inv.getArgument(0);
            m.setId(99L);
            return m;
        });

        TeamMemberResponse res = service.inviteMember(2L, request(20L));

        assertThat(res.getStatus()).isEqualTo(MemberStatus.INVITED);
        assertThat(res.getRole()).isEqualTo(MemberRole.MEMBER);
    }

    @Test
    void inviteMember_rejectedWhenTeamNotCreated() {
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team(TeamStatus.REGISTERED)));

        assertThatThrownBy(() -> service.inviteMember(2L, request(20L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    void inviteMember_rejectedWhenRegistrationClosed() {
        Team t = team(TeamStatus.CREATED);
        t.getEvent().setRegistrationEndDate(LocalDate.now().minusDays(1)); // closed
        when(teamRepository.findById(2L)).thenReturn(Optional.of(t));

        assertThatThrownBy(() -> service.inviteMember(2L, request(20L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("closed");
    }

    @Test
    void inviteMember_rejectedWhenFiveMembersReached() {
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team(TeamStatus.CREATED)));
        when(teamMemberRepository.countByTeamIdAndStatusNot(2L, MemberStatus.DECLINED)).thenReturn(5L);

        assertThatThrownBy(() -> service.inviteMember(2L, request(20L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("maximum limit of 5");
    }

    @Test
    void inviteMember_rejectedWhenAlreadyInTeam() {
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team(TeamStatus.CREATED)));
        when(teamMemberRepository.countByTeamIdAndStatusNot(2L, MemberStatus.DECLINED)).thenReturn(1L);
        when(accountRepository.findById(20L)).thenReturn(Optional.of(account(20L)));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 20L)).thenReturn(Optional.of(new TeamMember()));

        assertThatThrownBy(() -> service.inviteMember(2L, request(20L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already in the team");
    }

    @Test
    void inviteMember_rejectedWhenInAnotherTeamOfSameEvent() {
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team(TeamStatus.CREATED)));
        when(teamMemberRepository.countByTeamIdAndStatusNot(2L, MemberStatus.DECLINED)).thenReturn(1L);
        when(accountRepository.findById(20L)).thenReturn(Optional.of(account(20L)));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 20L)).thenReturn(Optional.empty());
        when(teamMemberRepository.findByAccountIdAndTeam_EventIdAndStatusNot(20L, 1L, MemberStatus.DECLINED))
                .thenReturn(List.of(new TeamMember()));

        assertThatThrownBy(() -> service.inviteMember(2L, request(20L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("another team");
    }

    // ---------- accept ----------

    @Test
    void acceptInvitation_flipsStatusToAccepted() {
        TeamMember m = new TeamMember();
        m.setId(99L);
        m.setStatus(MemberStatus.INVITED);
        m.setRole(MemberRole.MEMBER);
        m.setTeam(team(TeamStatus.CREATED));
        m.setAccount(account(20L));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 20L)).thenReturn(Optional.of(m));
        when(accountService.getFullName(any())).thenReturn("Member");
        when(teamMemberRepository.save(any(TeamMember.class))).thenAnswer(inv -> inv.getArgument(0));

        TeamMemberResponse res = service.acceptInvitation(2L, 20L);

        assertThat(res.getStatus()).isEqualTo(MemberStatus.ACCEPTED);
    }

    @Test
    void acceptInvitation_rejectedWhenNotInvited() {
        TeamMember m = new TeamMember();
        m.setStatus(MemberStatus.ACCEPTED);
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 20L)).thenReturn(Optional.of(m));

        assertThatThrownBy(() -> service.acceptInvitation(2L, 20L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot accept");
    }

    @Test
    void acceptInvitation_throwsWhenNoInvitation() {
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 20L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.acceptInvitation(2L, 20L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
