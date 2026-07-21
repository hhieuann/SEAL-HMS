package com.fpt.seal.hms.staff;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.staff.dto.StaffResponse;
import com.fpt.seal.hms.staff.entity.Staff;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StaffController.class)
@Import(WebMvcTestSecurityConfig.class)
class StaffControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private AccountService accountService;
    @MockitoBean private StaffRepository staffRepository;
    @MockitoBean private AccountRepository accountRepository;

    private Account mockAccount() {
        Account acc = new Account();
        acc.setId(10L);
        acc.setEmail("staff@fpt.edu.vn");
        acc.setAvatarUrl(null);
        return acc;
    }

    private Staff mockStaff() {
        Staff s = new Staff();
        s.setId(1L);
        s.setFullName("Staff One");
        s.setDepartment("IT");
        s.setCampus("HCM");
        s.setPhone("0901234567");
        s.setAccount(mockAccount());
        return s;
    }

    @Test
    void adminCreate_asAdmin_returns200() throws Exception {
        Account acc = mockAccount();
        when(accountService.adminCreateStaff(any(), any(), any(), any(), any()))
                .thenReturn(new Object[]{acc, "tempPass123"});

        mockMvc.perform(post("/api/v1/staff/admin-create").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"email\":\"staff@fpt.edu.vn\",\"fullName\":\"Staff One\",\"department\":\"IT\",\"campus\":\"HCM\",\"phone\":\"0901234567\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.tempPassword").value("tempPass123"));
    }

    @Test
    void adminCreate_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/staff/admin-create").with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"email\":\"staff@fpt.edu.vn\",\"fullName\":\"Staff One\",\"department\":\"IT\",\"campus\":\"HCM\",\"phone\":\"0901234567\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void myProfile_ok() throws Exception {
        Account acc = mockAccount();
        Staff staff = mockStaff();
        when(accountRepository.findByEmail("staff@fpt.edu.vn")).thenReturn(Optional.of(acc));
        when(staffRepository.findByAccount_Id(10L)).thenReturn(Optional.of(staff));

        mockMvc.perform(get("/api/v1/staff/me").with(user("staff@fpt.edu.vn").roles("STAFF")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Staff One"));
    }

    @Test
    void updateMyProfile_ok() throws Exception {
        Account acc = mockAccount();
        Staff staff = mockStaff();
        when(accountRepository.findByEmail("staff@fpt.edu.vn")).thenReturn(Optional.of(acc));
        when(staffRepository.findByAccount_Id(10L)).thenReturn(Optional.of(staff));
        when(staffRepository.save(any())).thenReturn(staff);

        mockMvc.perform(put("/api/v1/staff/me").with(user("staff@fpt.edu.vn").roles("STAFF")).with(csrf())
                        .contentType("application/json")
                        .content("{\"fullName\":\"Staff Updated\",\"department\":\"IT\",\"campus\":\"HCM\",\"phone\":\"0901234567\"}"))
                .andExpect(status().isOk());
    }
}
