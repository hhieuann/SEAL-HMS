package com.fpt.seal.hms.criterion.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CriterionRequest {

    @Size(max = 200, message = "Criteria name must be at most 200 characters")
    private String name;

    @NotNull(message = "Max score is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Max score must be greater than 0")
    private BigDecimal maxScore;

    @NotNull(message = "Weight is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Weight must be greater than 0")
    @DecimalMax(value = "1.0", message = "Weight cannot exceed 1.0")
    private BigDecimal weight;
}
