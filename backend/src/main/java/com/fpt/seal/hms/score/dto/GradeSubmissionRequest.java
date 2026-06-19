package com.fpt.seal.hms.score.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class GradeSubmissionRequest {
    private Long judgeAccountId;
    private List<ScoreRequest> scores;
}
