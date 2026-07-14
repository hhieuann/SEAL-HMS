package com.fpt.seal.hms.account.dto;

import com.fpt.seal.hms.account.Account;

public record AccountResponse(Long id, String email, String role, String status, String avatarUrl) {
    public static AccountResponse from(Account a) {
        return new AccountResponse(a.getId(), a.getEmail(), a.getRole().name(), a.getStatus().name(), a.getAvatarUrl());
    }
}
