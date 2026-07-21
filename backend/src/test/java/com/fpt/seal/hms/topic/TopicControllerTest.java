package com.fpt.seal.hms.topic;

import com.fpt.seal.hms.topic.dto.TopicResponse;
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

@WebMvcTest(TopicController.class)
@Import(WebMvcTestSecurityConfig.class)
class TopicControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private TopicService topicService;

    private TopicResponse mockResponse() {
        TopicResponse r = new TopicResponse();
        r.setId(1L);
        r.setTrackId(2L);
        r.setName("AI in Healthcare");
        r.setDescription("Use AI to improve healthcare");
        return r;
    }

    @Test
    void getTopicsByTrackId_ok() throws Exception {
        when(topicService.getTopicsByTrackId(2L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/tracks/2/topics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("AI in Healthcare"));
    }

    @Test
    void getTopicsByEventId_ok() throws Exception {
        when(topicService.getTopicsByEventId(1L)).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/events/1/topics"))
                .andExpect(status().isOk());
    }

    @Test
    void getTopicById_ok() throws Exception {
        when(topicService.getTopicById(1L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/topics/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("AI in Healthcare"));
    }

    @Test
    void createTopicUnderTrack_asAdmin_returns201() throws Exception {
        when(topicService.createTopicUnderTrack(eq(2L), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/tracks/2/topics")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"AI in Healthcare\",\"description\":\"desc\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("AI in Healthcare"));
    }

    @Test
    void createTopicUnderEvent_asStaff_returns201() throws Exception {
        when(topicService.createTopicUnderEvent(eq(1L), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/events/1/topics")
                        .with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"AI in Healthcare\",\"description\":\"desc\"}"))
                .andExpect(status().isCreated());
    }

    @Test
    void createTopic_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/tracks/2/topics")
                        .with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"AI\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void assignTrack_asAdmin_ok() throws Exception {
        mockMvc.perform(patch("/api/v1/topics/1/assign-track?trackId=2")
                        .with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(topicService).assignTrack(1L, 2L);
    }

    @Test
    void updateTopic_asStaff_ok() throws Exception {
        when(topicService.updateTopic(eq(1L), any())).thenReturn(mockResponse());
        mockMvc.perform(put("/api/v1/topics/1")
                        .with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"name\":\"Updated Topic\",\"description\":\"updated\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteTopic_asAdmin_ok() throws Exception {
        mockMvc.perform(delete("/api/v1/topics/1")
                        .with(user("admin").roles("ADMIN")).with(csrf()))
                .andExpect(status().isOk());
        verify(topicService).deleteTopic(1L);
    }
}
