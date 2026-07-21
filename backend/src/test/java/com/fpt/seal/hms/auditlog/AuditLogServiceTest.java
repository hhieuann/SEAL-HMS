package com.fpt.seal.hms.auditlog;

import com.fpt.seal.hms.auditlog.entity.AuditLog;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @InjectMocks private AuditLogService auditLogService;

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void log_recordsActorFromSecurityContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@seal-hms.local", "x"));

        auditLogService.log("EVENT_CREATED", "event", 5L, "Spring Hack");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog saved = captor.getValue();
        assertThat(saved.getActorEmail()).isEqualTo("admin@seal-hms.local");
        assertThat(saved.getAction()).isEqualTo("EVENT_CREATED");
        assertThat(saved.getEntityType()).isEqualTo("event");
        assertThat(saved.getEntityId()).isEqualTo(5L);
        assertThat(saved.getDetail()).isEqualTo("Spring Hack");
        assertThat(saved.getCreatedAt()).isNotNull();
    }

    @Test
    void log_usesSystemActor_whenNoAuthentication() {
        SecurityContextHolder.clearContext();

        auditLogService.log("ACTION", "entity", 1L, "detail");

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getActorEmail()).isEqualTo("system");
    }

    @Test
    void log_swallowsRepositoryFailure_soBusinessFlowSurvives() {
        when(auditLogRepository.save(any(AuditLog.class))).thenThrow(new RuntimeException("DB down"));

        // Must NOT propagate — audit failures cannot break the action being logged.
        assertThatCode(() -> auditLogService.log("ACTION", "entity", 1L, "detail"))
                .doesNotThrowAnyException();
    }
}
