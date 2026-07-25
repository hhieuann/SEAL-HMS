package com.fpt.seal.hms.trackassignment;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.trackassignment.dto.ExpertAssignmentResponse;
import com.fpt.seal.hms.trackassignment.dto.TrackAssignmentRequest;
import com.fpt.seal.hms.trackassignment.dto.TrackAssignmentResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TrackAssignmentController {

    private final TrackAssignmentService assignmentService;

    /** Assign a lecturer (as JUDGE or MENTOR) to a track. Admin/Staff only. */
    @PostMapping("/api/v1/tracks/{trackId}/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<TrackAssignmentResponse> assign(
            @PathVariable Long trackId,
            @Valid @RequestBody TrackAssignmentRequest req) {
        return ApiResponse.ok("Assigned", assignmentService.assign(trackId, req));
    }

    /** List all assignments for a specific track. */
    @GetMapping("/api/v1/tracks/{trackId}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<List<TrackAssignmentResponse>> getByTrack(@PathVariable Long trackId) {
        return ApiResponse.ok(assignmentService.getByTrack(trackId));
    }

    /** List all assignments for all tracks in an event. */
    @GetMapping("/api/v1/events/{eventId}/assignments")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<List<TrackAssignmentResponse>> getByEvent(@PathVariable Long eventId) {
        return ApiResponse.ok(assignmentService.getByEvent(eventId));
    }

    @GetMapping("/api/v1/users/me/assignments")
    @PreAuthorize("hasRole('LECTURER')")
    public ApiResponse<List<ExpertAssignmentResponse>> getMyAssignments(
            org.springframework.security.core.Authentication auth) {
        return ApiResponse.ok(assignmentService.getExpertAssignments(auth.getName()));
    }

    /** Remove an assignment. */
    @DeleteMapping("/api/v1/track-assignments/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<Void> remove(@PathVariable Long assignmentId) {
        assignmentService.remove(assignmentId);
        return ApiResponse.ok("Assignment removed", null);
    }

    @PostMapping("/api/v1/tracks/{trackId}/complete-scoring")
    @PreAuthorize("hasRole('LECTURER')")
    public ApiResponse<Void> completeScoring(@PathVariable Long trackId, org.springframework.security.core.Authentication auth) {
        assignmentService.completeScoring(trackId, auth.getName());
        return ApiResponse.ok("Scoring completed for this track", null);
    }
}
