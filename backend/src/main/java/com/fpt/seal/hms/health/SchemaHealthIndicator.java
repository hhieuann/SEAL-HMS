package com.fpt.seal.hms.health;

import lombok.RequiredArgsConstructor;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.springframework.boot.health.contributor.AbstractHealthIndicator;
import org.springframework.boot.health.contributor.Health;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The "schema" component of {@code /actuator/health}: which Flyway migration the database is at.
 *
 * Mostly informational — with {@code ddl-auto: validate} the application would not have started on
 * a schema it did not recognise — but it is the one number that tells an admin at a glance that
 * the database they are looking at is the one this build expects. DOWN only when no migration has
 * been applied at all, i.e. the app was pointed at an empty database with Flyway switched off.
 *
 * Migrations run at startup and never again, so the answer is read once and remembered. That
 * also keeps this indicator from doubling the wait during a database outage: the {@code db}
 * component already spends the pool's connection timeout finding out, and this one need not.
 *
 * Extends {@link AbstractHealthIndicator} so that a failure on that first read becomes a DOWN
 * component with the exception attached, rather than a failed request; the next check retries.
 */
@Component
@RequiredArgsConstructor
public class SchemaHealthIndicator extends AbstractHealthIndicator {

    private final Flyway flyway;

    private volatile Map<String, Object> details;

    @Override
    protected void doHealthCheck(Health.Builder builder) {
        Map<String, Object> known = details;
        if (known == null) {
            MigrationInfo current = flyway.info().current();
            if (current == null) {
                builder.down().withDetail("reason", "No migration has been applied");
                return;
            }
            known = describe(current);
            details = known;
        }
        builder.up().withDetails(known);
    }

    private static Map<String, Object> describe(MigrationInfo current) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("version", "V" + current.getVersion());
        details.put("description", current.getDescription());
        if (current.getInstalledOn() != null) {
            details.put("appliedAt", current.getInstalledOn().toInstant().toString());
        }
        return details;
    }
}
