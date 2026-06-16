package com.fpt.seal.hms.team.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamRequest {

    @NotNull(message = "Team name is required")
    @Size(max = 150, message = "Team name must be at most 150 characters")
    private String name;

    private Long chapterId;

    @NotNull(message = "Leader Account ID is required to create a team")
    private Long leaderAccountId;
}
