package com.fpt.seal.hms.submission;

import com.fpt.seal.hms.common.enums.SubmissionStatus;
import com.fpt.seal.hms.submission.dto.SubmissionResponse;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SubmissionController.class)
@Import(WebMvcTestSecurityConfig.class)
class SubmissionControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private SubmissionService submissionService;

    private SubmissionResponse mockResponse() {
        SubmissionResponse r = new SubmissionResponse();
        r.setId(1L);
        r.setTeamId(2L);
        r.setSubmissionName("My Project");
        r.setStatus(SubmissionStatus.DRAFT);
        r.setGithubUrl("https://github.com/test");
        return r;
    }

    @Test
    void getSubmission_ok() throws Exception {
        when(submissionService.getSubmission(1L, 2L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/rounds/1/teams/2/submissions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submissionName").value("My Project"));
    }

    @Test
    void upsertSubmission_asStudent_ok() throws Exception {
        when(submissionService.upsertSubmission(eq(1L), eq(2L), any(), eq("leader@fpt.edu.vn")))
                .thenReturn(mockResponse());

        mockMvc.perform(put("/api/v1/rounds/1/teams/2/submissions")
                        .with(user("leader@fpt.edu.vn").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"submissionName\":\"My Project\",\"githubUrl\":\"https://github.com/test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.submissionName").value("My Project"));
    }

    @Test
    void upsertSubmission_asAdmin_ok() throws Exception {
        when(submissionService.upsertSubmission(eq(1L), eq(2L), any(), eq("admin@fpt.edu.vn")))
                .thenReturn(mockResponse());

        mockMvc.perform(put("/api/v1/rounds/1/teams/2/submissions")
                        .with(user("admin@fpt.edu.vn").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"submissionName\":\"My Project\",\"githubUrl\":\"https://github.com/test\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void upsertSubmission_asLecturer_forbidden() throws Exception {
        mockMvc.perform(put("/api/v1/rounds/1/teams/2/submissions")
                        .with(user("lecturer").roles("LECTURER")).with(csrf())
                        .contentType("application/json")
                        .content("{\"submissionName\":\"My Project\"}"))
                .andExpect(status().isForbidden());
    }
}
