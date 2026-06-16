package com.fpt.seal.hms.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger UI configuration. Browse & try the API at /swagger-ui.html.
 * Adds a global JWT bearer scheme so the "Authorize" button lets you paste a token
 * (from POST /api/v1/auth/login) and call secured endpoints.
 */
@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "SEAL-HMS API",
                version = "v1",
                description = "SEAL Hackathon Management System — auth & accounts now; "
                        + "events, teams, submissions, judging, ranking added per module."),
        security = @SecurityRequirement(name = "bearerAuth")
)
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Paste the JWT returned by POST /api/v1/auth/login"
)
public class OpenApiConfig {
}
