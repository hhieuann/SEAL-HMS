package com.fpt.seal.hms.team.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MentorMessageRequest {
    @NotBlank(message = "Message cannot be blank")
    private String message;
}
