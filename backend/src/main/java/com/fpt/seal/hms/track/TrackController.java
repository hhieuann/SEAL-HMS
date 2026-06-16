package com.fpt.seal.hms.track;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.track.dto.TrackRequest;
import com.fpt.seal.hms.track.dto.TrackResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TrackController {

    private final TrackService trackService;

    @GetMapping("/events/{eventId}/tracks")
    public ResponseEntity<ApiResponse<List<TrackResponse>>> getTracksByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok(trackService.getTracksByEventId(eventId)));
    }

    @GetMapping("/tracks/{id}")
    public ResponseEntity<ApiResponse<TrackResponse>> getTrackById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(trackService.getTrackById(id)));
    }

    @PostMapping("/events/{eventId}/tracks")
    public ResponseEntity<ApiResponse<TrackResponse>> createTrack(
            @PathVariable Long eventId,
            @Valid @RequestBody TrackRequest request) {
        TrackResponse created = trackService.createTrack(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Track created successfully", created));
    }

    @PutMapping("/tracks/{id}")
    public ResponseEntity<ApiResponse<TrackResponse>> updateTrack(
            @PathVariable Long id,
            @Valid @RequestBody TrackRequest request) {
        TrackResponse updated = trackService.updateTrack(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Track updated successfully", updated));
    }

    @DeleteMapping("/tracks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTrack(@PathVariable Long id) {
        trackService.deleteTrack(id);
        return ResponseEntity.ok(ApiResponse.ok("Track deleted successfully", null));
    }
}
