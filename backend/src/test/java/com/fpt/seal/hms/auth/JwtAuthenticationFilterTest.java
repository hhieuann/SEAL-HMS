package com.fpt.seal.hms.auth;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterTest {

    @Mock private JwtService jwtService;
    @InjectMocks private JwtAuthenticationFilter filter;

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private MockHttpServletRequest request(String authHeader) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        if (authHeader != null) req.addHeader("Authorization", authHeader);
        return req;
    }

    @Test
    void validBearerToken_populatesSecurityContextWithRolePrefix() throws Exception {
        when(jwtService.isValid("tok")).thenReturn(true);
        when(jwtService.extractEmail("tok")).thenReturn("an@fpt.edu.vn");
        when(jwtService.extractRole("tok")).thenReturn("ADMIN");
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest req = request("Bearer tok");
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilter(req, res, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.getName()).isEqualTo("an@fpt.edu.vn");
        assertThat(auth.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_ADMIN");
        verify(chain).doFilter(req, res);
    }

    @Test
    void invalidToken_leavesContextEmpty_butContinuesChain() throws Exception {
        when(jwtService.isValid("bad")).thenReturn(false);
        FilterChain chain = mock(FilterChain.class);
        MockHttpServletRequest req = request("Bearer bad");
        MockHttpServletResponse res = new MockHttpServletResponse();

        filter.doFilter(req, res, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(req, res);
    }

    @Test
    void missingOrNonBearerHeader_skipsAuthentication() throws Exception {
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request(null), new MockHttpServletResponse(), chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();

        filter.doFilter(request("Basic abc"), new MockHttpServletResponse(), chain);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(jwtService, never()).isValid(any());
    }
}
