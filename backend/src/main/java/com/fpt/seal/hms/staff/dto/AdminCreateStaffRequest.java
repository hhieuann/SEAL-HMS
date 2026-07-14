package com.fpt.seal.hms.staff.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminCreateStaffRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(max = 150) String fullName,
        @Size(max = 100) String department,
        @Size(max = 100) String campus,
        @Size(max = 20) String phone
) {}
