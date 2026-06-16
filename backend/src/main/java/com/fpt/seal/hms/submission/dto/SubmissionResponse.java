package com.fpt.seal.hms.submission.dto;

import com.fpt.seal.hms.common.enums.SubmissionStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class SubmissionResponse {
    private Long id;
    private Long roundRankingId;
    private Long teamId;
    private Long submittedByAccountId;
    private String submissionName;
    private String description;
    private String techStackName;
    private String githubUrl;
    private String demoUrl;
    private String slideUrl;
    private SubmissionStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
