package com.fpt.seal.hms.demo;

/**
 * How far along a seeded demo event should already be. Each stage includes everything before
 * it, so a demo can start from whichever screen needs showing.
 */
public enum DemoStage {

    /** Event, tracks, topics, rounds and criteria. Nothing has registered yet. */
    SETUP,

    /** Adds teams with student members, registered and waiting for the draw. */
    TEAMS,

    /** Adds the track draw plus judge and mentor assignments; the first round is open. */
    DRAWN,

    /** Adds submissions and judge scores, leaving the round under review and ready to finalise. */
    SCORED
}
