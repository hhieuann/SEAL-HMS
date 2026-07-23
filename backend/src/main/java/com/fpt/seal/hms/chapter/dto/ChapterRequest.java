package com.fpt.seal.hms.chapter.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Create/update payload for a chapter. bonusPoint is an optional manual adjustment
 *  (defaults to 0) added on top of the placement bonuses earned by the chapter's teams. */
public record ChapterRequest(
        @NotBlank(message = "Chapter name is required") @Size(max = 150) String name,
        Integer bonusPoint) {
}
