package com.fpt.seal.hms.prize;

import com.fpt.seal.hms.prize.dto.PrizeResponse;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.security.test.context.support.WithMockUser;
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

/** Web-layer tests for PrizeController: routing, JSON envelope, and @PreAuthorize. */
@WebMvcTest(PrizeController.class)
@Import(WebMvcTestSecurityConfig.class)
class PrizeControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private PrizeService prizeService;

    private PrizeResponse prize() {
        return new PrizeResponse(11L, 1L, null, null, "Champion", 1, new BigDecimal("1000"), "CASH");
    }

    @Test
    void getPrizes_returnsOkEnvelope() throws Exception {
        when(prizeService.getPrizesByEvent(1L)).thenReturn(List.of(prize()));

        mockMvc.perform(get("/api/v1/events/1/prizes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Champion"));
    }

    @Test
    void createPrize_asAdmin_returns201() throws Exception {
        when(prizeService.createPrize(eq(1L), any())).thenReturn(prize());

        mockMvc.perform(post("/api/v1/events/1/prizes").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Champion\",\"rank\":1,\"value\":1000,\"prizeType\":\"CASH\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Champion"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void createPrize_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/events/1/prizes").with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"X\",\"rank\":1}"))
                .andExpect(status().isForbidden());
        verify(prizeService, never()).createPrize(any(), any());
    }

    @Test
    @WithAnonymousUser
    void createPrize_anonymous_denied() throws Exception {
        mockMvc.perform(post("/api/v1/events/1/prizes").with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"X\",\"rank\":1}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void deletePrize_asStaff_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/prizes/11").with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
        verify(prizeService).deletePrize(11L);
    }
}
