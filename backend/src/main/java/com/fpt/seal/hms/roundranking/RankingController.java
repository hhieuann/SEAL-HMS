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

    /**
     * Rank the round and promote the top N by score. Send a body only to break a tie that this
     * call has already rejected — see {@link com.fpt.seal.hms.roundranking.dto.TieBreakRequest}.
     */
    @PostMapping("/rounds/{roundId}/ranking/compute")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<List<RoundStandingDto>>> computeRoundRanking(
            @PathVariable Long roundId,
            @RequestBody(required = false) com.fpt.seal.hms.roundranking.dto.TieBreakRequest tieBreak) {
        List<RoundStandingDto> standings = rankingService.computeRoundRanking(
                roundId,
                tieBreak != null ? tieBreak.teamIds() : null,
                tieBreak != null ? tieBreak.reason() : null);
        return ResponseEntity.ok(ApiResponse.ok("Round ranking computed", standings));
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
