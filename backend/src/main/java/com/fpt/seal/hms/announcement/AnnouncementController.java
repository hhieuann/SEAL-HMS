package com.fpt.seal.hms.announcement;

import com.fpt.seal.hms.announcement.dto.AnnouncementRequest;
import com.fpt.seal.hms.announcement.dto.AnnouncementResponse;
import com.fpt.seal.hms.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    /** All notices; with ?eventId= returns that event's notices plus global ones. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> list(
            Authentication auth,
            @RequestParam(required = false) Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok(announcementService.list(eventId, auth)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> create(
            Authentication auth,
            @Valid @RequestBody AnnouncementRequest request) {
        
        boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
        if (isStaff) {
            String target = request.targetRole() != null ? request.targetRole().toUpperCase() : "ALL";
            if (target.equals("ALL") || target.equals("STAFF") || target.equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Staff can only send announcements to Student, Lecturer, Judge, and Mentor roles."));
            }
        }

        AnnouncementResponse created = announcementService.create(auth.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Announcement created", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> update(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequest request) {
        
        boolean isStaff = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
        if (isStaff) {
            String target = request.targetRole() != null ? request.targetRole().toUpperCase() : "ALL";
            if (target.equals("ALL") || target.equals("STAFF") || target.equals("ADMIN")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(ApiResponse.error("Staff can only send announcements to Student, Lecturer, Judge, and Mentor roles."));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok("Announcement updated", announcementService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        announcementService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok("Announcement deleted", null));
    }
}
