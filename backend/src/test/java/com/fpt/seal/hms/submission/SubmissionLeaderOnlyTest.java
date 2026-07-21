package com.fpt.seal.hms.submission;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.round.RoundRepository;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.submission.dto.SubmissionRequest;
import com.fpt.seal.hms.submission.dto.SubmissionResponse;
import com.fpt.seal.hms.submission.entity.Submission;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.teammember.TeamMemberRepository;
import com.fpt.seal.hms.teammember.entity.TeamMember;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/** Review 15/07: only the team LEADER may create/update a submission; members just view. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubmissionLeaderOnlyTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private ScoreRepository scoreRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @InjectMocks private SubmissionService submissionService;

    private static final String LEADER = "leader@fpt.edu.vn";
    private static final String MEMBER = "member@fpt.edu.vn";
    private static final String OUTSIDER = "outsider@fpt.edu.vn";
    private static final String ADMIN = "admin@seal-hms.local";

    private Account account(long id, String email, Role role) {
        Account a = new Account();
        a.setId(id);
        a.setEmail(email);
        a.setRole(role);
        return a;
    }

    private TeamMember membership(MemberRole role, MemberStatus status) {
        TeamMember tm = new TeamMember();
        tm.setRole(role);
        tm.setStatus(status);
        return tm;
    }

    private SubmissionRequest request() {
        SubmissionRequest r = new SubmissionRequest();
        r.setSubmissionName("Demo project");
        return r;
    }

    /** Active round with a deadline still in the future + existing ranking/submission. */
    private void stubActiveRoundAndTeam() {
        Round round = new Round();
        round.setId(1L);
        round.setStatus(RoundStatus.ACTIVE);
        round.setStartTime(LocalDateTime.now().minusHours(1));
        round.setDurationHours(8.0);
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));

        Team team = new Team();
        team.setId(2L);
        team.setName("Team X");
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team));

        RoundRanking rr = new RoundRanking();
        rr.setId(3L);
        rr.setRound(round);
        rr.setTeam(team);
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 2L)).thenReturn(Optional.of(rr));
        when(submissionRepository.findByRoundRankingId(3L)).thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> {
            Submission s = inv.getArgument(0);
            s.setId(9L);
            return s;
        });
    }

    // ---------- happy case ----------

    @Test
    void leader_canSubmit() {
        stubActiveRoundAndTeam();
        Account leader = account(10L, LEADER, Role.STUDENT);
        when(accountRepository.findByEmail(LEADER)).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 10L))
                .thenReturn(Optional.of(membership(MemberRole.LEADER, MemberStatus.ACCEPTED)));

        SubmissionResponse res = submissionService.upsertSubmission(1L, 2L, request(), LEADER);

        assertThat(res.getSubmittedByAccountId()).isEqualTo(10L); // recorded from auth, not body
        verify(submissionRepository).save(any(Submission.class));
    }

    @Test
    void admin_bypassesLeaderCheck() {
        stubActiveRoundAndTeam();
        Account admin = account(1L, ADMIN, Role.ADMIN);
        when(accountRepository.findByEmail(ADMIN)).thenReturn(Optional.of(admin));

        submissionService.upsertSubmission(1L, 2L, request(), ADMIN);

        verify(submissionRepository).save(any(Submission.class));
        verify(teamMemberRepository, never()).findByTeamIdAndAccountId(anyLong(), anyLong());
    }

    // ---------- worst cases ----------

    @Test
    void member_cannotSubmit() {
        stubActiveRoundAndTeam();
        Account member = account(11L, MEMBER, Role.STUDENT);
        when(accountRepository.findByEmail(MEMBER)).thenReturn(Optional.of(member));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 11L))
                .thenReturn(Optional.of(membership(MemberRole.MEMBER, MemberStatus.ACCEPTED)));

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), MEMBER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("leader");
        verify(submissionRepository, never()).save(any());
    }

    @Test
    void outsider_notInTeam_cannotSubmit() {
        stubActiveRoundAndTeam();
        Account outsider = account(12L, OUTSIDER, Role.STUDENT);
        when(accountRepository.findByEmail(OUTSIDER)).thenReturn(Optional.of(outsider));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 12L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), OUTSIDER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not a member");
        verify(submissionRepository, never()).save(any());
    }

    @Test
    void leaderWhoseInviteIsStillPending_cannotSubmit() {
        stubActiveRoundAndTeam();
        Account leader = account(10L, LEADER, Role.STUDENT);
        when(accountRepository.findByEmail(LEADER)).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 10L))
                .thenReturn(Optional.of(membership(MemberRole.LEADER, MemberStatus.INVITED)));

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), LEADER))
                .isInstanceOf(BusinessException.class);
        verify(submissionRepository, never()).save(any());
    }

    @Test
    void bodySubmitterId_isIgnored_authenticatedUserIsRecorded() {
        stubActiveRoundAndTeam();
        Account leader = account(10L, LEADER, Role.STUDENT);
        when(accountRepository.findByEmail(LEADER)).thenReturn(Optional.of(leader));
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 10L))
                .thenReturn(Optional.of(membership(MemberRole.LEADER, MemberStatus.ACCEPTED)));
        SubmissionRequest req = request();
        req.setSubmittedByAccountId(999L); // spoof attempt

        SubmissionResponse res = submissionService.upsertSubmission(1L, 2L, req, LEADER);

        assertThat(res.getSubmittedByAccountId()).isEqualTo(10L); // auth wins over body
    }
}
