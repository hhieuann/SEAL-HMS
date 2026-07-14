package com.fpt.seal.hms.event.dto;

public record EventStaffResponse(
        Long accountId,
        String email,
        String fullName,
        String department
) {}
