package com.fpt.seal.hms.prize;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.prize.dto.PrizeRequest;
import com.fpt.seal.hms.prize.dto.PrizeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PrizeController {

    private final PrizeService prizeService;

    @GetMapping("/events/{eventId}/prizes")
    public ResponseEntity<ApiResponse<List<PrizeResponse>>> getPrizes(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok(prizeService.getPrizesByEvent(eventId)));
    }

    @PostMapping("/events/{eventId}/prizes")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<PrizeResponse>> createPrize(
            @PathVariable Long eventId,
            @Valid @RequestBody PrizeRequest request) {
        PrizeResponse created = prizeService.createPrize(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Prize created", created));
    }

    /** Auto-award all ranked prizes of the event from the current event ranking. */
    @PostMapping("/events/{eventId}/prizes/award")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<List<PrizeResponse>>> awardByRanking(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok("Prizes awarded by ranking", prizeService.awardByRanking(eventId)));
    }

    /** Manually award a single prize to a team. */
    @PatchMapping("/prizes/{prizeId}/award")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<PrizeResponse>> awardPrize(
            @PathVariable Long prizeId,
            @RequestParam Long teamId) {
        return ResponseEntity.ok(ApiResponse.ok("Prize awarded", prizeService.awardPrize(prizeId, teamId)));
    }

    @DeleteMapping("/prizes/{prizeId}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<Void>> deletePrize(@PathVariable Long prizeId) {
        prizeService.deletePrize(prizeId);
        return ResponseEntity.ok(ApiResponse.ok("Prize deleted", null));
    }
}
