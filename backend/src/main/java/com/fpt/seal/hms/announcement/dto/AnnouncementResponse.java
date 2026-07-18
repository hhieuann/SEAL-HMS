package com.fpt.seal.hms.announcement.dto;

import com.fpt.seal.hms.announcement.entity.Announcement;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        Long eventId,
        String eventName,
        String title,
        String content,
        String createdByEmail,
        String targetRole,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static AnnouncementResponse from(Announcement a) {
        return new AnnouncementResponse(
                a.getId(),
                a.getEvent() != null ? a.getEvent().getId() : null,
                a.getEvent() != null ? a.getEvent().getName() : null,
                a.getTitle(),
                a.getContent(),
                a.getCreatedByEmail(),
                a.getTargetRole(),
                a.getCreatedAt(),
                a.getUpdatedAt());
    }
}
