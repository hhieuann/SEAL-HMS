package com.fpt.seal.hms.account;

import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Web-layer tests for AccountController — coordinator-only list/approve/status,
 *  admin-only role change. */
@WebMvcTest(AccountController.class)
@Import(WebMvcTestSecurityConfig.class)
class AccountControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AccountService accountService;

    private Account account() {
        Account a = new Account();
        a.setId(1L);
        a.setEmail("u@fpt.edu.vn");
        a.setRole(Role.STUDENT);
        a.setStatus(AccountStatus.ACTIVE);
        return a;
    }

    @Test
    void list_asAdmin_ok() throws Exception {
        when(accountService.getAccountProfiles(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/accounts").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void list_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/accounts").with(user("sv").roles("STUDENT")))
                .andExpect(status().isForbidden());
        verify(accountService, never()).getAccountProfiles(any());
    }

    @Test
    void approve_asStaff_ok() throws Exception {
        when(accountService.approve(1L)).thenReturn(account());

        mockMvc.perform(patch("/api/v1/accounts/1/approve")
                        .with(user("staff").roles("STAFF")).with(csrf()))
                .andExpect(status().isOk());
        verify(accountService).approve(1L);
    }

    @Test
    void updateRole_requiresAdmin_staffForbidden() throws Exception {
        // role change is hasRole('ADMIN') — STAFF must be rejected
        mockMvc.perform(patch("/api/v1/accounts/1/role")
                        .with(user("staff").roles("STAFF")).with(csrf())
                        .contentType("application/json").content("{\"role\":\"LECTURER\"}"))
                .andExpect(status().isForbidden());
        verify(accountService, never()).updateRole(any(), any());
    }

    @Test
    void updateRole_asAdmin_ok() throws Exception {
        when(accountService.updateRole(any(), any())).thenReturn(account());

        mockMvc.perform(patch("/api/v1/accounts/1/role")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json").content("{\"role\":\"LECTURER\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteAccount_asStudent_forbidden() throws Exception {
        mockMvc.perform(delete("/api/v1/accounts/1")
                        .with(user("sv").roles("STUDENT")).with(csrf()))
                .andExpect(status().isForbidden());
        verify(accountService, never()).deleteAccount(any());
    }
}
