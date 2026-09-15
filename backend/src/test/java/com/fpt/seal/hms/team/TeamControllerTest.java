package com.fpt.seal.hms.team;

import com.fpt.seal.hms.common.enums.TeamStatus;
import com.fpt.seal.hms.team.dto.MentorMessageDto;
import com.fpt.seal.hms.team.dto.TeamResponse;
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

@WebMvcTest(TeamController.class)
@Import(WebMvcTestSecurityConfig.class)
class TeamControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private TeamService teamService;

    private TeamResponse mockResponse() {
        TeamResponse r = new TeamResponse();
        r.setId(1L);
        r.setName("Alpha Team");
        r.setStatus(TeamStatus.REGISTERED);
        r.setMemberCount(3);
        return r;
    }

    private MentorMessageDto mockMessage() {
        MentorMessageDto m = new MentorMessageDto();
        m.setId(1L);
        m.setTeamId(1L);
        m.setSenderId(10L);
        m.setSenderName("Mentor");
        m.setSenderRole("LECTURER");
        m.setMessage("Good job");
        return m;
    }

    @Test
    void getTeamsByEventId_ok() throws Exception {
        when(teamService.getTeamsByEventId(1L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/events/1/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Alpha Team"));
    }

    @Test
    void getTeamById_ok() throws Exception {
        when(teamService.getTeamById(1L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/teams/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Alpha Team"));
    }

    @Test
    void createTeam_returns201() throws Exception {
        when(teamService.createTeam(eq(1L), any(), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/events/1/teams")
                        .with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Alpha Team\",\"leaderAccountId\":10}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Alpha Team"));
    }

    @Test
    void assignRandomTrack_asAdmin_ok() throws Exception {
        when(teamService.assignRandomTrackAndTopic(1L, 1L)).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/teams/1/random-assign?eventId=1")
                        .with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void assignRandomTrack_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/teams/1/random-assign?eventId=1")
                        .with(user("student").roles("STUDENT")).with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateTeamStatus_asStaff_ok() throws Exception {
        when(teamService.updateTeamStatus(eq(1L), any(TeamStatus.class))).thenReturn(mockResponse());
        mockMvc.perform(patch("/api/v1/teams/1/status")
                        .with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void assignMentor_asAdmin_ok() throws Exception {
        when(teamService.assignMentor(1L, 5L)).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/teams/1/mentor")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"mentorId\":5}"))
                .andExpect(status().isOk());
    }

    @Test
    void assignTrack_asStaff_ok() throws Exception {
        when(teamService.assignTrack(1L, 3L)).thenReturn(mockResponse());
        mockMvc.perform(patch("/api/v1/teams/1/assign-track?trackId=3")
                        .with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void disqualifyTeam_asAdmin_ok() throws Exception {
        when(teamService.disqualifyTeam(eq(1L), eq(true), eq("cheating"))).thenReturn(mockResponse());
        mockMvc.perform(put("/api/v1/teams/1/disqualify?disqualified=true&reason=cheating")
                        .with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    void applyPenalty_asStaff_ok() throws Exception {
        when(teamService.applyAdjustment(eq(1L), eq(2L), any(BigDecimal.class), eq("late"), any(), any()))
                .thenReturn(mockResponse());
        mockMvc.perform(put("/api/v1/teams/1/rounds/2/penalty")
                        .with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"penaltyPoints\":5,\"penaltyReason\":\"late\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void resetMentors_asAdmin_ok() throws Exception {
        mockMvc.perform(post("/api/v1/events/1/teams/reset-mentors")
                        .with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(teamService).resetAllMentorsByEvent(1L);
    }

    @Test
    void getMentorMessages_authenticated_ok() throws Exception {
        when(teamService.getMentorMessages(eq(1L), any())).thenReturn(List.of(mockMessage()));
        mockMvc.perform(get("/api/v1/teams/1/messages")
                        .with(user("user@fpt.edu.vn").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].message").value("Good job"));
    }

    @Test
    void sendMentorMessage_authenticated_returns201() throws Exception {
        when(teamService.sendMentorMessageByEmail(eq(1L), eq("mentor@fpt.edu.vn"), eq("Keep going!")))
                .thenReturn(mockMessage());
        mockMvc.perform(post("/api/v1/teams/1/messages")
                        .with(user("mentor@fpt.edu.vn").roles("LECTURER")).with(csrf())
                        .contentType("application/json")
                        .content("{\"message\":\"Keep going!\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void resetMentors_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/events/1/teams/reset-mentors")
                        .with(user("student").roles("STUDENT")).with(csrf()))
                .andExpect(status().isForbidden());
    }
}
