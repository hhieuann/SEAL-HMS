package com.fpt.seal.hms.criterion;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.criterion.dto.CriterionRequest;
import com.fpt.seal.hms.criterion.dto.CriterionResponse;
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
public class CriterionController {

    private final CriterionService criterionService;

    @GetMapping("/rounds/{roundId}/criteria")
    public ResponseEntity<ApiResponse<List<CriterionResponse>>> getCriteriaByRoundId(@PathVariable Long roundId) {
        return ResponseEntity.ok(ApiResponse.ok(criterionService.getCriteriaByRoundId(roundId)));
    }

    @GetMapping("/criteria/{id}")
    public ResponseEntity<ApiResponse<CriterionResponse>> getCriterionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(criterionService.getCriterionById(id)));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PostMapping("/rounds/{roundId}/criteria")
    public ResponseEntity<ApiResponse<CriterionResponse>> createCriterion(
            @PathVariable Long roundId,
            @Valid @RequestBody CriterionRequest request) {
        CriterionResponse created = criterionService.createCriterion(roundId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Criterion created successfully", created));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PutMapping("/criteria/{id}")
    public ResponseEntity<ApiResponse<CriterionResponse>> updateCriterion(
            @PathVariable Long id,
            @Valid @RequestBody CriterionRequest request) {
        CriterionResponse updated = criterionService.updateCriterion(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Criterion updated successfully", updated));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @DeleteMapping("/criteria/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCriterion(@PathVariable Long id) {
        criterionService.deleteCriterion(id);
        return ResponseEntity.ok(ApiResponse.ok("Criterion deleted successfully", null));
    }
}
