package com.fpt.seal.hms.round;

import com.fpt.seal.hms.common.enums.RoundStatus;
import com.fpt.seal.hms.round.dto.RoundResponse;
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

@WebMvcTest(RoundController.class)
@Import(WebMvcTestSecurityConfig.class)
class RoundControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private RoundService roundService;

    private RoundResponse mockResponse() {
        RoundResponse r = new RoundResponse();
        r.setId(1L);
        r.setEventId(1L);
        r.setName("Round 1");
        r.setStatus(RoundStatus.CREATED);
        return r;
    }

    private String validRequest() {
        return "{\"name\":\"Round 1\",\"type\":\"Qualifier\"}";
    }

    @Test
    void getRoundsByEventId_ok() throws Exception {
        when(roundService.getRoundsByEventId(1L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/events/1/rounds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Round 1"));
    }

    @Test
    void getRoundById_ok() throws Exception {
        when(roundService.getRoundById(1L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/rounds/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Round 1"));
    }

    @Test
    void createRound_asStaff_returns201() throws Exception {
        when(roundService.createRound(eq(1L), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/events/1/rounds").with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content(validRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Round 1"));
    }

    @Test
    void createRound_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/events/1/rounds").with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content(validRequest()))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateRound_asAdmin_ok() throws Exception {
        when(roundService.updateRound(eq(1L), any())).thenReturn(mockResponse());
        mockMvc.perform(put("/api/v1/rounds/1").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content(validRequest()))
                .andExpect(status().isOk());
    }

    @Test
    void updateRoundStatus_asStaff_ok() throws Exception {
        when(roundService.updateRoundStatus(eq(1L), any(RoundStatus.class))).thenReturn(mockResponse());
        mockMvc.perform(patch("/api/v1/rounds/1/status").with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteRound_asAdmin_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/rounds/1").with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(roundService).deleteRound(1L);
    }
}
