package com.fpt.seal.hms.chapter.dto;

import com.fpt.seal.hms.chapter.entity.Chapter;

/** A chapter option (used for the team-creation dropdown and admin listing). */
public record ChapterResponse(Long id, String name, Integer bonusPoint) {

    public static ChapterResponse from(Chapter c) {
        return new ChapterResponse(c.getId(), c.getName(), c.getBonusPoint());
    }
}
