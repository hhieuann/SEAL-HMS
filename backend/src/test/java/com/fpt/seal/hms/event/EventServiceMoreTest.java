package com.fpt.seal.hms.event;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.auditlog.AuditLogService;
import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.dto.EventRequest;
import com.fpt.seal.hms.event.dto.EventResponse;
import com.fpt.seal.hms.event.entity.Event;
import com.fpt.seal.hms.event.entity.EventStaff;
import com.fpt.seal.hms.roundranking.RoundRankingRepository;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import com.fpt.seal.hms.round.RoundService;
import com.fpt.seal.hms.score.ScoreRepository;
import com.fpt.seal.hms.staff.StaffRepository;
import com.fpt.seal.hms.staff.entity.Staff;
import com.fpt.seal.hms.submission.SubmissionRepository;
import com.fpt.seal.hms.submission.entity.Submission;
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
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/** Covers EventService paths beyond create/status/delete: updates with live-event
 *  guards, auto status progression, staff assignment, and event data reset. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EventServiceMoreTest {

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
    @InjectMocks private EventService eventService;

    private Event event(long id, EventStatus status) {
        Event e = new Event();
        e.setId(id);
        e.setName("Hack");
        e.setStatus(status);
        e.setMinTeams(2);
        e.setMaxTeams(20);
        e.setRegistrationStartDate(LocalDate.now().minusDays(10));
        e.setRegistrationEndDate(LocalDate.now().plusDays(5));
        e.setStartDate(LocalDate.now().plusDays(7));
        e.setEndDate(LocalDate.now().plusDays(14));
        return e;
    }

    private EventRequest requestLike(Event e) {
        EventRequest r = new EventRequest();
        r.setName(e.getName());
        r.setType("Hackathon");
        r.setStartDate(e.getStartDate());
        r.setEndDate(e.getEndDate());
        r.setRegistrationStartDate(e.getRegistrationStartDate());
        r.setRegistrationEndDate(e.getRegistrationEndDate());
        r.setMinTeams(e.getMinTeams());
        r.setMaxTeams(e.getMaxTeams());
        return r;
    }

    // ---------- updateEvent ----------

    @Test
    void updateEvent_appliesChanges_andAuditLogs() {
        Event e = event(1L, EventStatus.PLANNED);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);
        EventRequest req = requestLike(e);
        req.setName("Renamed");

        EventResponse res = eventService.updateEvent(1L, req);

        assertThat(res.getName()).isEqualTo("Renamed");
        verify(roundService).validateSequentialPromotionTopN(e);
        verify(auditLogService).log(eq("EVENT_UPDATED"), eq("event"), eq(1L), any());
    }

    @Test
    void updateEvent_ongoing_blocksStructuralChanges() {
        Event e = event(1L, EventStatus.ONGOING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));

        EventRequest req = requestLike(e);
        req.setStartDate(e.getStartDate().plusDays(1)); // structural change

        assertThatThrownBy(() -> eventService.updateEvent(1L, req))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("start date of an ongoing");

        EventRequest req2 = requestLike(e);
        req2.setMaxTeams(99);
        assertThatThrownBy(() -> eventService.updateEvent(1L, req2))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("max teams of an ongoing");
    }

    @Test
    void updateEvent_ongoing_allowsNonStructuralChanges() {
        Event e = event(1L, EventStatus.ONGOING);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);

        EventRequest req = requestLike(e); // same dates/limits, new description
        req.setDescription("Updated description");

        assertThatCode(() -> eventService.updateEvent(1L, req)).doesNotThrowAnyException();
    }

    // ---------- auto progression (getEventById) ----------

    @Test
    void getEventById_autoProgressesPlannedToUpcoming_whenRegistrationOpened() {
        Event e = event(1L, EventStatus.PLANNED); // reg started 10 days ago
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(teamRepository.countByEventId(1L)).thenReturn(0L);
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        EventResponse res = eventService.getEventById(1L);

        assertThat(res.getStatus()).isEqualTo(EventStatus.UPCOMING);
        verify(eventRepository).save(e); // progression persisted
    }

    @Test
    void getEventById_autoProgressesUpcomingToOngoing_whenRegClosedAndMinMet() {
        Event e = event(1L, EventStatus.UPCOMING);
        e.setRegistrationEndDate(LocalDate.now().minusDays(1)); // closed
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(5L); // >= minTeams
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        EventResponse res = eventService.getEventById(1L);

        assertThat(res.getStatus()).isEqualTo(EventStatus.ONGOING);
    }

    @Test
    void getEventById_staysUpcoming_whenRegClosedButBelowMinTeams() {
        Event e = event(1L, EventStatus.UPCOMING);
        e.setRegistrationEndDate(LocalDate.now().minusDays(1));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(1L); // < minTeams
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        EventResponse res = eventService.getEventById(1L);

        assertThat(res.getStatus()).isEqualTo(EventStatus.UPCOMING);
        verify(eventRepository, never()).save(any());
    }

    @Test
    void getEventById_autoCompletes_whenPastEndDate() {
        Event e = event(1L, EventStatus.ONGOING);
        e.setEndDate(LocalDate.now().minusDays(1));
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(5L);
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        EventResponse res = eventService.getEventById(1L);

        assertThat(res.getStatus()).isEqualTo(EventStatus.COMPLETED);
    }

    @Test
    void mapToResponse_registrationOpen_false_whenFull() {
        Event e = event(1L, EventStatus.UPCOMING); // reg window currently open
        when(eventRepository.findById(1L)).thenReturn(Optional.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(20L); // == maxTeams -> full
        when(eventRepository.save(any(Event.class))).thenAnswer(inv -> inv.getArgument(0));
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of());

        EventResponse res = eventService.getEventById(1L);

        assertThat(res.getRegistrationOpen()).isFalse();
    }

    // ---------- staff assignment ----------

    @Test
    void assignStaff_persists_forStaffAccount() {
        when(eventStaffRepository.existsByEvent_IdAndAccount_Id(1L, 30L)).thenReturn(false);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event(1L, EventStatus.PLANNED)));
        Account acc = new Account();
        acc.setId(30L);
        acc.setRole(Role.STAFF);
        when(accountRepository.findById(30L)).thenReturn(Optional.of(acc));

        eventService.assignStaff(1L, 30L);

        verify(eventStaffRepository).save(any(EventStaff.class));
    }

    @Test
    void assignStaff_throws_whenDuplicate() {
        when(eventStaffRepository.existsByEvent_IdAndAccount_Id(1L, 30L)).thenReturn(true);

        assertThatThrownBy(() -> eventService.assignStaff(1L, 30L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already assigned");
    }

    @Test
    void assignStaff_throws_whenAccountIsNotStaff() {
        when(eventStaffRepository.existsByEvent_IdAndAccount_Id(1L, 30L)).thenReturn(false);
        when(eventRepository.findById(1L)).thenReturn(Optional.of(event(1L, EventStatus.PLANNED)));
        Account acc = new Account();
        acc.setId(30L);
        acc.setRole(Role.STUDENT);
        when(accountRepository.findById(30L)).thenReturn(Optional.of(acc));

        assertThatThrownBy(() -> eventService.assignStaff(1L, 30L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not a STAFF");
    }

    @Test
    void removeStaff_deletesAssignment() {
        EventStaff es = new EventStaff();
        when(eventStaffRepository.findByEvent_IdAndAccount_Id(1L, 30L)).thenReturn(Optional.of(es));

        eventService.removeStaff(1L, 30L);

        verify(eventStaffRepository).delete(es);
    }

    @Test
    void removeStaff_throws_whenNotAssigned() {
        when(eventStaffRepository.findByEvent_IdAndAccount_Id(1L, 30L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.removeStaff(1L, 30L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAssignedStaff_resolvesNamesFromStaffProfile() {
        Account acc = new Account();
        acc.setId(30L);
        acc.setEmail("staff@x.y");
        EventStaff es = new EventStaff();
        es.setAccount(acc);
        when(eventStaffRepository.findByEvent_Id(1L)).thenReturn(List.of(es));
        Staff staff = new Staff();
        staff.setFullName("Staff S");
        staff.setDepartment("Org");
        when(staffRepository.findByAccount_Id(30L)).thenReturn(Optional.of(staff));

        var out = eventService.getAssignedStaff(1L);

        assertThat(out).hasSize(1);
        assertThat(out.get(0).fullName()).isEqualTo("Staff S");
    }

    // ---------- verifyStaffAccess ----------

    @Test
    void verifyStaffAccess_adminAlwaysAllowed() {
        Account admin = new Account();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);
        when(accountRepository.findByEmail("ad@x.y")).thenReturn(Optional.of(admin));

        assertThatCode(() -> eventService.verifyStaffAccess(1L, "ad@x.y")).doesNotThrowAnyException();
    }

    @Test
    void verifyStaffAccess_staffAllowedOnlyWhenAssigned() {
        Account staff = new Account();
        staff.setId(30L);
        staff.setRole(Role.STAFF);
        when(accountRepository.findByEmail("st@x.y")).thenReturn(Optional.of(staff));
        when(eventStaffRepository.existsByEvent_IdAndAccount_Id(1L, 30L)).thenReturn(true);

        assertThatCode(() -> eventService.verifyStaffAccess(1L, "st@x.y")).doesNotThrowAnyException();

        when(eventStaffRepository.existsByEvent_IdAndAccount_Id(1L, 30L)).thenReturn(false);
        assertThatThrownBy(() -> eventService.verifyStaffAccess(1L, "st@x.y"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    void verifyStaffAccess_otherRolesRejected() {
        Account sv = new Account();
        sv.setId(20L);
        sv.setRole(Role.STUDENT);
        when(accountRepository.findByEmail("sv@x.y")).thenReturn(Optional.of(sv));

        assertThatThrownBy(() -> eventService.verifyStaffAccess(1L, "sv@x.y"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Unauthorized role");
    }

    // ---------- resetEventData ----------

    @Test
    void resetEventData_wipesScoresSubmissionsAndRankings() {
        RoundRanking rr = new RoundRanking();
        rr.setId(9L);
        when(roundRankingRepository.findByRound_Event_Id(1L)).thenReturn(List.of(rr));
        Submission sub = new Submission();
        sub.setId(11L);
        when(submissionRepository.findByRoundRankingId(9L)).thenReturn(Optional.of(sub));
        when(scoreRepository.findBySubmissionId(11L)).thenReturn(List.of());

        eventService.resetEventData(1L);

        verify(submissionRepository).delete(sub);
        verify(roundRankingRepository).deleteAll(List.of(rr));
    }

    // ---------- getAssignedEvents ----------

    @Test
    void getAssignedEvents_mapsEventsForJudge() {
        Event e = event(1L, EventStatus.ONGOING);
        when(eventRepository.findEventsAssignedToJudgeByEmail("j@x.y")).thenReturn(List.of(e));
        when(teamRepository.countByEventId(1L)).thenReturn(5L);
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of());

        List<EventResponse> out = eventService.getAssignedEvents("j@x.y");

        assertThat(out).hasSize(1);
    }
}
