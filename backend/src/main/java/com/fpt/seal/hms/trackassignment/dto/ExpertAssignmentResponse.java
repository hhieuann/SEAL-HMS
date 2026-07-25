package com.fpt.seal.hms.trackassignment.dto;

import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.team.entity.Team;
import com.fpt.seal.hms.trackassignment.TrackAssignment;

/**
 * A lecturer responsibility exposed to the expert dashboard.
 * Judges are assigned to tracks; mentors are assigned to teams.
 */
public record ExpertAssignmentResponse(
        String id,
        Long eventId,
        String eventName,
        Long trackId,
        String trackName,
        Long teamId,
        String teamName,
        AssignmentRole role,
        Boolean scoringCompleted) {

    public static ExpertAssignmentResponse fromJudge(TrackAssignment assignment) {
        var track = assignment.getTrack();
        var event = track.getEvent();
        return new ExpertAssignmentResponse(
                "JUDGE-" + assignment.getId(),
                event.getId(),
                event.getName(),
                track.getId(),
                track.getName(),
                null,
                null,
                AssignmentRole.JUDGE,
                assignment.getScoringCompleted());
    }

    public static ExpertAssignmentResponse fromMentor(Team team) {
        var track = team.getTrack();
        var event = team.getEvent();
        return new ExpertAssignmentResponse(
                "MENTOR-" + team.getId(),
                event.getId(),
                event.getName(),
                track != null ? track.getId() : null,
                track != null ? track.getName() : null,
                team.getId(),
                team.getName(),
                AssignmentRole.MENTOR,
                null);
    }
}
