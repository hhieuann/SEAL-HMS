package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.roundranking.dto.EventStandingDto;
import com.fpt.seal.hms.roundranking.dto.RoundStandingDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    // --- Round level ---

    @GetMapping("/rounds/{roundId}/standings")
    public ResponseEntity<ApiResponse<List<RoundStandingDto>>> roundStandings(@PathVariable Long roundId) {
        return ResponseEntity.ok(ApiResponse.ok(rankingService.getRoundStandings(roundId)));
    }

    @PostMapping("/rounds/{roundId}/ranking/compute")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<List<RoundStandingDto>>> computeRoundRanking(
            @PathVariable Long roundId,
            @RequestBody(required = false) List<Long> promotedTeamIds) {
        return ResponseEntity.ok(ApiResponse.ok("Round ranking computed", rankingService.computeRoundRanking(roundId, promotedTeamIds)));
    }

    // --- Event level ---

    @GetMapping("/events/{eventId}/standings")
    public ResponseEntity<ApiResponse<List<EventStandingDto>>> eventStandings(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok(rankingService.getEventStandings(eventId)));
    }

    @PostMapping("/events/{eventId}/ranking/compute")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<List<EventStandingDto>>> computeEventRanking(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok("Event ranking computed", rankingService.computeEventRanking(eventId)));
    }
}
