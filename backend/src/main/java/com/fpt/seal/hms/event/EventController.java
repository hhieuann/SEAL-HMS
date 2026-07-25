package com.fpt.seal.hms.event;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.event.dto.EventRequest;
import com.fpt.seal.hms.event.dto.EventResponse;
import com.fpt.seal.hms.event.dto.EventStatusUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAllEvents() {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getAllEvents()));
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('LECTURER', 'STAFF')")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAssignedEvents(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getAssignedEvents(auth.getName())));
    }

    @GetMapping("/debug/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> getEventByIdDebug(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getEventById(id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(eventService.getEventById(id)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(@Valid @RequestBody EventRequest request) {
        EventResponse created = eventService.createEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Event created successfully", created));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventRequest request,
            Authentication auth) {
        eventService.verifyStaffAccess(id, auth.getName());
        EventResponse updated = eventService.updateEvent(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Event updated successfully", updated));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EventResponse>> updateEventStatus(
            @PathVariable Long id,
            @Valid @RequestBody EventStatusUpdateRequest request,
            Authentication auth) {
        eventService.verifyStaffAccess(id, auth.getName());
        EventResponse updated = eventService.updateEventStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Event status updated successfully", updated));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<EventResponse>> cancelEvent(@PathVariable Long id) {
        EventResponse cancelled = eventService.cancelEvent(id);
        return ResponseEntity.ok(ApiResponse.ok("Event cancelled successfully", cancelled));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.ok("Event deleted successfully", null));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/staff")
    public ApiResponse<Void> assignStaff(@PathVariable Long id, @RequestBody java.util.Map<String, Long> payload) {
        Long accountId = payload.get("accountId");
        if (accountId == null) {
            throw new com.fpt.seal.hms.common.exception.BusinessException("accountId is required");
        }
        eventService.assignStaff(id, accountId);
        return ApiResponse.ok("Staff assigned successfully", null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}/staff/{accountId}")
    public ApiResponse<Void> removeStaff(@PathVariable Long id, @PathVariable Long accountId) {
        eventService.removeStaff(id, accountId);
        return ApiResponse.ok("Staff removed successfully", null);
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @GetMapping("/{id}/staff")
    public ApiResponse<java.util.List<com.fpt.seal.hms.event.dto.EventStaffResponse>> getAssignedStaff(@PathVariable Long id) {
        return ApiResponse.ok(eventService.getAssignedStaff(id));
    }

    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    @DeleteMapping("/{id}/reset-data")
    public ResponseEntity<ApiResponse<Void>> resetEventData(@PathVariable Long id) {
        eventService.resetEventData(id);
        return ResponseEntity.ok(ApiResponse.ok("Event data (submissions and scores) have been reset successfully.", null));
    }
}
