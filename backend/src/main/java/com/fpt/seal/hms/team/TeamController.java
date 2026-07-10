package com.fpt.seal.hms.team;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.team.dto.TeamRequest;
import com.fpt.seal.hms.team.dto.TeamResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @GetMapping("/events/{eventId}/teams")
    public ResponseEntity<ApiResponse<java.util.List<TeamResponse>>> getTeamsByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getTeamsByEventId(eventId)));
    }

    @GetMapping("/teams/{id}")
    public ResponseEntity<ApiResponse<TeamResponse>> getTeamById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(teamService.getTeamById(id)));
    }

    @PostMapping("/events/{eventId}/teams")
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            @PathVariable Long eventId,
            @Valid @RequestBody TeamRequest request) {
        TeamResponse created = teamService.createTeam(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Team created successfully", created));
    }

    // Endpoint for Admin/Staff to trigger random track assignment
    @PostMapping("/teams/{id}/random-assign")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<TeamResponse>> assignRandomTrack(
            @PathVariable Long id,
            @RequestParam Long eventId) {
        TeamResponse updated = teamService.assignRandomTrackAndTopic(id, eventId);
        return ResponseEntity.ok(ApiResponse.ok("Team assigned to random track and topic successfully", updated));
    }

    @PatchMapping("/teams/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<TeamResponse>> updateTeamStatus(
            @PathVariable Long id,
            @Valid @RequestBody com.fpt.seal.hms.team.dto.TeamStatusUpdateRequest request) {
        TeamResponse updated = teamService.updateTeamStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Team status updated successfully", updated));
    }
    @PatchMapping("/teams/{id}/assign-track")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<TeamResponse>> assignTrack(
            @PathVariable Long id,
            @RequestParam Long trackId) {
        TeamResponse updated = teamService.assignTrack(id, trackId);
        return ResponseEntity.ok(ApiResponse.ok("Track assigned successfully", updated));
    }
}
