package com.fpt.seal.hms.announcement;

import com.fpt.seal.hms.announcement.dto.AnnouncementRequest;
import com.fpt.seal.hms.announcement.dto.AnnouncementResponse;
import com.fpt.seal.hms.announcement.entity.Announcement;
import com.fpt.seal.hms.auditlog.AuditLogService;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.event.EventRepository;
import com.fpt.seal.hms.trackassignment.TrackAssignmentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AnnouncementServiceTest {

    @Mock private AnnouncementRepository announcementRepository;
    @Mock private EventRepository eventRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private TrackAssignmentRepository trackAssignmentRepository;
    @InjectMocks private AnnouncementService service;

    private Authentication authWith(String email, String role) {
        return new UsernamePasswordAuthenticationToken(email, "x",
                List.of(new SimpleGrantedAuthority(role)));
    }

    private Announcement announcement(long id, String title, String targetRole) {
        Announcement a = new Announcement();
        a.setId(id);
        a.setTitle(title);
        a.setTargetRole(targetRole);
        return a;
    }

    // ---------- create ----------

    @Test
    void create_defaultsTargetRoleToAll_andAuditLogs() {
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> {
            Announcement a = inv.getArgument(0);
            a.setId(1L);
            return a;
        });

        AnnouncementResponse res = service.create("admin@seal-hms.local",
                new AnnouncementRequest("Welcome", "Body", null, null));

        assertThat(res.title()).isEqualTo("Welcome");
        assertThat(res.targetRole()).isEqualTo("ALL"); // null -> ALL
        verify(auditLogService).log(eq("ANNOUNCEMENT_CREATED"), eq("announcement"), eq(1L), any());
    }

    @Test
    void create_keepsExplicitTargetRole() {
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

        AnnouncementResponse res = service.create("admin@seal-hms.local",
                new AnnouncementRequest("For judges", "Body", null, "JUDGE"));

        assertThat(res.targetRole()).isEqualTo("JUDGE");
    }

    @Test
    void create_globalAnnouncement_resolvesNullEvent() {
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

        AnnouncementResponse res = service.create("admin@seal-hms.local",
                new AnnouncementRequest("Global", "Body", null, null));

        assertThat(res.eventId()).isNull();
        verify(eventRepository, never()).findById(any());
    }

    // ---------- list / role filter ----------

    @Test
    void list_asAdmin_returnsEverything_noFiltering() {
        when(announcementRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                announcement(1L, "All", "ALL"),
                announcement(2L, "Students", "STUDENT"),
                announcement(3L, "Judges", "JUDGE")));

        List<AnnouncementResponse> res = service.list(null, authWith("admin@seal-hms.local", "ROLE_ADMIN"));

        assertThat(res).hasSize(3);
    }

    @Test
    void list_asStudent_seesOnlyAllAndStudentTargeted() {
        when(announcementRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                announcement(1L, "All", "ALL"),
                announcement(2L, "Students", "STUDENT"),
                announcement(3L, "Judges", "JUDGE")));

        List<AnnouncementResponse> res = service.list(null, authWith("sv@fpt.edu.vn", "ROLE_STUDENT"));

        assertThat(res).extracting(AnnouncementResponse::title)
                .containsExactly("All", "Students"); // JUDGE-targeted one filtered out
    }

    @Test
    void list_withEventId_usesEventScopedQuery() {
        when(announcementRepository.findByEventIdOrEventIsNullOrderByCreatedAtDesc(5L))
                .thenReturn(List.of(announcement(1L, "Event notice", "ALL")));

        List<AnnouncementResponse> res = service.list(5L, authWith("sv@fpt.edu.vn", "ROLE_STUDENT"));

        assertThat(res).hasSize(1);
        verify(announcementRepository).findByEventIdOrEventIsNullOrderByCreatedAtDesc(5L);
    }

    // ---------- update / delete ----------

    @Test
    void update_changesFields_andAuditLogs() {
        Announcement a = announcement(1L, "Old", "ALL");
        when(announcementRepository.findById(1L)).thenReturn(java.util.Optional.of(a));

        AnnouncementResponse res = service.update(1L, new AnnouncementRequest("New", "Body", null, "ALL"));

        assertThat(res.title()).isEqualTo("New");
        verify(auditLogService).log(eq("ANNOUNCEMENT_UPDATED"), eq("announcement"), eq(1L), any());
    }

    @Test
    void update_throws_whenMissing() {
        when(announcementRepository.findById(9L)).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> service.update(9L, new AnnouncementRequest("x", "y", null, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_removesAndAuditLogs() {
        when(announcementRepository.existsById(1L)).thenReturn(true);

        service.delete(1L);

        verify(announcementRepository).deleteById(1L);
        verify(auditLogService).log(eq("ANNOUNCEMENT_DELETED"), eq("announcement"), eq(1L), any());
    }

    @Test
    void delete_throws_whenMissing() {
        when(announcementRepository.existsById(9L)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(9L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(announcementRepository, never()).deleteById(any());
    }

    @Test
    void list_asLecturerMentor_seesMentorTargeted_forAssignedEvent() {
        when(announcementRepository.findByEventIdOrEventIsNullOrderByCreatedAtDesc(5L)).thenReturn(List.of(
                announcement(1L, "For mentors", "MENTOR"),
                announcement(2L, "For judges", "JUDGE")));

        var track = new com.fpt.seal.hms.track.entity.Track();
        var event = new com.fpt.seal.hms.event.entity.Event();
        event.setId(5L);
        track.setEvent(event);
        var assignment = new com.fpt.seal.hms.trackassignment.TrackAssignment();
        assignment.setTrack(track);
        assignment.setRole(com.fpt.seal.hms.common.enums.AssignmentRole.MENTOR);
        when(trackAssignmentRepository.findByLecturer_Account_Email("lect@fpt.edu.vn"))
                .thenReturn(List.of(assignment));

        List<AnnouncementResponse> res = service.list(5L, authWith("lect@fpt.edu.vn", "ROLE_LECTURER"));

        // Mentor of this event sees MENTOR-targeted but not JUDGE-targeted
        assertThat(res).extracting(AnnouncementResponse::title).containsExactly("For mentors");
    }

    @Test
    void list_asLecturer_seesLecturerTargeted_regardlessOfAssignments() {
        when(announcementRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                announcement(1L, "For lecturers", "LECTURER"),
                announcement(2L, "Students only", "STUDENT")));

        List<AnnouncementResponse> res = service.list(null, authWith("lect@fpt.edu.vn", "ROLE_LECTURER"));

        assertThat(res).extracting(AnnouncementResponse::title).containsExactly("For lecturers");
    }

    @Test
    void list_asGuestJudge_seesJudgeTargeted() {
        when(announcementRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                announcement(1L, "For judges", "JUDGE"),
                announcement(2L, "Students only", "STUDENT"),
                announcement(3L, "Everyone", "ALL")));

        List<AnnouncementResponse> res = service.list(null, authWith("gj@fpt.edu.vn", "ROLE_GUEST_JUDGE"));

        assertThat(res).extracting(AnnouncementResponse::title).containsExactly("For judges", "Everyone");
    }

    @Test
    void list_nullTargetRole_treatedAsAll() {
        when(announcementRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                announcement(1L, "No target", null)));

        List<AnnouncementResponse> res = service.list(null, authWith("sv@fpt.edu.vn", "ROLE_STUDENT"));

        assertThat(res).hasSize(1); // null targetRole visible to everyone
    }

    @Test
    void list_asLecturer_withoutEventId_doesNotMatchMentorJudgeTargeted() {
        when(announcementRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(
                announcement(1L, "Mentor notice", "MENTOR")));

        // eventId null -> lecturer assignment check is skipped -> MENTOR-targeted filtered out
        List<AnnouncementResponse> res = service.list(null, authWith("lect@fpt.edu.vn", "ROLE_LECTURER"));

        assertThat(res).isEmpty();
    }

    @Test
    void list_asLecturerJudge_seesJudgeTargeted_forAssignedEvent() {
        when(announcementRepository.findByEventIdOrEventIsNullOrderByCreatedAtDesc(5L)).thenReturn(List.of(
                announcement(1L, "For judges", "JUDGE")));
        var track = new com.fpt.seal.hms.track.entity.Track();
        var event = new com.fpt.seal.hms.event.entity.Event();
        event.setId(5L);
        track.setEvent(event);
        var assignment = new com.fpt.seal.hms.trackassignment.TrackAssignment();
        assignment.setTrack(track);
        assignment.setRole(com.fpt.seal.hms.common.enums.AssignmentRole.JUDGE);
        when(trackAssignmentRepository.findByLecturer_Account_Email("lect@fpt.edu.vn"))
                .thenReturn(List.of(assignment));

        List<AnnouncementResponse> res = service.list(5L, authWith("lect@fpt.edu.vn", "ROLE_LECTURER"));

        assertThat(res).extracting(AnnouncementResponse::title).containsExactly("For judges");
    }

    @Test
    void create_withEventId_bindsEvent_orThrowsWhenMissing() {
        var event = new com.fpt.seal.hms.event.entity.Event();
        event.setId(5L);
        when(eventRepository.findById(5L)).thenReturn(java.util.Optional.of(event));
        when(announcementRepository.save(any(Announcement.class))).thenAnswer(inv -> inv.getArgument(0));

        AnnouncementResponse res = service.create("a@b.c", new AnnouncementRequest("T", "B", 5L, null));
        assertThat(res.eventId()).isEqualTo(5L);

        when(eventRepository.findById(9L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.create("a@b.c", new AnnouncementRequest("T", "B", 9L, null)))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
