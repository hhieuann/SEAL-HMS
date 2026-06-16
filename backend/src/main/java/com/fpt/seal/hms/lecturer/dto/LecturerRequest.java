package com.fpt.seal.hms.lecturer.dto;

import jakarta.validation.constraints.Size;

/** Create/update payload for a lecturer profile. */
public record LecturerRequest(
        @Size(max = 150) String fullName,
        @Size(max = 100) String department,
        @Size(max = 100) String campus,
        @Size(max = 20) String phone) {
}
