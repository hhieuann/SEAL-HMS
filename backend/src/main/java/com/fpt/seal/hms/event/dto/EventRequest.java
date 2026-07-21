package com.fpt.seal.hms.event.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EventRequest {

    @NotBlank(message = "Event name is required")
    @Size(max = 200, message = "Event name must be at most 200 characters")
    private String name;

    @Size(max = 50, message = "Type must be at most 50 characters")
    private String type;

    private LocalDate startDate;
    private LocalDate endDate;

    @jakarta.validation.constraints.NotNull(message = "Registration start date is required")
    private LocalDate registrationStartDate;

    @jakarta.validation.constraints.NotNull(message = "Registration end date is required")
    private LocalDate registrationEndDate;

    @jakarta.validation.constraints.NotNull(message = "Max teams is required")
    @jakarta.validation.constraints.Min(value = 1, message = "Max teams must be at least 1")
    private Integer maxTeams;

    @jakarta.validation.constraints.NotNull(message = "Min teams is required")
    @jakarta.validation.constraints.Min(value = 2, message = "Min teams must be at least 2")
    private Integer minTeams;

    private String description;

    @Valid
    private java.util.List<com.fpt.seal.hms.round.dto.RoundRequest> rounds;

    @Valid
    private java.util.List<com.fpt.seal.hms.track.dto.TrackRequest> tracks;
}
