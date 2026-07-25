package com.fpt.seal.hms.score;

import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer tests for ScoreController — grading is restricted to judge roles. */
@WebMvcTest(ScoreController.class)
@Import(WebMvcTestSecurityConfig.class)
class ScoreControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ScoreService scoreService;

    private static final String GRADE_BODY =
            "{\"judgeAccountId\":7,\"scores\":[{\"criterionId\":1,\"score\":8}]}";

    @Test
    void getScores_isReadable() throws Exception {
        when(scoreService.getScoresForSubmission(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/submissions/1/scores"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void grade_asLecturer_ok() throws Exception {
        when(scoreService.gradeSubmission(eq(1L), any(), any())).thenReturn(List.of());

        mockMvc.perform(post("/api/v1/submissions/1/scores/grade")
                        .with(user("judge").roles("LECTURER")).with(csrf())
                        .contentType("application/json").content(GRADE_BODY))
                .andExpect(status().isOk());
        verify(scoreService).gradeSubmission(eq(1L), any(), any());
    }

    /**
     * Judging is a lecturer responsibility earned through a track assignment, so an admin
     * can no longer grade on a judge's behalf.
     */
    @Test
    void grade_asAdmin_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/submissions/1/scores/grade")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json").content(GRADE_BODY))
                .andExpect(status().isForbidden());
        verify(scoreService, never()).gradeSubmission(any(), any(), any());
    }

    @Test
    void grade_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/submissions/1/scores/grade")
                        .with(user("sv").roles("STUDENT")).with(csrf())
                        .contentType("application/json").content(GRADE_BODY))
                .andExpect(status().isForbidden());
        verify(scoreService, never()).gradeSubmission(any(), any(), any());
    }
}
