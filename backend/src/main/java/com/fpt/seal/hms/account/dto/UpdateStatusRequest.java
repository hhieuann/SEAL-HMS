package com.fpt.seal.hms.account.dto;

import com.fpt.seal.hms.common.enums.AccountStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull AccountStatus status) {
}
