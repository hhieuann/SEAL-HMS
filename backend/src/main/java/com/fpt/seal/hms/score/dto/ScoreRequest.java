package com.fpt.seal.hms.score.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ScoreRequest {
    @NotNull(message = "Criterion ID is required")
    private Long criterionId;

    @NotNull(message = "Score value is required")
    @DecimalMin(value = "0.0", message = "Score must be >= 0")
    private BigDecimal score;

    private String comment;
}
