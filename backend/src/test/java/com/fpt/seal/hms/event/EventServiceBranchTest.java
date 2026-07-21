package com.fpt.seal.hms.event;

import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.auditlog.AuditLogService;
import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.event.dto.EventRequest;
import com.fpt.seal.hms.event.dto.EventResponse;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.round.RoundService;
import com.fpt.seal.hms.round.dto.RoundRequest;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.staff.StaffRepository;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.track.TrackService;
import com.fpt.seal.hms.track.dto.TrackRequest;
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
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Exercises the many null-guard / boundary branches in EventService's date
 *  validation, auto status progression, and registration-open computation. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventServiceBranchTest {

    @Mock private EventRepository eventRepository;
    @Mock private RoundService roundService;
    @Mock private TrackService trackService;
    @Mock private TeamRepository teamRepository;
    @Mock private EventStaffRepository eventStaffRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private StaffRepository staffRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private RoundRankingRepository roundRankingRepository;
    @Mock private SubmissionRepository submissionRepository;
    @Mock private ScoreRepository scoreRepository;
    @InjectMocks private EventService eventService;

    private Event savedAs(long id) {
        return invocationEvent(id);
    }

    private Event invocationEvent(long id) {
        Event e = new Event();
        e.setId(id);
        return e;
    }

    private void stubSaveAndMap() {
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            if (e.getId() == null) e.setId(1L);
            return e;
        });
        when(teamRepository.countByEventId(any())).thenReturn(0L);
        when(roundService.getRoundsByEventId(any())).thenReturn(List.of());
        when(trackService.getTracksByEventId(any())).thenReturn(List.of());
    }

    // ---------- createEvent: null-date branches are skipped (no throw) ----------

    @Test
    void createEvent_allowsNullDates_skippingEachDateCheck() {
        stubSaveAndMap();
        EventRequest req = new EventRequest();
        req.setName("Minimal");
        req.setMaxTeams(4);
        req.setMinTeams(2);
        // all dates null -> every validateEventDates condition short-circuits on the null side

        assertThatCode(() -> eventService.createEvent(req)).doesNotThrowAnyException();
    }

    @Test
    void createEvent_withRoundsAndTracks_delegatesToServices() {
        stubSaveAndMap();
        EventRequest req = new EventRequest();
        req.setName("Full");
        req.setMaxTeams(10);
        req.setMinTeams(2);
        req.setRegistrationStartDate(LocalDate.of(2026, 7, 1));
        req.setRegistrationEndDate(LocalDate.of(2026, 7, 10));
        req.setStartDate(LocalDate.of(2026, 7, 20));
        req.setEndDate(LocalDate.of(2026, 7, 30));
        req.setRounds(List.of(new RoundRequest()));
        req.setTracks(List.of(new TrackRequest()));

        eventService.createEvent(req);

        verify(roundService).createRound(eq(1L), any(RoundRequest.class));
        verify(trackService).createTrack(eq(1L), any(TrackRequest.class));
    }

    // ---------- auto progression: the "no change" branches ----------

    @Test
    void autoProgress_planned_noChange_whenRegistrationStartDateNull() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.PLANNED); // regStart null -> stays PLANNED
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        EventResponse res = eventService.getEventById(1L);

        assertThat(res.getStatus()).isEqualTo(EventStatus.PLANNED);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void autoProgress_planned_noChange_whenRegistrationNotStartedYet() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.PLANNED);
        e.setRegistrationStartDate(LocalDate.now().plusDays(3)); // future
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        assertThat(eventService.getEventById(1L).getStatus()).isEqualTo(EventStatus.PLANNED);
    }

    @Test
    void autoProgress_upcoming_toOngoing_whenMaxTeamsReached_evenIfRegStillOpen() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.UPCOMING);
        e.setRegistrationEndDate(LocalDate.now().plusDays(5)); // reg still open
        e.setMinTeams(2);
        e.setMaxTeams(5);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(5L); // full -> teamFull branch
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        assertThat(eventService.getEventById(1L).getStatus()).isEqualTo(EventStatus.ONGOING);
    }

    @Test
    void autoProgress_ongoing_noChange_whenEndDateNull() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.ONGOING); // endDate null -> no auto-complete
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(3L);
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        assertThat(eventService.getEventById(1L).getStatus()).isEqualTo(EventStatus.ONGOING);
        verify(eventRepository, never()).save(any());
    }

    // ---------- registrationOpen branches in mapToResponse ----------

    @Test
    void registrationOpen_false_whenBeforeRegistrationStart() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.PLANNED);
        e.setRegistrationStartDate(LocalDate.now().plusDays(2)); // not open yet
        e.setRegistrationEndDate(LocalDate.now().plusDays(10));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        assertThat(eventService.getEventById(1L).getRegistrationOpen()).isFalse();
    }

    @Test
    void registrationOpen_true_whenWithinWindowAndNotFull() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.UPCOMING);
        e.setRegistrationStartDate(LocalDate.now().minusDays(1));
        e.setRegistrationEndDate(LocalDate.now().plusDays(5));
        e.setMaxTeams(10);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(2L);
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        assertThat(eventService.getEventById(1L).getRegistrationOpen()).isTrue();
    }

    // ---------- updateEvent COMPLETED guards + CANCELLED transition ----------

    @Test
    void updateEvent_completed_blocksRegistrationDateChanges() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.COMPLETED);
        e.setRegistrationStartDate(LocalDate.of(2026, 7, 1));
        e.setRegistrationEndDate(LocalDate.of(2026, 7, 10));
        e.setStartDate(LocalDate.of(2026, 7, 20));
        e.setEndDate(LocalDate.of(2026, 7, 30));
        e.setMaxTeams(10);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));

        EventRequest req = new EventRequest();
        req.setRegistrationStartDate(LocalDate.of(2026, 6, 1)); // changed
        req.setRegistrationEndDate(e.getRegistrationEndDate());

        assertThatThrownBy(() -> eventService.updateEvent(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("registration start date");
    }

    @Test
    void updateEventStatus_cancel_allowedFromNonCompleted_butNotFromCompleted() {
        Event ongoing = new Event();
        ongoing.setId(1L);
        ongoing.setStatus(EventStatus.ONGOING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(ongoing));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);

        assertThat(eventService.updateEventStatus(1L, EventStatus.CANCELLED).getStatus())
                .isEqualTo(EventStatus.CANCELLED);

        Event completed = new Event();
        completed.setId(2L);
        completed.setStatus(EventStatus.COMPLETED);
        when(eventRepository.findById(2L)).thenReturn(Optional.of(completed));
        assertThatThrownBy(() -> eventService.updateEventStatus(2L, EventStatus.CANCELLED))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot cancel a completed");
    }

    @Test
    void updateEventStatus_sameStatus_returnsWithoutSaving() {
        Event e = new Event();
        e.setId(1L);
        e.setStatus(EventStatus.PLANNED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);

        eventService.updateEventStatus(1L, EventStatus.PLANNED);

        verify(eventRepository, never()).save(any());
    }
}
