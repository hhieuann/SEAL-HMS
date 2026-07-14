package com.fpt.seal.hms.staff.dto;

import com.fpt.seal.hms.staff.entity.Staff;

public record StaffResponse(
        Long id, Long accountId, String email, String avatarUrl,
        String fullName, String department, String campus, String phone) {

    public static StaffResponse from(Staff s, com.fpt.seal.hms.account.Account acc) {
        return new StaffResponse(
                s.getId(),
                acc.getId(),
                acc.getEmail(),
                acc.getAvatarUrl(),
                s.getFullName(),
                s.getDepartment(),
                s.getCampus(),
                s.getPhone());
    }
}
