package com.fpt.seal.hms.trackassignment.dto;

import com.fpt.seal.hms.common.enums.AssignmentRole;
import jakarta.validation.constraints.NotNull;

public record TrackAssignmentRequest(
        @NotNull Long lecturerId,
        @NotNull AssignmentRole role) {
}
