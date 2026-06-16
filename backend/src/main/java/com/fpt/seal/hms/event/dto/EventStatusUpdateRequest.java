package com.fpt.seal.hms.event.dto;

import com.fpt.seal.hms.common.enums.EventStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EventStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private EventStatus status;
}
