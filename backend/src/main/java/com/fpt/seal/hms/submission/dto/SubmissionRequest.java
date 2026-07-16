package com.fpt.seal.hms.submission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionRequest {

    // Deprecated: the submitter is now taken from the authenticated user, never from
    // the body (a client could impersonate anyone). Kept so older FE payloads still bind.
    private Long submittedByAccountId;

    @NotBlank(message = "Submission name is required")
    private String submissionName;

    private String description;
    private String techStackName;
    private String githubUrl;
    private String demoUrl;
    private String slideUrl;
}
