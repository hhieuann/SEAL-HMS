package com.fpt.seal.hms.round.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RoundRequest {


    @Size(max = 150, message = "Round name must be at most 150 characters")
    private String name;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    private Integer promotionTopN;

    private Integer eliminatedTeams;
}
