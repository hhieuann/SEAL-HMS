package com.fpt.seal.hms.prize.dto;

import java.math.BigDecimal;

public record PrizeResponse(
        Long id,
        Long eventId,
        Long teamId,
        String teamName,
        String name,
        Integer rank,
        BigDecimal value,
        String prizeType
) {
}
