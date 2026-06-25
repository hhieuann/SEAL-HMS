package com.fpt.seal.hms.round.dto;

import com.fpt.seal.hms.common.enums.RoundStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RoundResponse {
    private Long id;
    private Long eventId;
    private String name;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer promotionTopN;
    private Integer eliminatedTeams;
    private RoundStatus status;
    private Integer roundSeq;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
