package com.fpt.seal.hms.track.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackRequest {


    @Size(max = 150, message = "Track name must be at most 150 characters")
    private String name;

    private String description;

    private Integer maxTeams;
}
