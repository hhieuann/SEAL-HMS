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

    // Optional: the leader is normally the authenticated user. Only ADMIN/STAFF may set
    // this to create a team on a student's behalf — a student's value is ignored.
    private Long leaderAccountId;
}
