package com.fpt.seal.hms.demo;

/** What a seed run produced, so the caller can say it out loud without another request. */
public record DemoSeedResult(
        Long eventId,
        String eventName,
        String stage,
        int teams,
        int students,
        int assignments,
        String demoPassword) {

    public DemoSeedResult withTeams(int teams, int students) {
        return new DemoSeedResult(eventId, eventName, stage, teams, students, assignments, demoPassword);
    }

    public DemoSeedResult withAssignments(int assignments) {
        return new DemoSeedResult(eventId, eventName, stage, teams, students, assignments, demoPassword);
    }
}
