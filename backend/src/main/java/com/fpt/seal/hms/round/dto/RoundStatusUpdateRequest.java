package com.fpt.seal.hms.round.dto;

import com.fpt.seal.hms.common.enums.RoundStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RoundStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private RoundStatus status;
}
