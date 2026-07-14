package com.fpt.seal.hms.trackassignment;

import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.track.TrackRepository;
import com.fpt.seal.hms.track.entity.Track;
import com.fpt.seal.hms.trackassignment.dto.TrackAssignmentRequest;
import com.fpt.seal.hms.trackassignment.dto.TrackAssignmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrackAssignmentService {

    private final TrackAssignmentRepository assignmentRepository;
    private final TrackRepository trackRepository;
    private final LecturerRepository lecturerRepository;
    private final com.fpt.seal.hms.team.TeamRepository teamRepository;

    @Transactional
    public TrackAssignmentResponse assign(Long trackId, TrackAssignmentRequest req) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found: " + trackId));

        Lecturer lecturer = lecturerRepository.findById(req.lecturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found: " + req.lecturerId()));

        if (assignmentRepository.existsByTrack_IdAndLecturer_IdAndRole(trackId, req.lecturerId(), req.role())) {
            throw new BusinessException("This lecturer is already assigned as " + req.role() + " for this track");
        }

        if (req.role() == com.fpt.seal.hms.common.enums.AssignmentRole.MENTOR) {
            throw new BusinessException("Mentors are assigned to Teams, not Tracks.");
        }
        
        // VALIDATION: If assigning a JUDGE, check if the Lecturer is already a MENTOR for any Team in this track
        if (req.role() == com.fpt.seal.hms.common.enums.AssignmentRole.JUDGE) {
            boolean isMentor = teamRepository.existsByTrack_IdAndMentor_Id(trackId, req.lecturerId());
            if (isMentor) {
                throw new BusinessException("This lecturer is already a Mentor for a team in this track. They cannot also be a Judge.");
            }
        }

        TrackAssignment assignment = new TrackAssignment();
        assignment.setTrack(track);
        assignment.setLecturer(lecturer);
        assignment.setRole(req.role());

        return TrackAssignmentResponse.from(assignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<TrackAssignmentResponse> getByTrack(Long trackId) {
        return assignmentRepository.findByTrack_Id(trackId).stream()
                .map(TrackAssignmentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TrackAssignmentResponse> getByEvent(Long eventId) {
        return assignmentRepository.findByEventId(eventId).stream()
                .map(TrackAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TrackAssignmentResponse> getByLecturerEmail(String email) {
        return assignmentRepository.findByLecturer_Account_Email(email).stream()
                .map(TrackAssignmentResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public void remove(Long assignmentId) {
        if (!assignmentRepository.existsById(assignmentId)) {
            throw new ResourceNotFoundException("Assignment not found: " + assignmentId);
        }
        assignmentRepository.deleteById(assignmentId);
    }
}
