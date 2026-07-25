package com.fpt.seal.hms.score.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class GradeSubmissionRequest {
    // Deprecated: the judge is now taken from the authenticated user, never from the body
    // (a client could grade under another judge's identity). Kept so older FE payloads bind.
    private Long judgeAccountId;
    private List<ScoreRequest> scores;
}
