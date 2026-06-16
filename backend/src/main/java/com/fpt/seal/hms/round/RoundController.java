package com.fpt.seal.hms.round;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.round.dto.RoundRequest;
import com.fpt.seal.hms.round.dto.RoundResponse;
import com.fpt.seal.hms.round.dto.RoundStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RoundController {

    private final RoundService roundService;

    // Get all rounds for a specific event
    @GetMapping("/events/{eventId}/rounds")
    public ResponseEntity<ApiResponse<List<RoundResponse>>> getRoundsByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok(roundService.getRoundsByEventId(eventId)));
    }

    @GetMapping("/rounds/{id}")
    public ResponseEntity<ApiResponse<RoundResponse>> getRoundById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(roundService.getRoundById(id)));
    }

    @PostMapping("/events/{eventId}/rounds")
    public ResponseEntity<ApiResponse<RoundResponse>> createRound(
            @PathVariable Long eventId,
            @Valid @RequestBody RoundRequest request) {
        RoundResponse created = roundService.createRound(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Round created successfully", created));
    }

    @PutMapping("/rounds/{id}")
    public ResponseEntity<ApiResponse<RoundResponse>> updateRound(
            @PathVariable Long id,
            @Valid @RequestBody RoundRequest request) {
        RoundResponse updated = roundService.updateRound(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Round updated successfully", updated));
    }

    @PatchMapping("/rounds/{id}/status")
    public ResponseEntity<ApiResponse<RoundResponse>> updateRoundStatus(
            @PathVariable Long id,
            @Valid @RequestBody RoundStatusUpdateRequest request) {
        RoundResponse updated = roundService.updateRoundStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Round status updated successfully", updated));
    }

    @DeleteMapping("/rounds/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRound(@PathVariable Long id) {
        roundService.deleteRound(id);
        return ResponseEntity.ok(ApiResponse.ok("Round deleted successfully", null));
    }
}
