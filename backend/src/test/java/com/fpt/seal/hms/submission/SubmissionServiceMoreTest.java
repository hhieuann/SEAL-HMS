package com.fpt.seal.hms.submission;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.enums.SubmissionStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
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
import static org.mockito.Mockito.*;

/** Covers deadline/round-state guards, the update path, and reads —
 *  complementing the leader-only authorization tests. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SubmissionServiceMoreTest {

    @Mock private SubmissionRepository submissionRepository;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private RoundRepository roundRepository;
    @Mock private TeamRepository teamRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private ScoreRepository scoreRepository;
    @Mock private TeamMemberRepository teamMemberRepository;
    @InjectMocks private SubmissionService submissionService;

    private static final String LEADER = "leader@fpt.edu.vn";

    private Round round(RoundStatus status, LocalDateTime start, Double hours) {
        Round r = new Round();
        r.setId(1L);
        r.setStatus(status);
        r.setStartTime(start);
        r.setDurationHours(hours);
        return r;
    }

    private SubmissionRequest request() {
        SubmissionRequest r = new SubmissionRequest();
        r.setSubmissionName("Project");
        return r;
    }

    private void stubLeader() {
        Account leader = new Account();
        leader.setId(10L);
        leader.setEmail(LEADER);
        leader.setRole(Role.STUDENT);
        when(accountRepository.findByEmail(LEADER)).thenReturn(Optional.of(leader));
        TeamMember tm = new TeamMember();
        tm.setRole(MemberRole.LEADER);
        tm.setStatus(MemberStatus.ACCEPTED);
        when(teamMemberRepository.findByTeamIdAndAccountId(2L, 10L)).thenReturn(Optional.of(tm));
    }

    // ---------- round-state guards ----------

    @Test
    void upsert_rejected_whenRoundNotActive() {
        when(roundRepository.findById(1L)).thenReturn(Optional.of(
                round(RoundStatus.SCORING, LocalDateTime.now().minusHours(1), 24.0)));

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), LEADER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not currently active");
    }

    @Test
    void upsert_rejected_whenRoundTimingNotConfigured() {
        when(roundRepository.findById(1L)).thenReturn(Optional.of(
                round(RoundStatus.ACTIVE, null, null)));

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), LEADER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not configured");
    }

    @Test
    void upsert_rejected_afterDeadline() {
        // started 25h ago with a 24h window -> deadline passed
        when(roundRepository.findById(1L)).thenReturn(Optional.of(
                round(RoundStatus.ACTIVE, LocalDateTime.now().minusHours(25), 24.0)));

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), LEADER))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Deadline has passed");
    }

    @Test
    void upsert_throws_whenRoundMissing() {
        when(roundRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), LEADER))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void upsert_throws_whenTeamMissing() {
        when(roundRepository.findById(1L)).thenReturn(Optional.of(
                round(RoundStatus.ACTIVE, LocalDateTime.now().minusHours(1), 24.0)));
        when(teamRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> submissionService.upsertSubmission(1L, 2L, request(), LEADER))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- create vs update ----------

    @Test
    void upsert_autoCreatesRanking_whenNoneExists() {
        Round round = round(RoundStatus.ACTIVE, LocalDateTime.now().minusHours(1), 24.0);
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));
        Team team = new Team();
        team.setId(2L);
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team));
        stubLeader();
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 2L)).thenReturn(Optional.empty());
        when(roundRankingRepository.save(any(RoundRanking.class))).thenAnswer(inv -> {
            RoundRanking rr = inv.getArgument(0);
            rr.setId(3L);
            return rr;
        });
        when(submissionRepository.findByRoundRankingId(3L)).thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> inv.getArgument(0));

        SubmissionResponse res = submissionService.upsertSubmission(1L, 2L, request(), LEADER);

        verify(roundRankingRepository).save(any(RoundRanking.class)); // auto-created
        assertThat(res.getStatus()).isEqualTo(SubmissionStatus.DRAFT);
    }

    @Test
    void upsert_updatesExistingSubmission_keepingItsIdentity() {
        Round round = round(RoundStatus.ACTIVE, LocalDateTime.now().minusHours(1), 24.0);
        when(roundRepository.findById(1L)).thenReturn(Optional.of(round));
        Team team = new Team();
        team.setId(2L);
        when(teamRepository.findById(2L)).thenReturn(Optional.of(team));
        stubLeader();
        RoundRanking rr = new RoundRanking();
        rr.setId(3L);
        rr.setRound(round);
        rr.setTeam(team);
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 2L)).thenReturn(Optional.of(rr));
        Submission existing = new Submission();
        existing.setId(7L);
        existing.setRoundRanking(rr);
        existing.setStatus(SubmissionStatus.DRAFT);
        existing.setSubmissionName("Old name");
        when(submissionRepository.findByRoundRankingId(3L)).thenReturn(Optional.of(existing));
        when(submissionRepository.save(any(Submission.class))).thenAnswer(inv -> inv.getArgument(0));

        SubmissionRequest req = request();
        req.setSubmissionName("New name");
        req.setGithubUrl("https://github.com/x");

        SubmissionResponse res = submissionService.upsertSubmission(1L, 2L, req, LEADER);

        assertThat(res.getId()).isEqualTo(7L);            // same submission updated
        assertThat(res.getSubmissionName()).isEqualTo("New name");
        assertThat(res.getGithubUrl()).isEqualTo("https://github.com/x");
        verify(roundRankingRepository, never()).save(any()); // ranking reused
    }

    // ---------- reads ----------

    @Test
    void getSubmission_returnsMappedResponse() {
        Team team = new Team();
        team.setId(2L);
        RoundRanking rr = new RoundRanking();
        rr.setId(3L);
        rr.setTeam(team);
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 2L)).thenReturn(Optional.of(rr));
        Submission sub = new Submission();
        sub.setId(7L);
        sub.setRoundRanking(rr);
        sub.setStatus(SubmissionStatus.DRAFT);
        sub.setSubmissionName("Project");
        when(submissionRepository.findByRoundRankingId(3L)).thenReturn(Optional.of(sub));

        SubmissionResponse res = submissionService.getSubmission(1L, 2L);

        assertThat(res.getTeamId()).isEqualTo(2L);
        assertThat(res.getSubmissionName()).isEqualTo("Project");
    }

    @Test
    void getSubmission_throws_whenNoRankingOrNoSubmission() {
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 2L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> submissionService.getSubmission(1L, 2L))
                .isInstanceOf(ResourceNotFoundException.class);

        RoundRanking rr = new RoundRanking();
        rr.setId(3L);
        when(roundRankingRepository.findByRoundIdAndTeamId(1L, 2L)).thenReturn(Optional.of(rr));
        when(submissionRepository.findByRoundRankingId(3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> submissionService.getSubmission(1L, 2L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
