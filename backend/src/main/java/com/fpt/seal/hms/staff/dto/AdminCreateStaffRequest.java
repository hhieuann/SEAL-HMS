package com.fpt.seal.hms.staff.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AdminCreateStaffRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(max = 150) String fullName,
        @Size(max = 100) String department,
        @Size(max = 100) String campus,
        @NotBlank(message = "Phone number is required") @Pattern(regexp = "^\\+?[0-9\\s\\-]{10,20}$", message = "Phone number is invalid") String phone
) {}
