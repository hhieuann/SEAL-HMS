package com.fpt.seal.hms.announcement;

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

/** Web-layer tests for AnnouncementController — create/update/delete are ADMIN/STAFF. */
@WebMvcTest(AnnouncementController.class)
@Import(WebMvcTestSecurityConfig.class)
class AnnouncementControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AnnouncementService announcementService;

    private static final String BODY = "{\"title\":\"Welcome\",\"content\":\"Body\",\"targetRole\":\"ALL\"}";

    @Test
    void list_isReadableByAnyAuthenticatedUser() throws Exception {
        when(announcementService.list(any(), any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/announcements").with(user("sv").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void create_asAdmin_ok() throws Exception {
        when(announcementService.create(any(), any())).thenReturn(
                new com.fpt.seal.hms.announcement.dto.AnnouncementResponse(
                        1L, null, null, "Welcome", "Body", "admin@seal-hms.local", "ALL", null, null));

        mockMvc.perform(post("/api/v1/announcements")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json").content(BODY))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Welcome"));
    }

    @Test
    void create_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/announcements")
                        .with(user("sv").roles("STUDENT")).with(csrf())
                        .contentType("application/json").content(BODY))
                .andExpect(status().isForbidden());
        verify(announcementService, never()).create(any(), any());
    }

    @Test
    void delete_asStaff_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/announcements/1")
                        .with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
        verify(announcementService).delete(1L);
    }

    @Test
    void delete_asStudent_forbidden() throws Exception {
        mockMvc.perform(delete("/api/v1/announcements/1")
                        .with(user("sv").roles("STUDENT")).with(csrf()))
                .andExpect(status().isForbidden());
        verify(announcementService, never()).delete(any());
    }
}
