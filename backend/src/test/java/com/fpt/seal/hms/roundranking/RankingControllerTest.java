package com.fpt.seal.hms.roundranking;

import com.fpt.seal.hms.roundranking.dto.RoundStandingDto;
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

/** Web-layer tests for RankingController. */
@WebMvcTest(RankingController.class)
@Import(WebMvcTestSecurityConfig.class)
class RankingControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private RankingService rankingService;

    @Test
    void roundStandings_isReadable() throws Exception {
        when(rankingService.getRoundStandings(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/rounds/1/standings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void computeRoundRanking_asAdmin_ok() throws Exception {
        when(rankingService.computeRoundRanking(eq(1L), any(), any())).thenReturn(List.<RoundStandingDto>of());

        mockMvc.perform(post("/api/v1/rounds/1/ranking/compute")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json"))
                .andExpect(status().isOk());
        verify(rankingService).computeRoundRanking(eq(1L), any(), any());
    }

    @Test
    void computeRoundRanking_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/rounds/1/ranking/compute")
                        .with(user("sv").roles("STUDENT")).with(csrf())
                        .contentType("application/json"))
                .andExpect(status().isForbidden());
        verify(rankingService, never()).computeRoundRanking(any(), any(), any());
    }

    @Test
    void computeEventRanking_asStaff_ok() throws Exception {
        when(rankingService.computeEventRanking(5L)).thenReturn(List.of());

        mockMvc.perform(post("/api/v1/events/5/ranking/compute")
                        .with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
    }
}
