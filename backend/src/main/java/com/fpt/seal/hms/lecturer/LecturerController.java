package com.fpt.seal.hms.lecturer;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.lecturer.dto.AdminCreateLecturerRequest;
import com.fpt.seal.hms.lecturer.dto.AdminCreateLecturerResponse;
import com.fpt.seal.hms.lecturer.dto.LecturerRequest;
import com.fpt.seal.hms.lecturer.dto.LecturerResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/lecturers")
@RequiredArgsConstructor
public class LecturerController {

    private final LecturerService lecturerService;
    private final AccountService accountService;

    /** Admin: create a lecturer account + profile in one step. Returns temp password. */
    @PostMapping("/admin-create")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<AdminCreateLecturerResponse> adminCreate(@Valid @RequestBody AdminCreateLecturerRequest req) {
        Object[] result = accountService.adminCreateLecturer(
                req.email(), req.fullName(), req.department(), req.campus(), req.phone());
        Account account = (Account) result[0];
        String tempPassword = (String) result[1];
        return ApiResponse.ok("Lecturer account created",
                AdminCreateLecturerResponse.from(account, req.fullName(), tempPassword));
    }

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
