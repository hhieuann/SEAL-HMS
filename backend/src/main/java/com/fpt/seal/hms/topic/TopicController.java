package com.fpt.seal.hms.topic;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.topic.dto.TopicRequest;
import com.fpt.seal.hms.topic.dto.TopicResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    @GetMapping("/tracks/{trackId}/topics")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopicsByTrackId(@PathVariable Long trackId) {
        return ResponseEntity.ok(ApiResponse.ok(topicService.getTopicsByTrackId(trackId)));
    }

    @GetMapping("/events/{eventId}/topics")
    public ResponseEntity<ApiResponse<List<TopicResponse>>> getTopicsByEventId(@PathVariable Long eventId) {
        return ResponseEntity.ok(ApiResponse.ok(topicService.getTopicsByEventId(eventId)));
    }

    @GetMapping("/topics/{id}")
    public ResponseEntity<ApiResponse<TopicResponse>> getTopicById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(topicService.getTopicById(id)));
    }

    @PostMapping("/tracks/{trackId}/topics")
    public ResponseEntity<ApiResponse<TopicResponse>> createTopicUnderTrack(
            @PathVariable Long trackId,
            @Valid @RequestBody TopicRequest request) {
        TopicResponse created = topicService.createTopicUnderTrack(trackId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Topic created successfully", created));
    }

    @PostMapping("/events/{eventId}/topics")
    public ResponseEntity<ApiResponse<TopicResponse>> createTopicUnderEvent(
            @PathVariable Long eventId,
            @Valid @RequestBody TopicRequest request) {
        TopicResponse created = topicService.createTopicUnderEvent(eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Topic created successfully", created));
    }

    @PatchMapping("/topics/{id}/assign-track")
    public ResponseEntity<ApiResponse<Void>> assignTrack(
            @PathVariable Long id,
            @RequestParam Long trackId) {
        topicService.assignTrack(id, trackId);
        return ResponseEntity.ok(ApiResponse.ok("Topic assigned to track successfully", null));
    }

    @PutMapping("/topics/{id}")
    public ResponseEntity<ApiResponse<TopicResponse>> updateTopic(
            @PathVariable Long id,
            @Valid @RequestBody TopicRequest request) {
        TopicResponse updated = topicService.updateTopic(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Topic updated successfully", updated));
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTopic(@PathVariable Long id) {
        topicService.deleteTopic(id);
        return ResponseEntity.ok(ApiResponse.ok("Topic deleted successfully", null));
    }
}
