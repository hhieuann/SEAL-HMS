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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/** Branch coverage for upsertSubmission's subsequent-round eligibility gate and the
 *  ADMIN bypass / one-null-timing branches. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubmissionServiceBranchTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private ScoreRepository scoreRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @InjectMocks private SubmissionService submissionService;

    private static final String LEADER = "leader@fpt.edu.vn";

    private Round round(long id, int seq, long eventId) {
        Round r = new Round();
        r.setId(id);
        r.setStatus(RoundStatus.ACTIVE);
        r.setStartTime(LocalDateTime.now().minusHours(1));
        r.setDurationHours(24.0);
        r.setRoundSeq(seq);
        com.fpt.seal.hms.event.entity.Event e = new com.fpt.seal.hms.event.entity.Event();
        e.setId(eventId);
        r.setEvent(e);
        return r;
    }

    private void stubLeaderAndTeam(long teamId) {
        Team team = new Team();
        team.setId(teamId);
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        Account leader = new Account();
        leader.setId(10L);
        leader.setEmail(LEADER);
        leader.setRole(Role.STUDENT);
        when(accountRepository.findByEmail(LEADER)).thenReturn(Optional.of(leader));
        TeamMember tm = new TeamMember();
        tm.setRole(MemberRole.LEADER);
        tm.setStatus(MemberStatus.ACCEPTED);
        when(teamMemberRepository.findByTeamIdAndAccountId(teamId, 10L)).thenReturn(Optional.of(tm));
    }

    private void stubRankingAndSave(long roundId, long teamId) {
        Team team = new Team();
        team.setId(teamId);
        RoundRanking rr = new RoundRanking();
        rr.setId(99L);
        rr.setTeam(team); // mapToResponse reads roundRanking.getTeam().getId()
        when(roundRankingRepository.findByRoundIdAndTeamId(roundId, teamId)).thenReturn(Optional.of(rr));
        when(submissionRepository.findByRoundRankingId(99L)).thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private SubmissionRequest req() {
        SubmissionRequest r = new SubmissionRequest();
        r.setSubmissionName("Project");
        return r;
    }

    // ---------- subsequent-round eligibility ----------

    @Test
    void round2_allowed_whenPromotedFromPreviousRound() {
        Round r2 = round(2L, 2, 1L);
        Round r1 = round(1L, 1, 1L);
        when(roundRepository.findById(2L)).thenReturn(Optional.of(r2));
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(r1, r2)));
        RoundRanking prev = new RoundRanking();
        prev.setIsPromoted(true);
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 5L)).thenReturn(Optional.of(prev));
        stubLeaderAndTeam(5L);
        stubRankingAndSave(2L, 5L);

        SubmissionResponse res = submissionService.upsertSubmission(2L, 5L, req(), LEADER);

        assertThat(res).isNotNull();
    }

    @Test
    void round2_blocked_whenNotPromoted() {
        Round r2 = round(2L, 2, 1L);
        Round r1 = round(1L, 1, 1L);
        when(roundRepository.findById(2L)).thenReturn(Optional.of(r2));
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(r1, r2)));
        RoundRanking prev = new RoundRanking();
        prev.setIsPromoted(false);
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 5L)).thenReturn(Optional.of(prev));

        assertThatThrownBy(() -> submissionService.upsertSubmission(2L, 5L, req(), LEADER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not promoted");
    }

    @Test
    void round2_blocked_whenTeamDidNotParticipate() {
        Round r2 = round(2L, 2, 1L);
        Round r1 = round(1L, 1, 1L);
        when(roundRepository.findById(2L)).thenReturn(Optional.of(r2));
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(r1, r2)));
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> submissionService.upsertSubmission(2L, 5L, req(), LEADER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("did not participate");
    }

    @Test
    void round2_noPreviousRounds_skipsEligibilityGate() {
        // roundSeq 2 but the event has no lower-seq rounds -> previousRounds empty
        Round r2 = round(2L, 2, 1L);
        when(roundRepository.findById(2L)).thenReturn(Optional.of(r2));
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(r2)));
        stubLeaderAndTeam(5L);
        stubRankingAndSave(2L, 5L);

        assertThat(submissionService.upsertSubmission(2L, 5L, req(), LEADER)).isNotNull();
    }

    // ---------- ADMIN bypass with existing submission ----------

    @Test
    void admin_updatesExistingSubmission_bypassingMembership() {
        Round r1 = round(1L, 1, 1L);
        when(roundRepository.findById(1L)).thenReturn(Optional.of(r1));
        Team team = new Team();
        team.setId(5L);
        when(teamRepository.findById(5L)).thenReturn(Optional.of(team));
        Account admin = new Account();
        admin.setId(1L);
        admin.setEmail("admin@seal-hms.local");
        admin.setRole(Role.ADMIN);
        when(accountRepository.findByEmail("admin@seal-hms.local")).thenReturn(Optional.of(admin));
        RoundRanking rr = new RoundRanking();
        rr.setId(99L);
        rr.setTeam(team);
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 5L)).thenReturn(Optional.of(rr));
        Submission existing = new Submission();
        existing.setId(7L);
        existing.setRoundRanking(rr);
        existing.setStatus(com.fpt.seal.hms.common.enums.SubmissionStatus.DRAFT);
        when(submissionRepository.findByRoundRankingId(99L)).thenReturn(Optional.of(existing));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> inv.getArgument(0));

        SubmissionResponse res = submissionService.upsertSubmission(1L, 5L, req(), "admin@seal-hms.local");

        assertThat(res.getId()).isEqualTo(7L);
        verify(teamMemberRepository, never()).findByTeamIdAndAccountId(anyLong(), anyLong());
    }

    // ---------- one-null timing branch ----------

    @Test
    void rejected_whenOnlyDurationNull() {
        Round r = round(1L, 1, 1L);
        r.setDurationHours(null); // startTime set, duration null -> || right side
        when(roundRepository.findById(1L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 5L, req(), LEADER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not configured");
    }
}
