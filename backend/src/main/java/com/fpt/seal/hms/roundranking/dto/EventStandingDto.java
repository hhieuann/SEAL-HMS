package com.fpt.seal.hms.roundranking.dto;

import java.math.BigDecimal;

/** One team's aggregated standing across all rounds of an event. */
public record EventStandingDto(
        Long teamId,
        String teamName,
        BigDecimal eventScore,
        Integer eventRank
) {
}
