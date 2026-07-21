package com.fpt.seal.hms.support;

import com.fpt.seal.hms.auth.JwtService;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Minimal security context for @WebMvcTest controller slices: keeps method-level
 * {@code @PreAuthorize} active (via @EnableMethodSecurity) so role checks are exercised,
 * but permits all at the HTTP level. Tests supply the authenticated principal with
 * {@code @WithMockUser}; unauthenticated/wrong-role calls still get 401/403 from method
 * security. A real JwtService is provided so the app's JwtAuthenticationFilter (a servlet
 * Filter picked up by the slice) can be constructed — tests send no Bearer token so it
 * simply passes through.
 */
@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
public class WebMvcTestSecurityConfig {

    @Bean
    public SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }

    @Bean
    public JwtService jwtService() {
        return new JwtService("test-secret-key-that-is-long-enough-1234567890", 3600000L);
    }
}
