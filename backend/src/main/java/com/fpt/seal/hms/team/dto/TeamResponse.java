package com.fpt.seal.hms.team.dto;

import com.fpt.seal.hms.common.enums.TeamStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class TeamResponse {
    private Long id;
    private String name;
    private Long chapterId;
    private Long trackId;
    private Long topicId;
    private TeamStatus status;
    private Boolean isDisqualified;
    private String disqualificationReason;
    private BigDecimal eventScore;
    private Integer eventRank;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer memberCount;
    private java.util.List<MentorDto> mentors;

    @Getter
    @Setter
    public static class MentorDto {
        private Long lecturerId;
        private String name;
        private String email;
    }
}
