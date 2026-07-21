package com.fpt.seal.hms.trackassignment;

import com.fpt.seal.hms.common.enums.AssignmentRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TrackAssignmentRepository extends JpaRepository<TrackAssignment, Long> {

    List<TrackAssignment> findByTrack_Id(Long trackId);

    List<TrackAssignment> findByTrack_Event_Id(Long eventId);

    List<TrackAssignment> findByLecturer_Id(Long lecturerId);

    List<TrackAssignment> findByLecturer_Account_Email(String email);

    java.util.Optional<TrackAssignment> findByTrack_IdAndLecturer_Account_EmailAndRole(Long trackId, String email, AssignmentRole role);

    boolean existsByTrack_IdAndLecturer_IdAndRole(Long trackId, Long lecturerId, AssignmentRole role);

    @Query("SELECT a FROM TrackAssignment a WHERE a.track.event.id = :eventId")
    List<TrackAssignment> findByEventId(@Param("eventId") Long eventId);
}
