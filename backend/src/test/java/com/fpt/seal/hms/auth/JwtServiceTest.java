package com.fpt.seal.hms.auth;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Token generation, claim extraction, and signature/expiry validation. */
class JwtServiceTest {

    // 32+ byte secret required by HMAC-SHA256
    private static final String SECRET = "test-secret-key-that-is-long-enough-1234567890";

    private JwtService service(long expirationMs) {
        return new JwtService(SECRET, expirationMs);
    }

    @Test
    void generateToken_thenExtractEmailAndRole() {
        JwtService jwt = service(60_000);

        String token = jwt.generateToken("an@fpt.edu.vn", "ADMIN");

        assertThat(jwt.extractEmail(token)).isEqualTo("an@fpt.edu.vn");
        assertThat(jwt.extractRole(token)).isEqualTo("ADMIN");
    }

    @Test
    void isValid_returnsTrue_forFreshToken() {
        JwtService jwt = service(60_000);

        assertThat(jwt.isValid(jwt.generateToken("u@fpt.edu.vn", "STUDENT"))).isTrue();
    }

    @Test
    void isValid_returnsFalse_forExpiredToken() throws InterruptedException {
        JwtService jwt = service(1); // expires almost immediately
        String token = jwt.generateToken("u@fpt.edu.vn", "STUDENT");
        Thread.sleep(20);

        assertThat(jwt.isValid(token)).isFalse();
    }

    @Test
    void isValid_returnsFalse_forGarbage() {
        JwtService jwt = service(60_000);

        assertThat(jwt.isValid("not-a-jwt")).isFalse();
        assertThat(jwt.isValid("")).isFalse();
    }

    @Test
    void isValid_returnsFalse_whenSignedWithADifferentSecret() {
        String token = new JwtService("another-secret-key-also-long-enough-0987654321", 60_000)
                .generateToken("u@fpt.edu.vn", "STUDENT");

        // A token signed by a different key must be rejected by this service.
        assertThat(service(60_000).isValid(token)).isFalse();
    }
}
