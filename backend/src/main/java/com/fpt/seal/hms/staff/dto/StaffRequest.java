package com.fpt.seal.hms.staff.dto;

import jakarta.validation.constraints.NotBlank;

public record StaffRequest(
        @NotBlank(message = "Full name is required")
        String fullName,
        String department,
        String campus,
        String phone) {
}
