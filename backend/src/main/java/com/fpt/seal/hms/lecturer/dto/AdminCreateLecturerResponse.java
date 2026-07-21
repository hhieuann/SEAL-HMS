package com.fpt.seal.hms.lecturer.dto;

import com.fpt.seal.hms.account.Account;

/** Response when admin creates a lecturer account — includes the one-time temp password. */
public record AdminCreateLecturerResponse(
        Long accountId,
        String email,
        String fullName,
        String tempPassword) {

    public static AdminCreateLecturerResponse from(Account account, String lecturerFullName, String tempPassword) {
        return new AdminCreateLecturerResponse(account.getId(), account.getEmail(), lecturerFullName, tempPassword);
    }
}
