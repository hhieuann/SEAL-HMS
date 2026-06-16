package com.fpt.seal.hms.track.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TrackResponse {
    private Long id;
    private Long eventId;
    private String name;
    private String description;
    private Integer maxTeams;
}
