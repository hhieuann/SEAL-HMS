package com.fpt.seal.hms.auth.dto;

public record AuthResponse(String token, String role, Long accountId, String name, String avatarUrl) {
}
