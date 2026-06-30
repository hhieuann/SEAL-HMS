package com.fpt.seal.hms.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank String oldPassword,
        @NotBlank @Size(min = 6, message = "new password must be at least 6 chars") String newPassword
) {
}
