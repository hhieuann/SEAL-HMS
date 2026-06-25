package com.fpt.seal.hms.prize.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/** Defines a prize for an event. rank links it to a placing for auto-award by ranking. */
public record PrizeRequest(
        @NotBlank(message = "Prize name is required") String name,
        Integer rank,
        BigDecimal value,
        String prizeType
) {
}
