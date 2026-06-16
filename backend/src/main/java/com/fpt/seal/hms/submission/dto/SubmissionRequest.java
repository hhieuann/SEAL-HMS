package com.fpt.seal.hms.submission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionRequest {

    @NotNull(message = "Account ID submitting this is required")
    private Long submittedByAccountId;

    @NotBlank(message = "Submission name is required")
    private String submissionName;

    private String description;
    private String techStackName;
    private String githubUrl;
    private String demoUrl;
    private String slideUrl;
}
