package com.fpt.seal.hms.teammember;

import com.fpt.seal.hms.common.enums.MemberRole;
import com.fpt.seal.hms.common.enums.MemberStatus;
import com.fpt.seal.hms.teammember.dto.TeamMemberResponse;
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

/** Web-layer tests for TeamMemberController: routing, JSON envelope. No @PreAuthorize on these endpoints. */
@WebMvcTest(TeamMemberController.class)
@Import(WebMvcTestSecurityConfig.class)
class TeamMemberControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private TeamMemberService teamMemberService;

    private TeamMemberResponse mockResponse() {
        TeamMemberResponse r = new TeamMemberResponse();
        r.setId(1L);
        r.setTeamId(1L);
        r.setAccountId(10L);
        r.setAccountName("John");
        r.setEmail("john@fpt.edu.vn");
        r.setRole(MemberRole.MEMBER);
        r.setStatus(MemberStatus.INVITED);
        return r;
    }

    @Test
    void getMembersByTeamId_ok() throws Exception {
        when(teamMemberService.getMembersByTeamId(1L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/teams/1/members").with(user("user").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].accountName").value("John"));
    }

    @Test
    void inviteMember_returns201() throws Exception {
        when(teamMemberService.inviteMember(eq(1L), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/teams/1/members")
                        .with(user("leader").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"accountId\":10}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.accountName").value("John"));
    }

    @Test
    void acceptInvitation_ok() throws Exception {
        TeamMemberResponse accepted = mockResponse();
        accepted.setStatus(MemberStatus.ACCEPTED);
        when(teamMemberService.acceptInvitation(1L, 10L)).thenReturn(accepted);

        mockMvc.perform(patch("/api/v1/teams/1/members/10/accept")
                        .with(user("john").roles("STUDENT")).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }
}
