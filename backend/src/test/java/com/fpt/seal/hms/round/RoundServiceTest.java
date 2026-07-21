package com.fpt.seal.hms.round;

import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
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
import com.fpt.seal.hms.track.TrackRepository;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RoundServiceTest {

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

    private RoundRequest request(LocalDateTime start, double hours, Integer topN) {
        RoundRequest r = new RoundRequest();
        r.setName("R1");
        r.setStartTime(start);
        r.setDurationHours(hours);
        r.setPromotionTopN(topN);
        return r;
    }

    private Round round(long id, Event e, RoundStatus status) {
        Round r = new Round();
        r.setId(id);
        r.setEvent(e);
        r.setStatus(status);
        r.setRoundSeq(1);
        r.setStartTime(LocalDateTime.of(2026, 7, 21, 9, 0));
        r.setDurationHours(24.0);
        return r;
    }

    // ---------- create ----------

    @Test
    void createRound_assignsNextSeq_andCreatedStatus() {
        Event e = event();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(roundRepository.findMaxRoundSeqByEventId(1L)).thenReturn(Optional.of(2));
        when(roundRepository.findByEventId(1L)).thenReturn(new java.util.ArrayList<>());
        when(trackRepository.findByEventId(1L)).thenReturn(List.of());
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> {
            Round r = inv.getArgument(0);
            r.setId(9L);
            return r;
        });

        RoundResponse res = roundService.createRound(1L,
                request(LocalDateTime.of(2026, 7, 21, 9, 0), 24, 5));

        assertThat(res.getRoundSeq()).isEqualTo(3);      // 2 + 1
        assertThat(res.getStatus()).isEqualTo(RoundStatus.CREATED);
    }

    @Test
    void createRound_throws_whenStartBeforeEventStart() {
        Event e = event();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(roundRepository.findMaxRoundSeqByEventId(1L)).thenReturn(Optional.of(0));

        assertThatThrownBy(() -> roundService.createRound(1L,
                request(LocalDateTime.of(2026, 7, 10, 9, 0), 24, 5)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("before event start");
    }

    @Test
    void createRound_throws_whenEndAfterEventEnd() {
        Event e = event();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(roundRepository.findMaxRoundSeqByEventId(1L)).thenReturn(Optional.of(0));

        // starts on the last day but runs 48h -> ends past event end
        assertThatThrownBy(() -> roundService.createRound(1L,
                request(LocalDateTime.of(2026, 7, 30, 9, 0), 48, 5)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("after event end");
    }

    // ---------- update ----------

    @Test
    void updateRound_throws_whenAlreadyStarted() {
        Round r = round(9L, event(), RoundStatus.ACTIVE);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> roundService.updateRound(9L,
                request(LocalDateTime.of(2026, 7, 21, 9, 0), 24, 5)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("after it has started");
    }

    // ---------- status transitions ----------

    @Test
    void updateRoundStatus_createdToActive_setsStartTimeAndResetsScoring() {
        Round r = round(9L, event(), RoundStatus.CREATED);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));
        when(trackAssignmentRepository.findByTrack_Event_Id(1L)).thenReturn(List.of());
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        RoundResponse res = roundService.updateRoundStatus(9L, RoundStatus.ACTIVE);

        assertThat(res.getStatus()).isEqualTo(RoundStatus.ACTIVE);
        verify(trackAssignmentRepository).saveAll(any());
    }

    @Test
    void updateRoundStatus_rejectsIllegalJump() {
        Round r = round(9L, event(), RoundStatus.CREATED);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        // CREATED can only go to ACTIVE, not straight to COMPLETED
        assertThatThrownBy(() -> roundService.updateRoundStatus(9L, RoundStatus.COMPLETED))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("one-way transition");
    }

    @Test
    void updateRoundStatus_sameStatus_isNoOp() {
        Round r = round(9L, event(), RoundStatus.ACTIVE);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        RoundResponse res = roundService.updateRoundStatus(9L, RoundStatus.ACTIVE);

        assertThat(res.getStatus()).isEqualTo(RoundStatus.ACTIVE);
        verify(roundRepository, never()).save(any());
    }

    @Test
    void updateRoundStatus_activeToScoring_eliminatesTeamsWithoutSubmission() {
        Event e = event();
        Round r = round(9L, e, RoundStatus.ACTIVE);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        com.fpt.seal.hms.track.entity.Track track = new com.fpt.seal.hms.track.entity.Track();
        track.setId(3L);
        com.fpt.seal.hms.team.entity.Team team = new com.fpt.seal.hms.team.entity.Team();
        team.setId(50L);
        team.setName("NoSubmit");
        team.setStatus(com.fpt.seal.hms.common.enums.TeamStatus.IN_PROGRESS);
        team.setTrack(track);
        when(teamRepository.findByEventId(1L)).thenReturn(List.of(team));
        when(roundRankingRepository.findByRoundIdAndTeamId(9L, 50L)).thenReturn(Optional.empty());
        when(roundRepository.save(any(Round.class))).thenAnswer(inv -> inv.getArgument(0));

        roundService.updateRoundStatus(9L, RoundStatus.SCORING);

        assertThat(team.getStatus()).isEqualTo(com.fpt.seal.hms.common.enums.TeamStatus.ELIMINATED);
        assertThat(team.getIsDisqualified()).isTrue();
        verify(teamRepository).save(team);
    }

    // ---------- delete ----------

    @Test
    void deleteRound_throws_whenAlreadyStarted() {
        Round r = round(9L, event(), RoundStatus.ACTIVE);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        assertThatThrownBy(() -> roundService.deleteRound(9L))
                .isInstanceOf(BusinessException.class);
        verify(roundRepository, never()).delete(any());
    }

    @Test
    void deleteRound_deletes_whenCreated() {
        Round r = round(9L, event(), RoundStatus.CREATED);
        when(roundRepository.findById(9L)).thenReturn(Optional.of(r));

        roundService.deleteRound(9L);

        verify(roundRepository).delete(r);
    }

    @Test
    void getRoundById_throws_whenMissing() {
        when(roundRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> roundService.getRoundById(9L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
