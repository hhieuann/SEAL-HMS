package com.fpt.seal.hms.demo;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

/** What to build. Everything has a default so an empty body still produces a usable demo. */
@Getter
@Setter
public class DemoSeedRequest {

    private String eventName;

    private DemoStage stage = DemoStage.SCORED;

    @Min(value = 2, message = "A demo needs at least 2 teams")
    @Max(value = 30, message = "30 teams is plenty for a demo")
    private Integer teams = 6;

    @Min(value = 1, message = "At least 1 track")
    @Max(value = 6, message = "6 tracks is plenty for a demo")
    private Integer tracks = 2;

    @Min(value = 1, message = "At least 1 member per team")
    @Max(value = 6, message = "6 members per team is plenty")
    private Integer membersPerTeam = 3;
}
