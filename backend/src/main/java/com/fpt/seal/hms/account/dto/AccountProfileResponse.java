package com.fpt.seal.hms.account.dto;

import java.time.LocalDateTime;

public record AccountProfileResponse(
        Long id,
        String email,
        String role,
        String status,
        String fullName,
        String studentCode,
        String campus,
        String proof,
        String department,
        String phone,
        String avatarUrl,
        LocalDateTime createdAt
) {}
