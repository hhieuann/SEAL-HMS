package com.fpt.seal.hms.team.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MentorMessageDto {
    private Long id;
    private Long teamId;
    private Long senderId;
    private String senderName;
    private String senderRole;
    private String message;
    private LocalDateTime createdAt;
}
