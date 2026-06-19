package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.roundranking.entity.RoundRanking;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/rounds/{roundId}/standings")
@RequiredArgsConstructor
public class RoundRankingController {

    private final RoundRankingRepository roundRankingRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStandings(@PathVariable Long roundId) {
        List<RoundRanking> standings = roundRankingRepository.findByRoundId(roundId);
        List<Map<String, Object>> result = standings.stream().map(rr -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("roundRankingId", rr.getId());
            m.put("teamId", rr.getTeam().getId());
            m.put("teamName", rr.getTeam().getName());
            m.put("trackId", rr.getTeam().getTrack() != null ? rr.getTeam().getTrack().getId() : null);
            m.put("trackName", rr.getTeam().getTrack() != null ? rr.getTeam().getTrack().getName() : null);
            m.put("score", rr.getScore());
            m.put("rank", rr.getRank());
            m.put("isPromoted", rr.getIsPromoted());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
