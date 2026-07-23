package com.fpt.seal.hms.chapter;

import com.fpt.seal.hms.chapter.dto.ChapterLeaderboardEntry;
import com.fpt.seal.hms.chapter.dto.ChapterResponse;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer tests for ChapterController — leaderboard readable by students,
 *  create/delete gated to ADMIN/STAFF. */
@WebMvcTest(ChapterController.class)
@Import(WebMvcTestSecurityConfig.class)
class ChapterControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private ChapterService chapterService;

    @Test
    void leaderboard_readableByStudent() throws Exception {
        when(chapterService.getLeaderboard()).thenReturn(List.of(
                new ChapterLeaderboardEntry(1, 1L, "Alpha", 20, 1)));

        mockMvc.perform(get("/api/v1/chapters/leaderboard").with(user("sv").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].chapterName").value("Alpha"))
                .andExpect(jsonPath("$.data[0].rank").value(1));
    }

    @Test
    void list_readableForDropdown() throws Exception {
        when(chapterService.listChapters()).thenReturn(List.of(new ChapterResponse(1L, "Alpha", 0)));

        mockMvc.perform(get("/api/v1/chapters").with(user("sv").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Alpha"));
    }

    @Test
    void create_asAdmin_ok() throws Exception {
        when(chapterService.createChapter(any())).thenReturn(new ChapterResponse(9L, "New", 0));

        mockMvc.perform(post("/api/v1/chapters").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json").content("{\"name\":\"New\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("New"));
    }

    @Test
    void create_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/chapters").with(user("sv").roles("STUDENT")).with(csrf())
                        .contentType("application/json").content("{\"name\":\"New\"}"))
                .andExpect(status().isForbidden());
        verify(chapterService, never()).createChapter(any());
    }

    @Test
    void delete_asStaff_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/chapters/1").with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
        verify(chapterService).deleteChapter(1L);
    }
}
