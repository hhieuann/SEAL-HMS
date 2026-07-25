package com.fpt.seal.hms.config;

import com.fpt.seal.hms.auth.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    @Test
    void allowsBothViteDevelopmentPortsWithoutOpeningOtherOrigins() {
        SecurityConfig securityConfig = new SecurityConfig((JwtAuthenticationFilter) null);
        CorsConfigurationSource source = securityConfig.corsConfigurationSource();
        CorsConfiguration configuration = source.getCorsConfiguration(
                new MockHttpServletRequest("POST", "/api/v1/auth/login"));

        assertThat(configuration).isNotNull();
        assertThat(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174"
        )).allSatisfy(origin -> assertThat(configuration.checkOrigin(origin)).isEqualTo(origin));
        assertThat(configuration.checkOrigin("http://localhost:5175")).isNull();
        assertThat(configuration.checkOrigin("https://example.com")).isNull();
    }
}
