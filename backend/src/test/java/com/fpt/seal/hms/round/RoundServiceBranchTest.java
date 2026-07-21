package com.fpt.seal.hms.round;

import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.criterion.CriterionRepository;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.round.dto.RoundRequest;
import com.fpt.seal.hms.round.dto.RoundResponse;
import com.fpt.seal.hms.round.entity.Round;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.topic.TopicRepository;
import com.fpt.seal.hms.topic.entity.Topic;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.TrackAssignment;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
import com.fpt.seal.hms.team.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

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

/** Branch tests for RoundService time validation, overlap detection, and the
 *  topic-derived track count in the promotion-pool check. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RoundServiceBranchTest {

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

    private RoundRequest req(LocalDateTime start, double hours, Integer topN) {
        RoundRequest r = new RoundRequest();
        r.setName("R");
        r.setStartTime(start);
        r.setDurationHours(hours);
        r.setPromotionTopN(topN);
        return r;
    }

    // ---------- validateRoundTime: null event-date branches skipped ----------

    @Test
    void createRound_skipsStartDateCheck_whenEventStartDateNull() {
        Event e = new Event();
        e.setId(1L);
        e.setEndDate(LocalDate.of(2026, 7, 30)); // startDate null -> first check skipped
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(roundRepository.findMaxRoundSeqByEventId(1L)).thenReturn(Optional.empty()); // orElse(0)
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>());
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        RoundResponse res = roundService.createRound(1L, req(LocalDateTime.of(2026, 7, 25, 9, 0), 24, 5));

        assertThat(res.getRoundSeq()).isEqualTo(1); // empty maxSeq -> 0 + 1
    }

    @Test
    void createRound_skipsEndDateCheck_whenEventEndDateNull() {
        Event e = new Event();
        e.setId(1L);
        e.setStartDate(LocalDate.of(2026, 7, 20)); // endDate null -> second check skipped
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(roundRepository.findMaxRoundSeqByEventId(1L)).thenReturn(Optional.of(0));
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>());
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatCode(() -> roundService.createRound(1L, req(LocalDateTime.of(2026, 7, 25, 9, 0), 100, 5)))
                .doesNotThrowAnyException();
    }

    // ---------- overlap detection between consecutive rounds ----------

    @Test
    void createRound_throws_whenOverlappingPreviousRound() {
        Event e = new Event();
        e.setId(1L);
        e.setStartDate(LocalDate.of(2026, 7, 20));
        e.setEndDate(LocalDate.of(2026, 7, 30));
        Round existing = new Round();
        existing.setId(1L);
        existing.setEvent(e);
        existing.setRoundSeq(1);
        existing.setStartTime(LocalDateTime.of(2026, 7, 21, 9, 0));
        existing.setDurationHours(48.0); // ends 2026-07-23 09:00
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(roundRepository.findMaxRoundSeqByEventId(1L)).thenReturn(Optional.of(1));
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(existing)));

        // new round seq 2 starts 2026-07-22 (inside round 1's window) -> overlap
        assertThatThrownBy(() -> roundService.createRound(1L, req(LocalDateTime.of(2026, 7, 22, 9, 0), 24, 5)))
                .isInstanceOf(BusinessException.class);
    }

    // ---------- promotion pool: track count derived from topics ----------

    @Test
    void validateSequentialPromotionTopN_usesTopicCountAsTrackCount() {
        Event e = new Event();
        e.setId(1L);
        e.setMaxTeams(12);
        Round r1 = new Round();
        r1.setId(1L);
        r1.setEvent(e);
        r1.setRoundSeq(1);
        r1.setPromotionTopN(5); // 5 per track
        Round r2 = new Round();
        r2.setId(2L);
        r2.setEvent(e);
        r2.setRoundSeq(2);
        when(roundRepository.findByEventId(1L)).thenReturn(new ArrayList<>(List.of(r1, r2)));

        Track track = new Track();
        track.setId(3L);
        when(trackRepository.findByEventId(1L)).thenReturn(List.of(track));
        // 3 topics -> trackCount 3 -> 5*3 = 15 promoted >= pool 12 -> throw
        Topic t1 = new Topic(), t2 = new Topic(), t3 = new Topic();
        when(topicRepository.findByTrackId(3L)).thenReturn(List.of(t1, t2, t3));

        assertThatThrownBy(() -> roundService.validateSequentialPromotionTopN(e))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("per track");
    }

    // ---------- CREATED -> ACTIVE resets only JUDGE assignments ----------

    @Test
    void activate_resetsScoringCompleted_onlyForJudgeAssignments() {
        Event e = new Event();
        e.setId(1L);
        Round r = new Round();
        r.setId(9L);
        r.setEvent(e);
        r.setStatus(RoundStatus.CREATED);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        TrackAssignment judge = new TrackAssignment();
        judge.setRole(AssignmentRole.JUDGE);
        judge.setScoringCompleted(true);
        TrackAssignment mentor = new TrackAssignment();
        mentor.setRole(AssignmentRole.MENTOR);
        mentor.setScoringCompleted(true);
        when(trackAssignmentRepository.findByTrack_Event_Id(1L)).thenReturn(List.of(judge, mentor));
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        roundService.updateRoundStatus(9L, RoundStatus.ACTIVE);

        assertThat(judge.getScoringCompleted()).isFalse();  // reset
        assertThat(mentor.getScoringCompleted()).isTrue();  // untouched (not a judge)
        verify(trackAssignmentRepository).saveAll(any());
    }
}
