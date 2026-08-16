package com.fpt.seal.hms.team.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** An adjustment to a team's round result: a penalty, a bonus, or both. */
@Getter
@Setter
public class TeamPenaltyRequest {
    private BigDecimal penaltyPoints;
    private String penaltyReason;
    private BigDecimal bonusPoints;
    private String bonusReason;
}
