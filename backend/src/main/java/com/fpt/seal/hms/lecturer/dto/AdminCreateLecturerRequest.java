package com.fpt.seal.hms.lecturer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Admin-only request to create a Lecturer account + profile in one step. */
public record AdminCreateLecturerRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(max = 150) String fullName,
        @Size(max = 100) String department,
        @Size(max = 100) String campus,
        @Size(max = 20) String phone) {
}
