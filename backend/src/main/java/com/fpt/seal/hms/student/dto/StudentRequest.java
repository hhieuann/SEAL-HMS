package com.fpt.seal.hms.student.dto;

import jakarta.validation.constraints.Size;

/** Create/update payload for a student profile. */
public record StudentRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Size(max = 100) String campus) {
}
