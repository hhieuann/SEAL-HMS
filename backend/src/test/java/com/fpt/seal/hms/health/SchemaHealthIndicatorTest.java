package com.fpt.seal.hms.health;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.MigrationInfoService;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.Status;

import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SchemaHealthIndicatorTest {

    @Mock private Flyway flyway;
    @Mock private MigrationInfoService infoService;
    @Mock private MigrationInfo current;

    @InjectMocks private SchemaHealthIndicator indicator;

    @BeforeEach
    void setUp() {
        when(flyway.info()).thenReturn(infoService);
    }

    @Test
    void reportsTheCurrentMigrationAsUp() {
        Instant applied = Instant.parse("2026-09-01T08:00:00Z");
        when(infoService.current()).thenReturn(current);
        when(current.getVersion()).thenReturn(MigrationVersion.fromVersion("38"));
        when(current.getDescription()).thenReturn("split raw score from adjustments");
        when(current.getInstalledOn()).thenReturn(Date.from(applied));

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails())
                .containsEntry("version", "V38")
                .containsEntry("description", "split raw score from adjustments")
                .containsEntry("appliedAt", "2026-09-01T08:00:00Z");
    }

    @Test
    void leavesOutAppliedAtWhenFlywayDoesNotKnowIt() {
        when(infoService.current()).thenReturn(current);
        when(current.getVersion()).thenReturn(MigrationVersion.fromVersion("38"));
        when(current.getDescription()).thenReturn("split raw score from adjustments");
        when(current.getInstalledOn()).thenReturn(null);

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.UP);
        assertThat(health.getDetails()).containsEntry("version", "V38").doesNotContainKey("appliedAt");
    }

    @Test
    void readsTheDatabaseOnceAndRemembersTheAnswer() {
        when(infoService.current()).thenReturn(current);
        when(current.getVersion()).thenReturn(MigrationVersion.fromVersion("38"));
        when(current.getDescription()).thenReturn("split raw score from adjustments");
        when(current.getInstalledOn()).thenReturn(null);

        indicator.health();
        Health second = indicator.health();

        assertThat(second.getStatus()).isEqualTo(Status.UP);
        assertThat(second.getDetails()).containsEntry("version", "V38");
        verify(infoService, times(1)).current();
    }

    @Test
    void isDownOnAnEmptyDatabase() {
        when(infoService.current()).thenReturn(null);

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails()).containsEntry("reason", "No migration has been applied");
    }

    @Test
    void isDownRatherThanFailingWhenTheDatabaseCannotBeReached() {
        when(infoService.current()).thenThrow(new IllegalStateException("connection refused"));

        Health health = indicator.health();

        assertThat(health.getStatus()).isEqualTo(Status.DOWN);
        assertThat(health.getDetails().get("error").toString()).contains("connection refused");
    }
}
