package com.fpt.seal.hms.trackassignment.dto;

import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.trackassignment.TrackAssignment;

import java.time.LocalDateTime;

public record TrackAssignmentResponse(
        Long id,
        Long trackId,
        String trackName,
        Long lecturerId,
        String lecturerFullName,
        String lecturerEmail,
        String department,
        AssignmentRole role,
        LocalDateTime createdAt) {

    public static TrackAssignmentResponse from(TrackAssignment a) {
        return new TrackAssignmentResponse(
                a.getId(),
                a.getTrack().getId(),
                a.getTrack().getName(),
                a.getLecturer().getId(),
                a.getLecturer().getFullName(),
                a.getLecturer().getAccount().getEmail(),
                a.getLecturer().getDepartment(),
                a.getRole(),
                a.getCreatedAt());
    }
}
