package com.fpt.seal.hms.event.dto;

import com.fpt.seal.hms.common.enums.EventStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class EventResponse {
    private Long id;
    private String name;
    private String type;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private Integer maxTeams;
    private EventStatus status;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private java.util.List<com.fpt.seal.hms.round.dto.RoundResponse> rounds;
    private java.util.List<com.fpt.seal.hms.track.dto.TrackResponse> tracks;
}
