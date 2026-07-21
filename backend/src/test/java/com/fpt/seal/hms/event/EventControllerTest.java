package com.fpt.seal.hms.event;

import com.fpt.seal.hms.common.enums.EventStatus;
import com.fpt.seal.hms.event.dto.EventResponse;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EventController.class)
@Import(WebMvcTestSecurityConfig.class)
class EventControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private EventService eventService;

    private EventResponse mockEvent() {
        EventResponse e = new EventResponse();
        e.setId(1L);
        e.setName("Hackathon");
        e.setType("Type");
        e.setStatus(EventStatus.UPCOMING);
        e.setMaxTeams(100);
        e.setMinTeams(10);
        return e;
    }

    private String validRequest() {
        return "{\"name\":\"Hackathon\",\"type\":\"Type\",\"maxTeams\":100,\"minTeams\":2,\"registrationStartDate\":\"2026-01-01\",\"registrationEndDate\":\"2026-12-31\"}";
    }

    @Test
    void getAllEvents_ok() throws Exception {
        when(eventService.getAllEvents()).thenReturn(List.of(mockEvent()));
        mockMvc.perform(get("/api/v1/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Hackathon"));
    }

    @Test
    void getEventById_ok() throws Exception {
        when(eventService.getEventById(1L)).thenReturn(mockEvent());
        mockMvc.perform(get("/api/v1/events/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Hackathon"));
    }

    @Test
    void getAssignedEvents_asStaff_ok() throws Exception {
        when(eventService.getAssignedEvents("staff1")).thenReturn(List.of(mockEvent()));
        mockMvc.perform(get("/api/v1/events/assigned").with(user("staff1").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Hackathon"));
    }

    @Test
    void getAssignedEvents_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/events/assigned").with(user("student1").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void createEvent_asAdmin_returns201() throws Exception {
        when(eventService.createEvent(any())).thenReturn(mockEvent());
        mockMvc.perform(post("/api/v1/events").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content(validRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Hackathon"));
    }

    @Test
    void createEvent_asStaff_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/events").with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content(validRequest()))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateEvent_asStaff_ok() throws Exception {
        doNothing().when(eventService).verifyStaffAccess(eq(1L), anyString());
        when(eventService.updateEvent(eq(1L), any())).thenReturn(mockEvent());

        mockMvc.perform(put("/api/v1/events/1").with(user("staff1").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content(validRequest()))
                .andExpect(status().isOk());
    }

    @Test
    void updateEventStatus_asStaff_ok() throws Exception {
        doNothing().when(eventService).verifyStaffAccess(eq(1L), anyString());
        when(eventService.updateEventStatus(eq(1L), any(EventStatus.class))).thenReturn(mockEvent());

        mockMvc.perform(patch("/api/v1/events/1/status").with(user("staff1").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"status\":\"UPCOMING\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteEvent_asAdmin_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/events/1").with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(eventService).deleteEvent(1L);
    }

    @Test
    void assignStaff_asAdmin_ok() throws Exception {
        mockMvc.perform(post("/api/v1/events/1/staff").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"accountId\": 5}"))
                .andExpect(status().isOk());
        verify(eventService).assignStaff(1L, 5L);
    }

    @Test
    void removeStaff_asAdmin_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/events/1/staff/5").with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(eventService).removeStaff(1L, 5L);
    }

    @Test
    void resetEventData_asStaff_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/events/1/reset-data").with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
        verify(eventService).resetEventData(1L);
    }
}
