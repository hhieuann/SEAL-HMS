package com.fpt.seal.hms.auth.dto;

import com.fpt.seal.hms.common.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email @NotBlank String email,
        @NotBlank @Size(min = 6, message = "password must be at least 6 chars") String password,
        Role role,
        // Required when registering as STUDENT (validated in AccountService); ignored otherwise.
        @Size(max = 20, message = "student code must be at most 20 chars") String studentCode,
        String firstName,
        String lastName,
        String campus,
        org.springframework.web.multipart.MultipartFile proofFile) {
}
