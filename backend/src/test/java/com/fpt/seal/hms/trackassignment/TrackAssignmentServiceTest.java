package com.fpt.seal.hms.trackassignment;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.team.TeamRepository;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.dto.TrackAssignmentRequest;
import com.fpt.seal.hms.trackassignment.dto.TrackAssignmentResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrackAssignmentServiceTest {

    @Mock private TrackAssignmentRepository assignmentRepository;
    @Mock private TrackRepository trackRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private TeamRepository teamRepository;
    @InjectMocks private TrackAssignmentService service;

    private Track track(long id) {
        Track t = new Track();
        t.setId(id);
        t.setName("AI");
        return t;
    }

    private Lecturer lecturer(long id) {
        Account acc = new Account();
        acc.setId(100L);
        acc.setEmail("judge@fpt.edu.vn");
        Lecturer l = new Lecturer();
        l.setId(id);
        l.setFullName("Judge A");
        l.setAccount(acc);
        return l;
    }

    private TrackAssignmentRequest req(AssignmentRole role) {
        return new TrackAssignmentRequest(5L, role);
    }

    @Test
    void assign_judge_persists_whenNoConflict() {
        when(trackRepository.findById(3L)).thenReturn(Optional.of(track(3L)));
        when(lecturerRepository.findById(5L)).thenReturn(Optional.of(lecturer(5L)));
        when(assignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(3L, 5L, AssignmentRole.JUDGE)).thenReturn(false);
        when(teamRepository.existsByTrack_IdAndMentor_Id(3L, 5L)).thenReturn(false);
        when(assignmentRepository.save(any(TrackAssignment.class))).thenAnswer(inv -> {
            TrackAssignment a = inv.getArgument(0);
            a.setId(9L);
            return a;
        });

        TrackAssignmentResponse res = service.assign(3L, req(AssignmentRole.JUDGE));

        assertThat(res.role()).isEqualTo(AssignmentRole.JUDGE);
        assertThat(res.trackId()).isEqualTo(3L);
    }

    @Test
    void assign_throws_whenAlreadyAssignedSameRole() {
        when(trackRepository.findById(3L)).thenReturn(Optional.of(track(3L)));
        when(lecturerRepository.findById(5L)).thenReturn(Optional.of(lecturer(5L)));
        when(assignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(3L, 5L, AssignmentRole.JUDGE)).thenReturn(true);

        assertThatThrownBy(() -> service.assign(3L, req(AssignmentRole.JUDGE)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already assigned");
        verify(assignmentRepository, never()).save(any());
    }

    @Test
    void assign_mentorRole_rejected_mentorsGoOnTeams() {
        when(trackRepository.findById(3L)).thenReturn(Optional.of(track(3L)));
        when(lecturerRepository.findById(5L)).thenReturn(Optional.of(lecturer(5L)));
        when(assignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(3L, 5L, AssignmentRole.MENTOR)).thenReturn(false);

        assertThatThrownBy(() -> service.assign(3L, req(AssignmentRole.MENTOR)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Mentors are assigned to Teams");
    }

    @Test
    void assign_judge_rejected_whenAlreadyMentorOfTeamInTrack() {
        when(trackRepository.findById(3L)).thenReturn(Optional.of(track(3L)));
        when(lecturerRepository.findById(5L)).thenReturn(Optional.of(lecturer(5L)));
        when(assignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(3L, 5L, AssignmentRole.JUDGE)).thenReturn(false);
        when(teamRepository.existsByTrack_IdAndMentor_Id(3L, 5L)).thenReturn(true); // conflict

        assertThatThrownBy(() -> service.assign(3L, req(AssignmentRole.JUDGE)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cannot also be a Judge");
    }

    @Test
    void assign_throws_whenTrackMissing() {
        when(trackRepository.findById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assign(3L, req(AssignmentRole.JUDGE)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void remove_throws_whenMissing() {
        when(assignmentRepository.existsById(9L)).thenReturn(false);

        assertThatThrownBy(() -> service.remove(9L))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(assignmentRepository, never()).deleteById(any());
    }

    @Test
    void completeScoring_setsFlag() {
        TrackAssignment a = new TrackAssignment();
        a.setId(9L);
        a.setScoringCompleted(false);
        when(assignmentRepository.findByTrack_IdAndLecturer_Account_EmailAndRole(3L, "judge@fpt.edu.vn", AssignmentRole.JUDGE))
                .thenReturn(Optional.of(a));

        service.completeScoring(3L, "judge@fpt.edu.vn");

        assertThat(a.getScoringCompleted()).isTrue();
        verify(assignmentRepository).save(a);
    }

    @Test
    void completeScoring_throws_whenNoJudgeAssignment() {
        when(assignmentRepository.findByTrack_IdAndLecturer_Account_EmailAndRole(3L, "x@y.z", AssignmentRole.JUDGE))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.completeScoring(3L, "x@y.z"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assign_throws_whenLecturerMissing() {
        when(trackRepository.findById(3L)).thenReturn(Optional.of(track(3L)));
        when(lecturerRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assign(3L, req(AssignmentRole.JUDGE)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void remove_deletes_whenFound() {
        when(assignmentRepository.existsById(9L)).thenReturn(true);

        service.remove(9L);

        verify(assignmentRepository).deleteById(9L);
    }

    @Test
    void readMethods_mapAssignments() {
        TrackAssignment a = new TrackAssignment();
        a.setId(9L);
        a.setTrack(track(3L));
        a.setLecturer(lecturer(5L));
        a.setRole(AssignmentRole.JUDGE);
        when(assignmentRepository.findByTrack_Id(3L)).thenReturn(java.util.List.of(a));
        when(assignmentRepository.findByEventId(1L)).thenReturn(java.util.List.of(a));
        when(assignmentRepository.findByLecturer_Account_Email("judge@fpt.edu.vn")).thenReturn(java.util.List.of(a));

        assertThat(service.getByTrack(3L)).hasSize(1);
        assertThat(service.getByEvent(1L)).hasSize(1);
        assertThat(service.getByLecturerEmail("judge@fpt.edu.vn")).hasSize(1);
    }
}
