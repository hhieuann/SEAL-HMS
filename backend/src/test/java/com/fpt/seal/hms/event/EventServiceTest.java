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
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.staff.StaffRepository;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.track.TrackService;
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

    @Test
    void deleteEvent_blocked_whenOngoing() {
        Event e = event(1L, EventStatus.ONGOING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));

        assertThatThrownBy(() -> eventService.deleteEvent(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Cannot delete event");
        verify(eventRepository, never()).delete(any());
    }

    @Test
    void deleteEvent_ok_whenPlanned_andAuditLogs() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));

        eventService.deleteEvent(1L);

        verify(eventRepository).delete(e);
        verify(auditLogService).log(eq("EVENT_DELETED"), eq("event"), eq(1L), any());
    }

    // ---------- read ----------

    @Test
    void getAllEvents_mapsEachEvent() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findAll()).thenReturn(List.of(e));
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(teamRepository.countByEventId(1L)).thenReturn(3L);

        List<EventResponse> res = eventService.getAllEvents();

        assertThat(res).hasSize(1);
        assertThat(res.get(0).getCurrentTeams()).isEqualTo(3);
    }
}
