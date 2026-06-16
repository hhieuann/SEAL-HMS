package com.fpt.seal.hms.team.dto;

import com.fpt.seal.hms.common.enums.TeamStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TeamStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private TeamStatus status;
}
