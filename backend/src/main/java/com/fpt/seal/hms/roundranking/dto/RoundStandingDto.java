package com.fpt.seal.hms.roundranking.dto;

import java.math.BigDecimal;

/** One team's standing within a round (source-of-truth ranking). */
public record RoundStandingDto(
        Long roundRankingId,
        Long teamId,
        String teamName,
        BigDecimal score,
        Integer rank,
        Boolean promoted
) {
}
