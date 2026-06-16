package com.fpt.seal.hms.lecturer;

import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.lecturer.dto.LecturerRequest;
import com.fpt.seal.hms.lecturer.dto.LecturerResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lecturers")
@RequiredArgsConstructor
public class LecturerController {

    private final LecturerService lecturerService;

    /** Create the current user's lecturer profile. */
    @PostMapping
    public ApiResponse<LecturerResponse> create(Authentication auth, @Valid @RequestBody LecturerRequest req) {
        return ApiResponse.ok("Profile created", lecturerService.createMyProfile(auth.getName(), req));
    }

    /** Current user's lecturer profile. */
    @GetMapping("/me")
    public ApiResponse<LecturerResponse> myProfile(Authentication auth) {
        return ApiResponse.ok(lecturerService.getMyProfile(auth.getName()));
    }

    /** Update the current user's lecturer profile. */
    @PutMapping("/me")
    public ApiResponse<LecturerResponse> updateMyProfile(Authentication auth, @Valid @RequestBody LecturerRequest req) {
        return ApiResponse.ok("Profile updated", lecturerService.updateMyProfile(auth.getName(), req));
    }

    /** Coordinator: list all lecturer profiles. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<List<LecturerResponse>> list() {
        return ApiResponse.ok(lecturerService.listAll());
    }

    /** Coordinator: one lecturer profile by id. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<LecturerResponse> getOne(@PathVariable Long id) {
        return ApiResponse.ok(lecturerService.getById(id));
    }
}
