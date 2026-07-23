package com.fpt.seal.hms.chapter.dto;

/**
 * One row of the year-long Chapter Leaderboard.
 *
 * @param rank        dense rank (chapters with the same totalPoints share a rank, and the
 *                    next lower total is the immediately following rank — 1,1,2,3…)
 * @param chapterId   chapter id
 * @param chapterName chapter name
 * @param totalPoints total bonus = Σ placement bonuses of the chapter's teams (champion +20,
 *                    runner-up +15, third +10) + the chapter's manual bonusPoint adjustment
 * @param teamCount   how many teams of this chapter have a final event placement
 */
public record ChapterLeaderboardEntry(
        int rank,
        Long chapterId,
        String chapterName,
        int totalPoints,
        int teamCount) {
}
