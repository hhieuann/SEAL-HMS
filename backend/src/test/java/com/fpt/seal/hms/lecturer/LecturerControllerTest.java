package com.fpt.seal.hms.lecturer;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.lecturer.dto.LecturerResponse;
import com.fpt.seal.hms.support.WebMvcTestSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LecturerController.class)
@Import(WebMvcTestSecurityConfig.class)
class LecturerControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private LecturerService lecturerService;
    @MockitoBean private AccountService accountService;

    private LecturerResponse mockResponse() {
        return new LecturerResponse(1L, 10L, "john@fpt.edu.vn", null, "Dr. John", "CS", "Hanoi", "1234567890");
    }

    @Test
    void adminCreate_asAdmin_returns201() throws Exception {
        Account mockAcc = new Account();
        mockAcc.setId(10L);
        mockAcc.setEmail("john@fpt.edu.vn");
        when(accountService.adminCreateLecturer(any(), any(), any(), any(), any()))
                .thenReturn(new Object[]{mockAcc, "tempPass123"});

        mockMvc.perform(post("/api/v1/lecturers/admin-create").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType("application/json")
                        .content("{\"email\":\"john@fpt.edu.vn\",\"fullName\":\"Dr. John\",\"department\":\"CS\",\"campus\":\"Hanoi\",\"phone\":\"1234567890\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.tempPassword").value("tempPass123"))
                .andExpect(jsonPath("$.data.fullName").value("Dr. John"));
    }

    @Test
    void adminCreate_asStudent_forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/lecturers/admin-create").with(user("student").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"email\":\"john@fpt.edu.vn\",\"fullName\":\"Dr. John\",\"department\":\"CS\",\"campus\":\"Hanoi\",\"phone\":\"1234567890\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void createMyProfile_ok() throws Exception {
        when(lecturerService.createMyProfile(eq("john@fpt.edu.vn"), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/lecturers").with(user("john@fpt.edu.vn").roles("LECTURER")).with(csrf())
                        .contentType("application/json")
                        .content("{\"fullName\":\"Dr. John\",\"department\":\"CS\",\"campus\":\"Hanoi\",\"phone\":\"1234567890\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Dr. John"));
    }

    @Test
    void myProfile_ok() throws Exception {
        when(lecturerService.getMyProfile("john@fpt.edu.vn")).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/lecturers/me").with(user("john@fpt.edu.vn").roles("LECTURER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Dr. John"));
    }

    @Test
    void updateMyProfile_ok() throws Exception {
        when(lecturerService.updateMyProfile(eq("john@fpt.edu.vn"), any())).thenReturn(mockResponse());
        mockMvc.perform(put("/api/v1/lecturers/me").with(user("john@fpt.edu.vn").roles("LECTURER")).with(csrf())
                        .contentType("application/json")
                        .content("{\"fullName\":\"Dr. John\",\"department\":\"CS\",\"campus\":\"Hanoi\",\"phone\":\"1234567890\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void list_asStaff_ok() throws Exception {
        when(lecturerService.listAll()).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/lecturers").with(user("staff").roles("STAFF")))
                .andExpect(status().isOk());
    }

    @Test
    void list_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/lecturers").with(user("student").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOne_asAdmin_ok() throws Exception {
        when(lecturerService.getById(1L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/lecturers/1").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }
}
