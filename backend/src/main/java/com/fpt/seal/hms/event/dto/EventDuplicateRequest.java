package com.fpt.seal.hms.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * What changes when one edition is reused as the next: a new name and new dates. Everything
 * else — tracks, topics, rounds, criteria, team limits — is copied from the source event.
 *
 * Dates are optional. Supplying {@code startDate} shifts every round by the same number of
 * days, so a schedule built for Spring keeps its shape when it becomes Summer.
 */
@Getter
@Setter
public class EventDuplicateRequest {

    @NotBlank(message = "The new event needs a name")
    @Size(max = 200, message = "Event name must be at most 200 characters")
    private String name;

    private LocalDate registrationStartDate;
    private LocalDate registrationEndDate;
    private LocalDate startDate;
    private LocalDate endDate;
}
