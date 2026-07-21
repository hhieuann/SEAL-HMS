package com.fpt.seal.hms.round;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.criterion.CriterionRepository;
import com.fpt.seal.hms.criterion.entity.Criterion;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.round.dto.RoundRequest;
import com.fpt.seal.hms.round.dto.RoundResponse;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.submission.entity.Submission;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.TrackAssignment;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Covers scoring-completeness validation, elimination on completion, round updates,
 *  and the sequential promotion pool check. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RoundServiceMoreTest {

    @Mock private RoundRepository roundRepository;
    @Mock private EventRepository eventRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private TopicRepository topicRepository;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private ScoreRepository scoreRepository;
    @Mock private CriterionRepository criterionRepository;
    @Mock private TrackAssignmentRepository trackAssignmentRepository;
    @Mock private TeamRepository teamRepository;
    @InjectMocks private RoundService roundService;

    private Event event() {
        Event e = new Event();
        e.setId(1L);
        e.setStartDate(LocalDate.of(2026, 7, 20));
        e.setEndDate(LocalDate.of(2026, 7, 30));
        e.setMaxTeams(20);
        return e;
    }

    private Round round(long id, RoundStatus status) {
        Round r = new Round();
        r.setId(id);
        r.setEvent(event());
        r.setStatus(status);
        r.setRoundSeq(1);
        r.setStartTime(LocalDateTime.of(2026, 7, 21, 9, 0));
        r.setDurationHours(24.0);
        return r;
    }

    private Team teamOnTrack(long id, Track track) {
        Team t = new Team();
        t.setId(id);
        t.setName("T" + id);
        t.setStatus(TeamStatus.IN_PROGRESS);
        t.setIsDisqualified(false);
        t.setTrack(track);
        return t;
    }

    private RoundRanking rr(long id, Team team) {
        RoundRanking r = new RoundRanking();
        r.setId(id);
        r.setTeam(team);
        return r;
    }

    private TrackAssignment judge(Track track, boolean done) {
        Account acc = new Account();
        acc.setEmail("judge@x.y");
        Lecturer l = new Lecturer();
        l.setFullName("Judge J");
        l.setAccount(acc);
        TrackAssignment a = new TrackAssignment();
        a.setTrack(track);
        a.setLecturer(l);
        a.setRole(AssignmentRole.JUDGE);
        a.setScoringCompleted(done);
        return a;
    }

    // ---------- SCORING -> UNDER_REVIEW: validateScoringComplete ----------

    @Test
    void scoringToUnderReview_throws_whenNoTeams() {
        Round r = round(9L, RoundStatus.SCORING);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of());

        assertThatThrownBy(() -> roundService.updateRoundStatus(9L, RoundStatus.UNDER_REVIEW))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No teams");
    }

    @Test
    void scoringToUnderReview_throws_whenNoCriteria() {
        Round r = round(9L, RoundStatus.SCORING);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(rr(1L, teamOnTrack(5L, new Track()))));
        when(criterionRepository.findByRoundId(9L)).thenReturn(List.of());

        assertThatThrownBy(() -> roundService.updateRoundStatus(9L, RoundStatus.UNDER_REVIEW))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("No scoring criteria");
    }

    @Test
    void scoringToUnderReview_throws_whenTeamHasNoSubmission() {
        Round r = round(9L, RoundStatus.SCORING);
        Track track = new Track();
        track.setId(3L);
        RoundRanking ranking = rr(1L, teamOnTrack(5L, track));
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(ranking));
        when(criterionRepository.findByRoundId(9L)).thenReturn(List.of(new Criterion()));
        when(submissionRepository.findByRoundRankingId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roundService.updateRoundStatus(9L, RoundStatus.UNDER_REVIEW))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("no submission");
    }

    @Test
    void scoringToUnderReview_throws_whenJudgeHasNotCompletedScoring() {
        Round r = round(9L, RoundStatus.SCORING);
        Track track = new Track();
        track.setId(3L);
        RoundRanking ranking = rr(1L, teamOnTrack(5L, track));
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(ranking));
        when(criterionRepository.findByRoundId(9L)).thenReturn(List.of(new Criterion()));
        when(submissionRepository.findByRoundRankingId(1L)).thenReturn(Optional.of(new Submission()));
        when(trackAssignmentRepository.findByTrack_Id(3L)).thenReturn(List.of(judge(track, false)));

        assertThatThrownBy(() -> roundService.updateRoundStatus(9L, RoundStatus.UNDER_REVIEW))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Incomplete scores");
    }

    @Test
    void scoringToUnderReview_passes_whenAllJudgesCompleted() {
        Round r = round(9L, RoundStatus.SCORING);
        Track track = new Track();
        track.setId(3L);
        RoundRanking ranking = rr(1L, teamOnTrack(5L, track));
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(ranking));
        when(criterionRepository.findByRoundId(9L)).thenReturn(List.of(new Criterion()));
        when(submissionRepository.findByRoundRankingId(1L)).thenReturn(Optional.of(new Submission()));
        when(trackAssignmentRepository.findByTrack_Id(3L)).thenReturn(List.of(judge(track, true)));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        RoundResponse res = roundService.updateRoundStatus(9L, RoundStatus.UNDER_REVIEW);

        assertThat(res.getStatus()).isEqualTo(RoundStatus.UNDER_REVIEW);
    }

    @Test
    void scoringToUnderReview_skipsDisqualifiedTeams() {
        Round r = round(9L, RoundStatus.SCORING);
        Team dq = teamOnTrack(5L, null);
        dq.setIsDisqualified(true); // skipped entirely — no submission needed
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(rr(1L, dq)));
        when(criterionRepository.findByRoundId(9L)).thenReturn(List.of(new Criterion()));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatCode(() -> roundService.updateRoundStatus(9L, RoundStatus.UNDER_REVIEW))
                .doesNotThrowAnyException();
    }

    @Test
    void activeToScoring_skipsTeamWithoutTrack_andTeamWithSubmission() {
        Round r = round(9L, RoundStatus.ACTIVE);
        // team A: REGISTERED, no track -> skipped (track null branch)
        Team noTrack = new Team();
        noTrack.setId(51L);
        noTrack.setStatus(TeamStatus.REGISTERED);
        noTrack.setTrack(null);
        // team B: IN_PROGRESS, has track + a submission -> not eliminated
        Track track = new Track();
        track.setId(3L);
        Team submitted = teamOnTrack(52L, track);
        submitted.setStatus(TeamStatus.CONFIRMED);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(noTrack, submitted));
        when(roundRankingRepository.findByRoundIdAndTeamId(9L, 52L)).thenReturn(Optional.of(new RoundRanking()));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        roundService.updateRoundStatus(9L, RoundStatus.SCORING);

        assertThat(noTrack.getStatus()).isEqualTo(TeamStatus.REGISTERED);   // untouched (no track)
        assertThat(submitted.getStatus()).isEqualTo(TeamStatus.CONFIRMED);  // untouched (submitted)
        verify(teamRepository, never()).save(any());
    }

    @Test
    void underReviewToCompleted_skipsAlreadyEliminatedTeams() {
        Round r = round(9L, RoundStatus.UNDER_REVIEW);
        Team already = teamOnTrack(6L, null);
        already.setStatus(TeamStatus.DISQUALIFIED); // already out -> not touched again
        RoundRanking rr = rr(2L, already);
        rr.setIsPromoted(false);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(rr));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        roundService.updateRoundStatus(9L, RoundStatus.COMPLETED);

        assertThat(already.getStatus()).isEqualTo(TeamStatus.DISQUALIFIED);
        verify(teamRepository, never()).save(already);
    }

    @Test
    void underReviewToCompleted_promotedNullTreatedAsNotPromoted() {
        Round r = round(9L, RoundStatus.UNDER_REVIEW);
        Team t = teamOnTrack(6L, null);
        RoundRanking rr = rr(2L, t);
        rr.setIsPromoted(null); // null -> eliminated
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(rr));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        roundService.updateRoundStatus(9L, RoundStatus.COMPLETED);

        assertThat(t.getStatus()).isEqualTo(TeamStatus.ELIMINATED);
    }

    // ---------- UNDER_REVIEW -> COMPLETED: elimination ----------

    @Test
    void underReviewToCompleted_eliminatesNonPromotedTeams() {
        Round r = round(9L, RoundStatus.UNDER_REVIEW);
        Team promoted = teamOnTrack(5L, null);
        Team dropped = teamOnTrack(6L, null);
        RoundRanking rrP = rr(1L, promoted);
        rrP.setIsPromoted(true);
        RoundRanking rrD = rr(2L, dropped);
        rrD.setIsPromoted(false);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRankingRepository.findByRoundId(9L)).thenReturn(List.of(rrP, rrD));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        roundService.updateRoundStatus(9L, RoundStatus.COMPLETED);

        assertThat(promoted.getStatus()).isEqualTo(TeamStatus.IN_PROGRESS); // untouched
        assertThat(dropped.getStatus()).isEqualTo(TeamStatus.ELIMINATED);
        verify(teamRepository).save(dropped);
        verify(teamRepository, never()).save(promoted);
    }

    // ---------- update happy path + reset to CREATED ----------

    @Test
    void updateRound_appliesChanges_whenStillCreated() {
        Round r = round(9L, RoundStatus.CREATED);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>());
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        RoundRequest req = new RoundRequest();
        req.setName("Updated R1");
        req.setStartTime(LocalDateTime.of(2026, 7, 22, 9, 0));
        req.setDurationHours(12.0);
        req.setPromotionTopN(4);

        RoundResponse res = roundService.updateRound(9L, req);

        assertThat(res.getName()).isEqualTo("Updated R1");
        assertThat(res.getPromotionTopN()).isEqualTo(4);
    }

    @Test
    void updateRoundStatus_allowsResetToCreated_forDrawReset() {
        Round r = round(9L, RoundStatus.ACTIVE);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        RoundResponse res = roundService.updateRoundStatus(9L, RoundStatus.CREATED);

        assertThat(res.getStatus()).isEqualTo(RoundStatus.CREATED);
    }

    @Test
    void completedRound_cannotTransitionAnywhere() {
        Round r = round(9L, RoundStatus.COMPLETED);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> roundService.updateRoundStatus(9L, RoundStatus.ACTIVE))
                .isInstanceOf(BusinessException.class);
    }

    // ---------- sequential promotion pool ----------

    @Test
    void validateSequentialPromotionTopN_throws_whenPromotingMoreThanPool() {
        Event e = event();
        e.setMaxTeams(4);
        Round r1 = round(1L, RoundStatus.CREATED);
        r1.setRoundSeq(1);
        r1.setPromotionTopN(5); // promotes 5 from a pool of 4
        Round r2 = round(2L, RoundStatus.CREATED);
        r2.setRoundSeq(2);
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(r1, r2)));
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());

        assertThatThrownBy(() -> roundService.validateSequentialPromotionTopN(e))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("pool");
    }

    @Test
    void validateSequentialPromotionTopN_ok_whenPoolShrinksProperly() {
        Event e = event();
        e.setMaxTeams(10);
        Round r1 = round(1L, RoundStatus.CREATED);
        r1.setRoundSeq(1);
        r1.setPromotionTopN(4);
        Round r2 = round(2L, RoundStatus.CREATED);
        r2.setRoundSeq(2);
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(r1, r2)));
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());

        assertThatCode(() -> roundService.validateSequentialPromotionTopN(e))
                .doesNotThrowAnyException();
    }

    // ---------- reads ----------

    @Test
    void getRoundsByEventId_mapsAll() {
        when(roundRepository.findByEventId(1L)).thenReturn(List.of(round(9L, RoundStatus.CREATED)));

        assertThat(roundService.getRoundsByEventId(1L)).hasSize(1);
    }
}
