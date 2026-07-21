package com.fpt.seal.hms.criterion;

import com.fpt.seal.hms.criterion.dto.CriterionResponse;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CriterionController.class)
@Import(WebMvcTestSecurityConfig.class)
class CriterionControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private CriterionService criterionService;

    private CriterionResponse mockResponse() {
        CriterionResponse r = new CriterionResponse();
        r.setId(1L);
        r.setRoundId(1L);
        r.setName("Design");
        r.setMaxScore(new BigDecimal("10"));
        r.setWeight(new BigDecimal("0.3"));
        return r;
    }

    @Test
    void getCriteriaByRoundId_ok() throws Exception {
        when(criterionService.getCriteriaByRoundId(1L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/rounds/1/criteria"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Design"));
    }

    @Test
    void getCriterionById_ok() throws Exception {
        when(criterionService.getCriterionById(1L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/criteria/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Design"));
    }

    @Test
    void createCriterion_asAdmin_returns201() throws Exception {
        when(criterionService.createCriterion(eq(1L), any())).thenReturn(mockResponse());

        mockMvc.perform(post("/api/v1/rounds/1/criteria").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Design\",\"weight\":0.3,\"maxScore\":10}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Design"));
    }

    @Test
    void createCriterion_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/rounds/1/criteria").with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Design\",\"weight\":0.3,\"maxScore\":10}"))
                .andExpect(status().isForbidden());
        verify(criterionService, never()).createCriterion(any(), any());
    }

    @Test
    void createCriterion_anonymous_denied() throws Exception {
        mockMvc.perform(post("/api/v1/rounds/1/criteria").with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Design\",\"weight\":0.3,\"maxScore\":10}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void updateCriterion_asStaff_ok() throws Exception {
        when(criterionService.updateCriterion(eq(1L), any())).thenReturn(mockResponse());

        mockMvc.perform(put("/api/v1/criteria/1").with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Design\",\"weight\":0.3,\"maxScore\":10}"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteCriterion_asAdmin_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/criteria/1").with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(criterionService).deleteCriterion(1L);
    }
}
