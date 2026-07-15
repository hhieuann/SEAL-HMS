package com.fpt.seal.hms.announcement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** eventId null = global announcement. */
public record AnnouncementRequest(
        @NotBlank(message = "Title is required") @Size(max = 200) String title,
        String content,
        Long eventId,
        String targetRole) {
}
