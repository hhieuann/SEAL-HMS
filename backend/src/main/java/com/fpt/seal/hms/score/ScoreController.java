package com.fpt.seal.hms.score;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.score.dto.GradeSubmissionRequest;
import com.fpt.seal.hms.score.dto.ScoreResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/submissions/{submissionId}/scores")
@RequiredArgsConstructor
public class ScoreController {

    private final ScoreService scoreService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> getScores(
            @PathVariable Long submissionId) {
        return ResponseEntity.ok(ApiResponse.ok(scoreService.getScoresForSubmission(submissionId)));
    }

    @GetMapping("/judge/{judgeAccountId}")
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> getScoresByJudge(
            @PathVariable Long submissionId,
            @PathVariable Long judgeAccountId) {
        return ResponseEntity.ok(ApiResponse.ok(scoreService.getScoresByJudge(submissionId, judgeAccountId)));
    }

    @PostMapping("/grade")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<ApiResponse<List<ScoreResponse>>> grade(
            @PathVariable Long submissionId,
            @RequestBody GradeSubmissionRequest request,
            org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Graded successfully",
                scoreService.gradeSubmission(submissionId, request, authentication.getName())));
    }
}
