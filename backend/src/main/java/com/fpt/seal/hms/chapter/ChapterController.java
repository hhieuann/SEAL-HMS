package com.fpt.seal.hms.chapter;

import com.fpt.seal.hms.chapter.dto.ChapterLeaderboardEntry;
import com.fpt.seal.hms.chapter.dto.ChapterRequest;
import com.fpt.seal.hms.chapter.dto.ChapterResponse;
import com.fpt.seal.hms.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chapters")
@RequiredArgsConstructor
public class ChapterController {

    private final ChapterService chapterService;

    /** List chapters — used by the team-creation chapter dropdown (any authenticated user). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChapterResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(chapterService.listChapters()));
    }

    /** Year-long Chapter Leaderboard — visible to every logged-in user (all students). */
    @GetMapping("/leaderboard")
    public ResponseEntity<ApiResponse<List<ChapterLeaderboardEntry>>> leaderboard() {
        return ResponseEntity.ok(ApiResponse.ok(chapterService.getLeaderboard()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<ChapterResponse>> create(@Valid @RequestBody ChapterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Chapter created", chapterService.createChapter(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<ChapterResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ChapterRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Chapter updated", chapterService.updateChapter(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        chapterService.deleteChapter(id);
        return ResponseEntity.ok(ApiResponse.ok("Chapter deleted", null));
    }
}
