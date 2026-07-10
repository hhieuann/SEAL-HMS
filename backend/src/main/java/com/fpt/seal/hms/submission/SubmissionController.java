package com.fpt.seal.hms.submission;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.submission.dto.SubmissionRequest;
import com.fpt.seal.hms.submission.dto.SubmissionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/rounds/{roundId}/teams/{teamId}/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @GetMapping
    public ResponseEntity<ApiResponse<SubmissionResponse>> getSubmission(
            @PathVariable Long roundId,
            @PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.ok(submissionService.getSubmission(roundId, teamId)));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
    public ResponseEntity<ApiResponse<SubmissionResponse>> upsertSubmission(
            @PathVariable Long roundId,
            @PathVariable Long teamId,
            @Valid @RequestBody SubmissionRequest request) {
        SubmissionResponse response = submissionService.upsertSubmission(roundId, teamId, request);
        return ResponseEntity.ok(ApiResponse.ok("Submission saved successfully", response));
    }
}
