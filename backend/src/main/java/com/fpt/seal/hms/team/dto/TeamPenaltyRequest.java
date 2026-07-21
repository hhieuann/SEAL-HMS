package com.fpt.seal.hms.team.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TeamPenaltyRequest {
    private BigDecimal penaltyPoints;
    private String penaltyReason;
}
