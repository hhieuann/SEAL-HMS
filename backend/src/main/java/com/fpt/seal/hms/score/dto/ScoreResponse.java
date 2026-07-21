package com.fpt.seal.hms.score.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ScoreResponse {
    private Long id;
    private Long submissionId;
    private Long judgeAccountId;
    private String judgeEmail;
    private String judgeName;
    private Long criterionId;
    private String criterionName;
    private BigDecimal maxScore;
    private BigDecimal score;
    private String comment;
}
