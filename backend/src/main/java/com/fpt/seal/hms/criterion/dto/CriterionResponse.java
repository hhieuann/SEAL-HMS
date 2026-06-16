package com.fpt.seal.hms.criterion.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CriterionResponse {
    private Long id;
    private Long roundId;
    private String name;
    private BigDecimal maxScore;
    private BigDecimal weight;
}
