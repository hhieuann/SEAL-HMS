package com.fpt.seal.hms.student;

import com.fpt.seal.hms.student.dto.StudentResponse;
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

@WebMvcTest(StudentController.class)
@Import(WebMvcTestSecurityConfig.class)
class StudentControllerTest {

    @Autowired private MockMvc mockMvc;
    @MockitoBean private StudentService studentService;

    private StudentResponse mockResponse() {
        return new StudentResponse(1L, 10L, "student@fpt.edu.vn", null, "John", "Doe", "HCM", "SE12345");
    }

    @Test
    void createProfile_ok() throws Exception {
        when(studentService.createMyProfile(eq("student@fpt.edu.vn"), any())).thenReturn(mockResponse());
        mockMvc.perform(post("/api/v1/students").with(user("student@fpt.edu.vn").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"firstName\":\"John\",\"lastName\":\"Doe\",\"campus\":\"HCM\",\"studentCode\":\"SE12345\",\"email\":\"student@fpt.edu.vn\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.firstName").value("John"));
    }

    @Test
    void myProfile_ok() throws Exception {
        when(studentService.getMyProfile("student@fpt.edu.vn")).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/students/me").with(user("student@fpt.edu.vn").roles("STUDENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.firstName").value("John"));
    }

    @Test
    void updateMyProfile_ok() throws Exception {
        when(studentService.updateMyProfile(eq("student@fpt.edu.vn"), any())).thenReturn(mockResponse());
        mockMvc.perform(put("/api/v1/students/me").with(user("student@fpt.edu.vn").roles("STUDENT")).with(csrf())
                        .contentType("application/json")
                        .content("{\"firstName\":\"John\",\"lastName\":\"Doe\",\"campus\":\"HCM\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void list_asAdmin_ok() throws Exception {
        when(studentService.listAll()).thenReturn(List.of(mockResponse()));
        mockMvc.perform(get("/api/v1/students").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void list_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/students").with(user("student").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOne_asStaff_ok() throws Exception {
        when(studentService.getById(1L)).thenReturn(mockResponse());
        mockMvc.perform(get("/api/v1/students/1").with(user("staff").roles("STAFF")))
                .andExpect(status().isOk());
    }

    @Test
    void getOne_asStudent_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/students/1").with(user("student").roles("STUDENT")))
                .andExpect(status().isForbidden());
    }
}
