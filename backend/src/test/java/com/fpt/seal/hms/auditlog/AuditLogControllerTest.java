package com.fpt.seal.hms.auditlog;

import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer tests for AuditLogController — admin/staff only + limit clamping. */
@WebMvcTest(AuditLogController.class)
@Import(WebMvcTestSecurityConfig.class)
class AuditLogControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AuditLogRepository auditLogRepository;

    @Test
    void latest_asAdmin_ok() throws Exception {
        when(auditLogRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/v1/audit-logs").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void latest_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/audit-logs").with(user("sv").roles("STUDENT")))
                .andExpect(status().isForbidden());
        verify(auditLogRepository, never()).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    @Test
    void latest_clampsLimitTo500() throws Exception {
        when(auditLogRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/v1/audit-logs?limit=99999").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
        verify(auditLogRepository).findAllByOrderByCreatedAtDesc(cap.capture());
        assertThat(cap.getValue().getPageSize()).isEqualTo(500); // clamped
    }

    @Test
    void latest_clampsLimitToAtLeastOne() throws Exception {
        when(auditLogRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/v1/audit-logs?limit=0").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());

        ArgumentCaptor<Pageable> cap = ArgumentCaptor.forClass(Pageable.class);
        verify(auditLogRepository).findAllByOrderByCreatedAtDesc(cap.capture());
        assertThat(cap.getValue().getPageSize()).isEqualTo(1);
    }
}
