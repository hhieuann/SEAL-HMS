package com.fpt.seal.hms.student;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.student.dto.StudentRequest;
import com.fpt.seal.hms.student.dto.StudentResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    /** Create the current user's student profile. */
    @PostMapping
    public ApiResponse<StudentResponse> create(Authentication auth, @Valid @RequestBody StudentRequest req) {
        return ApiResponse.ok("Profile created", studentService.createMyProfile(auth.getName(), req));
    }

    /** Current user's student profile. */
    @GetMapping("/me")
    public ApiResponse<StudentResponse> myProfile(Authentication auth) {
        return ApiResponse.ok(studentService.getMyProfile(auth.getName()));
    }

    /** Update the current user's student profile. */
    @PutMapping("/me")
    public ApiResponse<StudentResponse> updateMyProfile(Authentication auth, @Valid @RequestBody StudentRequest req) {
        return ApiResponse.ok("Profile updated", studentService.updateMyProfile(auth.getName(), req));
    }

    /** Coordinator: list all student profiles. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<List<StudentResponse>> list() {
        return ApiResponse.ok(studentService.listAll());
    }

    /** Coordinator: one student profile by id. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<StudentResponse> getOne(@PathVariable Long id) {
        return ApiResponse.ok(studentService.getById(id));
    }
}
