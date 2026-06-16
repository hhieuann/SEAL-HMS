package com.fpt.seal.hms.teammember.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamMemberRequest {
    @NotNull(message = "Account ID is required")
    private Long accountId;
}
