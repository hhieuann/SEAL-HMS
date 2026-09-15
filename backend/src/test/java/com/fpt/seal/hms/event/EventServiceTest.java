package com.fpt.seal.hms.event;

import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.auditlog.AuditLogService;
import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.dto.EventRequest;
import com.fpt.seal.hms.event.dto.EventResponse;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.round.RoundService;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.staff.StaffRepository;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.track.TrackService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventServiceTest {

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
    @Mock private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    @Mock private com.fpt.seal.hms.track.TrackRepository trackRepository;
    @Mock private com.fpt.seal.hms.topic.TopicRepository topicRepository;
    @Mock private com.fpt.seal.hms.round.RoundRepository roundRepository;
    @Mock private com.fpt.seal.hms.criterion.CriterionRepository criterionRepository;
    @InjectMocks private EventService eventService;

    private EventRequest validRequest() {
        EventRequest r = new EventRequest();
        r.setName("Spring Hack");
        r.setType("Hackathon");
        r.setRegistrationStartDate(LocalDate.of(2026, 7, 1));
        r.setRegistrationEndDate(LocalDate.of(2026, 7, 10));
        r.setStartDate(LocalDate.of(2026, 7, 20));
        r.setEndDate(LocalDate.of(2026, 7, 30));
        r.setMinTeams(2);
        r.setMaxTeams(20);
        return r;
    }

    private Event event(long id, EventStatus status) {
        Event e = new Event();
        e.setId(id);
        e.setName("Spring Hack");
        e.setStatus(status);
        e.setMinTeams(2);
        e.setMaxTeams(20);
        return e;
    }

    // ---------- create ----------

    @Test
    void createEvent_persistsWithPlannedStatus_andAuditLogs() {
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> {
            Event e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());
        when(teamRepository.countByEventId(1L)).thenReturn(0L);

        EventResponse res = eventService.createEvent(validRequest());

        assertThat(res.getStatus()).isEqualTo(EventStatus.PLANNED);
        assertThat(res.getName()).isEqualTo("Spring Hack");
        verify(auditLogService).log(eq("EVENT_CREATED"), eq("event"), eq(1L), any());
    }

    @Test
    void createEvent_throws_whenMaxTeamsBelowTwo() {
        EventRequest req = validRequest();
        req.setMaxTeams(1);

        assertThatThrownBy(() -> eventService.createEvent(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Max teams");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void createEvent_throws_whenMinGreaterThanMax() {
        EventRequest req = validRequest();
        req.setMinTeams(25); // > max 20

        assertThatThrownBy(() -> eventService.createEvent(req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Min teams cannot be greater");
    }

    @Test
    void createEvent_throws_whenRegistrationEndNotAfterStart() {
        EventRequest req = validRequest();
        req.setRegistrationEndDate(req.getRegistrationStartDate()); // equal, not after

        assertThatThrownBy(() -> eventService.createEvent(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Registration end date");
    }

    @Test
    void createEvent_throws_whenEventEndNotAfterStart() {
        EventRequest req = validRequest();
        req.setEndDate(req.getStartDate()); // equal, not after

        assertThatThrownBy(() -> eventService.createEvent(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Event end date");
    }

    // ---------- status transition ----------

    @Test
    void updateEventStatus_plannedToUpcoming_ok() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);

        EventResponse res = eventService.updateEventStatus(1L, EventStatus.UPCOMING);

        assertThat(res.getStatus()).isEqualTo(EventStatus.UPCOMING);
        verify(auditLogService).log(eq("EVENT_STATUS_CHANGED"), eq("event"), eq(1L), any());
    }

    @Test
    void updateEventStatus_toOngoing_blockedBelowMinTeams() {
        Event e = event(1L, EventStatus.UPCOMING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(1L); // < minTeams 2

        assertThatThrownBy(() -> eventService.updateEventStatus(1L, EventStatus.ONGOING))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Minimum teams required");
        verify(eventRepository, never()).save(any());
    }

    @Test
    void updateEventStatus_toOngoing_okWhenMinTeamsMet() {
        Event e = event(1L, EventStatus.UPCOMING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(5L);
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));

        EventResponse res = eventService.updateEventStatus(1L, EventStatus.ONGOING);

        assertThat(res.getStatus()).isEqualTo(EventStatus.ONGOING);
    }

    @Test
    void updateEventStatus_rejectsIllegalTransition() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(5L);

        // PLANNED cannot jump to ONGOING
        assertThatThrownBy(() -> eventService.updateEventStatus(1L, EventStatus.ONGOING))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Invalid status transition");
    }

    // ---------- delete ----------

    // Permanent delete is now a two-step flow: an event must be CANCELLED first.

    @Test
    void deleteEvent_blocked_whenOngoing() {
        Event e = event(1L, EventStatus.ONGOING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));

        assertThatThrownBy(() -> eventService.deleteEvent(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("unless its status is CANCELLED");
        verify(eventRepository, never()).delete(any());
    }

    @Test
    void deleteEvent_blocked_whenStillPlanned() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));

        assertThatThrownBy(() -> eventService.deleteEvent(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("unless its status is CANCELLED");
        verify(eventRepository, never()).delete(any());
    }

    @Test
    void deleteEvent_ok_whenCancelled_andAuditLogs() {
        Event e = event(1L, EventStatus.CANCELLED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));

        eventService.deleteEvent(1L);

        verify(eventRepository).delete(e);
        verify(auditLogService).log(eq("EVENT_DELETED"), eq("event"), eq(1L), any());
    }

    // ---------- cancel ----------

    @Test
    void cancelEvent_setsCancelled_andAuditLogs() {
        Event e = event(1L, EventStatus.UPCOMING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);

        EventResponse res = eventService.cancelEvent(1L);

        assertThat(res.getStatus()).isEqualTo(EventStatus.CANCELLED);
        verify(auditLogService).log(eq("EVENT_CANCELLED"), eq("event"), eq(1L), any());
    }

    @Test
    void cancelEvent_allowedFromPlanned() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);

        assertThat(eventService.cancelEvent(1L).getStatus()).isEqualTo(EventStatus.CANCELLED);
    }

    @Test
    void cancelEvent_rejected_whenOngoingOrCompleted() {
        Event ongoing = event(1L, EventStatus.ONGOING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(ongoing));
        assertThatThrownBy(() -> eventService.cancelEvent(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only PLANNED or UPCOMING");

        Event completed = event(2L, EventStatus.COMPLETED);
        when(eventRepository.findById(2L)).thenReturn(Optional.of(completed));
        assertThatThrownBy(() -> eventService.cancelEvent(2L))
                .isInstanceOf(BusinessException.class);
        verify(eventRepository, never()).save(any());
    }

    // ---------- read ----------

    @Test
    void getAllEvents_mapsEachEvent() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findAllByOrderByCreatedAtDescIdDesc()).thenReturn(List.of(e));
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(teamRepository.countByEventId(1L)).thenReturn(3L);

        List<EventResponse> res = eventService.getAllEvents();

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getCurrentTeams()).isEqualTo(3);
    }

    // ---------- duplicateEvent ----------

    private com.fpt.seal.hms.event.entity.Event sourceEvent() {
        com.fpt.seal.hms.event.entity.Event e = new com.fpt.seal.hms.event.entity.Event();
        e.setId(1L);
        e.setName("SEAL Spring 2026");
        e.setType("Hackathon");
        e.setDescription("The spring edition");
        e.setMinTeams(4);
        e.setMaxTeams(20);
        e.setStatus(com.fpt.seal.hms.common.enums.EventStatus.COMPLETED);
        e.setRegistrationStartDate(java.time.LocalDate.of(2026, 1, 1));
        e.setRegistrationEndDate(java.time.LocalDate.of(2026, 1, 20));
        e.setStartDate(java.time.LocalDate.of(2026, 2, 1));
        e.setEndDate(java.time.LocalDate.of(2026, 2, 28));
        return e;
    }

    private com.fpt.seal.hms.event.dto.EventDuplicateRequest dupRequest(String name, java.time.LocalDate start) {
        com.fpt.seal.hms.event.dto.EventDuplicateRequest r = new com.fpt.seal.hms.event.dto.EventDuplicateRequest();
        r.setName(name);
        r.setStartDate(start);
        return r;
    }

    /** Wire the save calls so the copy comes back with an id, as JPA would. */
    private void stubSavesForDuplicate() {
        when(eventRepository.save(any(com.fpt.seal.hms.event.entity.Event.class))).thenAnswer(inv -> {
            com.fpt.seal.hms.event.entity.Event e = inv.getArgument(0);
            if (e.getId() == null) e.setId(99L);
            return e;
        });
        when(trackRepository.save(any())).thenAnswer(inv -> {
            com.fpt.seal.hms.track.entity.Track t = inv.getArgument(0);
            if (t.getId() == null) t.setId(500L);
            return t;
        });
        when(roundRepository.save(any())).thenAnswer(inv -> {
            com.fpt.seal.hms.round.entity.Round r = inv.getArgument(0);
            if (r.getId() == null) r.setId(700L);
            return r;
        });
    }

    @Test
    void duplicateEvent_copiesSettings_butStartsPlannedUnderTheNewName() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(sourceEvent()));
        stubSavesForDuplicate();

        eventService.duplicateEvent(1L, dupRequest("SEAL Summer 2026", null));

        ArgumentCaptor<com.fpt.seal.hms.event.entity.Event> cap =
                ArgumentCaptor.forClass(com.fpt.seal.hms.event.entity.Event.class);
        verify(eventRepository).save(cap.capture());
        com.fpt.seal.hms.event.entity.Event copy = cap.getValue();
        assertThat(copy.getName()).isEqualTo("SEAL Summer 2026");
        assertThat(copy.getType()).isEqualTo("Hackathon");
        assertThat(copy.getMinTeams()).isEqualTo(4);
        assertThat(copy.getMaxTeams()).isEqualTo(20);
        // the source was finished; the copy has not started
        assertThat(copy.getStatus()).isEqualTo(com.fpt.seal.hms.common.enums.EventStatus.PLANNED);
    }

    @Test
    void duplicateEvent_copiesTracksTopicsRoundsAndCriteria() {
        com.fpt.seal.hms.event.entity.Event source = sourceEvent();
        when(eventRepository.findById(1L)).thenReturn(Optional.of(source));
        stubSavesForDuplicate();

        com.fpt.seal.hms.track.entity.Track track = new com.fpt.seal.hms.track.entity.Track();
        track.setId(10L);
        track.setName("Track A");
        track.setMaxTeams(5);
        when(trackRepository.findByEventId(1L)).thenReturn(List.of(track));

        com.fpt.seal.hms.topic.entity.Topic topic = new com.fpt.seal.hms.topic.entity.Topic();
        topic.setId(20L);
        topic.setName("Medical RAG");
        topic.setTrack(track);
        when(topicRepository.findByEventId(1L)).thenReturn(List.of(topic));

        com.fpt.seal.hms.round.entity.Round round = new com.fpt.seal.hms.round.entity.Round();
        round.setId(30L);
        round.setName("Qualifier");
        round.setRoundSeq(1);
        round.setPromotionTopN(3);
        round.setDurationHours(24.0);
        round.setStatus(com.fpt.seal.hms.common.enums.RoundStatus.COMPLETED);
        when(roundRepository.findByEventId(1L)).thenReturn(List.of(round));

        com.fpt.seal.hms.criterion.entity.Criterion criterion = new com.fpt.seal.hms.criterion.entity.Criterion();
        criterion.setId(40L);
        criterion.setName("Innovation");
        criterion.setMaxScore(new java.math.BigDecimal("10"));
        criterion.setWeight(new java.math.BigDecimal("0.40"));
        when(criterionRepository.findByRoundId(30L)).thenReturn(List.of(criterion));

        eventService.duplicateEvent(1L, dupRequest("SEAL Summer 2026", null));

        verify(trackRepository).save(argThat(t -> "Track A".equals(t.getName()) && t.getId() == null || t.getId() == 500L));
        verify(topicRepository).save(argThat(t -> "Medical RAG".equals(t.getName())));
        ArgumentCaptor<com.fpt.seal.hms.round.entity.Round> roundCap =
                ArgumentCaptor.forClass(com.fpt.seal.hms.round.entity.Round.class);
        verify(roundRepository).save(roundCap.capture());
        assertThat(roundCap.getValue().getPromotionTopN()).isEqualTo(3);
        // a copied round has not been run, whatever the source round's state was
        assertThat(roundCap.getValue().getStatus()).isEqualTo(com.fpt.seal.hms.common.enums.RoundStatus.CREATED);
        verify(criterionRepository).save(argThat(c -> "Innovation".equals(c.getName())));
    }

    /** Results belong to the edition that produced them and must never follow the copy. */
    @Test
    void duplicateEvent_doesNotCopyTeamsStaffOrResults() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(sourceEvent()));
        stubSavesForDuplicate();

        eventService.duplicateEvent(1L, dupRequest("SEAL Summer 2026", null));

        verify(teamRepository, never()).save(any());
        verify(eventStaffRepository, never()).save(any());
        verify(roundRankingRepository, never()).save(any());
        verify(submissionRepository, never()).save(any());
        verify(scoreRepository, never()).save(any());
    }

    @Test
    void duplicateEvent_shiftsRoundStartTimesByTheSameNumberOfDays() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(sourceEvent())); // starts 2026-02-01
        stubSavesForDuplicate();

        com.fpt.seal.hms.round.entity.Round round = new com.fpt.seal.hms.round.entity.Round();
        round.setId(30L);
        round.setName("Qualifier");
        round.setRoundSeq(1);
        round.setStartTime(java.time.LocalDateTime.of(2026, 2, 3, 9, 0)); // 2 days into the event
        when(roundRepository.findByEventId(1L)).thenReturn(List.of(round));

        // new event starts 2026-06-01, i.e. 120 days later
        eventService.duplicateEvent(1L, dupRequest("SEAL Summer 2026", java.time.LocalDate.of(2026, 6, 1)));

        ArgumentCaptor<com.fpt.seal.hms.round.entity.Round> cap =
                ArgumentCaptor.forClass(com.fpt.seal.hms.round.entity.Round.class);
        verify(roundRepository).save(cap.capture());
        // still 2 days into the event, same time of day
        assertThat(cap.getValue().getStartTime()).isEqualTo(java.time.LocalDateTime.of(2026, 6, 3, 9, 0));
    }

    @Test
    void duplicateEvent_keepsSourceDates_whenNoneAreGiven() {
        when(eventRepository.findById(1L)).thenReturn(Optional.of(sourceEvent()));
        stubSavesForDuplicate();

        eventService.duplicateEvent(1L, dupRequest("Copy", null));

        ArgumentCaptor<com.fpt.seal.hms.event.entity.Event> cap =
                ArgumentCaptor.forClass(com.fpt.seal.hms.event.entity.Event.class);
        verify(eventRepository).save(cap.capture());
        assertThat(cap.getValue().getStartDate()).isEqualTo(java.time.LocalDate.of(2026, 2, 1));
        assertThat(cap.getValue().getRegistrationEndDate()).isEqualTo(java.time.LocalDate.of(2026, 1, 20));
    }

    @Test
    void duplicateEvent_throws_whenSourceMissing() {
        when(eventRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.duplicateEvent(404L, dupRequest("X", null)))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(eventRepository, never()).save(any());
    }
}
