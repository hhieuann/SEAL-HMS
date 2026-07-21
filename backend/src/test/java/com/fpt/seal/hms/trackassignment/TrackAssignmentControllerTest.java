package com.fpt.seal.hms.trackassignment;

import com.fpt.seal.hms.common.enums.AssignmentRole;
import com.fpt.seal.hms.trackassignment.dto.TrackAssignmentResponse;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TrackAssignmentController.class)
@Import(WebMvcTestSecurityConfig.class)
class TrackAssignmentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private TrackAssignmentService assignmentService;

    private TrackAssignmentResponse mockResponse() {
        return new TrackAssignmentResponse(
                1L, 2L, "Web Dev", 3L, "Dr. Smith", "smith@fpt.edu.vn",
                "CS", AssignmentRole.JUDGE, false, LocalDateTime.now());
    }

    @Test
    void assign_asAdmin_returns201() throws Exception {
        when(assignmentService.assign(eq(2L), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/tracks/2/assignments")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"lecturerId\":3,\"role\":\"JUDGE\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.lecturerFullName").value("Dr. Smith"));
    }

    @Test
    void assign_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/tracks/2/assignments")
                        .with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"lecturerId\":3,\"role\":\"JUDGE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getByTrack_asStaff_ok() throws Exception {
        when(assignmentService.getByTrack(2L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/tracks/2/assignments")
                        .with(user("staff").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].lecturerFullName").value("Dr. Smith"));
    }

    @Test
    void getByEvent_asAdmin_ok() throws Exception {
        when(assignmentService.getByEvent(1L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/events/1/assignments")
                        .with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void getByEvent_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/events/1/assignments")
                        .with(user("student").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getMyAssignments_asLecturer_ok() throws Exception {
        when(assignmentService.getByLecturerEmail("lecturer@fpt.edu.vn")).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/users/me/assignments")
                        .with(user("lecturer@fpt.edu.vn").roles("LECTURER")))
                .andExpect(status().isOk());
    }

    @Test
    void getMyAssignments_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/assignments")
                        .with(user("student").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void remove_asStaff_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/track-assignments/1")
                        .with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
        verify(assignmentService).remove(1L);
    }

    @Test
    void completeScoring_asLecturer_ok() throws Exception {
        mockMvc.perform(post("/api/v1/tracks/2/complete-scoring")
                        .with(user("lecturer@fpt.edu.vn").roles("LECTURER")).with(csrf()))
                .andExpect(status().isOk());
        verify(assignmentService).completeScoring(2L, "lecturer@fpt.edu.vn");
    }

    @Test
    void completeScoring_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/tracks/2/complete-scoring")
                        .with(user("student").roles("STUDENT")).with(csrf()))
                .andExpect(status().isForbidden());
    }
}
