package com.fpt.seal.hms.auth;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.service.FileStorageService;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer tests for AuthController — login guards (bad password / PENDING /
 *  DISABLED), multipart register, and authenticated change-password. */
@WebMvcTest(AuthController.class)
@Import(WebMvcTestSecurityConfig.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AccountService accountService;
    @MockitoBean private PasswordEncoder passwordEncoder;
    @MockitoBean private FileStorageService fileStorageService;

    private Account account(AccountStatus status) {
        Account a = new Account();
        a.setId(1L);
        a.setEmail("an@fpt.edu.vn");
        a.setPassword("ENC");
        a.setRole(Role.STUDENT);
        a.setStatus(status);
        return a;
    }

    private static final String LOGIN_BODY = "{\"email\":\"an@fpt.edu.vn\",\"password\":\"secret1\"}";

    @Test
    void login_activeAccount_returnsTokenAndRole() throws Exception {
        when(accountService.findByEmail("an@fpt.edu.vn")).thenReturn(Optional.of(account(AccountStatus.ACTIVE)));
        when(passwordEncoder.matches("secret1", "ENC")).thenReturn(true);
        when(accountService.getFullName(any())).thenReturn("Nguyen Hieu An");

        mockMvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType("application/json").content(LOGIN_BODY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.role").value("STUDENT"))
                .andExpect(jsonPath("$.data.name").value("Nguyen Hieu An"));
    }

    @Test
    void login_wrongPassword_badRequest() throws Exception {
        when(accountService.findByEmail("an@fpt.edu.vn")).thenReturn(Optional.of(account(AccountStatus.ACTIVE)));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        mockMvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType("application/json").content(LOGIN_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void login_pendingAccount_rejectedWithClearMessage() throws Exception {
        when(accountService.findByEmail("an@fpt.edu.vn")).thenReturn(Optional.of(account(AccountStatus.PENDING)));
        when(passwordEncoder.matches("secret1", "ENC")).thenReturn(true);

        mockMvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType("application/json").content(LOGIN_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("pending approval")));
    }

    @Test
    void login_disabledAccount_rejected() throws Exception {
        when(accountService.findByEmail("an@fpt.edu.vn")).thenReturn(Optional.of(account(AccountStatus.DISABLED)));
        when(passwordEncoder.matches("secret1", "ENC")).thenReturn(true);

        mockMvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType("application/json").content(LOGIN_BODY))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("disabled")));
    }

    @Test
    void login_unknownEmail_badRequest() throws Exception {
        when(accountService.findByEmail("an@fpt.edu.vn")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/v1/auth/login").with(csrf())
                        .contentType("application/json").content(LOGIN_BODY))
                .andExpect(status().isBadRequest());
    }

    @Test
    void register_multipart_storesProofAndDelegates() throws Exception {
        when(fileStorageService.storeFile(any())).thenReturn("/uploads/proof.png");
        when(accountService.register(any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(account(AccountStatus.PENDING));

        mockMvc.perform(multipart("/api/v1/auth/register")
                        .file(new MockMultipartFile("proofFile", "proof.png", "image/png", "img".getBytes()))
                        .param("email", "sv@fpt.edu.vn")
                        .param("password", "secret1")
                        .param("role", "STUDENT")
                        .param("studentCode", "SE123456")
                        .param("firstName", "An")
                        .param("lastName", "Nguyen")
                        .param("campus", "HCM")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        verify(accountService).register(eq("sv@fpt.edu.vn"), eq("secret1"), eq(Role.STUDENT),
                eq("SE123456"), eq("An"), eq("Nguyen"), eq("HCM"), eq("/uploads/proof.png"));
    }

    @Test
    void changePassword_authenticated_delegatesWithPrincipalEmail() throws Exception {
        mockMvc.perform(put("/api/v1/auth/change-password")
                        .with(user("an@fpt.edu.vn").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"oldPassword\":\"old-pass\",\"newPassword\":\"new-pass\"}"))
                .andExpect(status().isOk());
        verify(accountService).changePassword("an@fpt.edu.vn", "old-pass", "new-pass");
    }
}
