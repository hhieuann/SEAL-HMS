package com.fpt.seal.hms.track;

import com.fpt.seal.hms.track.dto.TrackResponse;
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

@WebMvcTest(TrackController.class)
@Import(WebMvcTestSecurityConfig.class)
class TrackControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private TrackService trackService;

    private TrackResponse mockResponse() {
        TrackResponse r = new TrackResponse();
        r.setId(1L);
        r.setEventId(1L);
        r.setName("Web Development");
        r.setDescription("Build web apps");
        r.setMaxTeams(20);
        return r;
    }

    @Test
    void getTracksByEventId_ok() throws Exception {
        when(trackService.getTracksByEventId(1L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/events/1/tracks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Web Development"));
    }

    @Test
    void getTrackById_ok() throws Exception {
        when(trackService.getTrackById(1L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/tracks/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Web Development"));
    }

    @Test
    void createTrack_asAdmin_returns201() throws Exception {
        when(trackService.createTrack(eq(1L), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/events/1/tracks")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Web Development\",\"description\":\"Build web apps\",\"maxTeams\":20}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Web Development"));
    }

    @Test
    void createTrack_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/events/1/tracks")
                        .with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Track\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateTrack_asStaff_ok() throws Exception {
        when(trackService.updateTrack(eq(1L), any())).thenReturn(mockResponse());
        mockMvc.perform(put("/api/v1/tracks/1")
                        .with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Updated Track\",\"maxTeams\":30}"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteTrack_asAdmin_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/tracks/1")
                        .with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(trackService).deleteTrack(1L);
    }
}
