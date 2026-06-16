package com.fpt.seal.hms.account.dto;

import com.fpt.seal.hms.common.enums.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(@NotNull Role role) {
}
