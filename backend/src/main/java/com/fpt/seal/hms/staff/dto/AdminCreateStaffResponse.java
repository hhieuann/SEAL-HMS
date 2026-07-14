package com.fpt.seal.hms.staff.dto;

import com.fpt.seal.hms.account.Account;

public record AdminCreateStaffResponse(
        Long accountId,
        String email,
        String fullName,
        String tempPassword
) {
    public static AdminCreateStaffResponse from(Account account, String fullName, String tempPassword) {
        return new AdminCreateStaffResponse(account.getId(), account.getEmail(), fullName, tempPassword);
    }
}
