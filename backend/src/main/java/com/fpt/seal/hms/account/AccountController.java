package com.fpt.seal.hms.account;

import com.fpt.seal.hms.account.dto.AccountProfileResponse;
import com.fpt.seal.hms.account.dto.AccountResponse;
import com.fpt.seal.hms.account.dto.UpdateRoleRequest;
import com.fpt.seal.hms.account.dto.UpdateStatusRequest;
import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.common.enums.AccountStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /** Current authenticated user's email. */
    @GetMapping("/me")
    public ApiResponse<String> me(Authentication authentication) {
        return ApiResponse.ok(authentication.getName());
    }

    /** Upload avatar for current user. */
    @PostMapping("/me/avatar")
    public ApiResponse<String> uploadAvatar(Authentication authentication, @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        String avatarUrl = accountService.uploadAvatar(authentication.getName(), file);
        return ApiResponse.ok("Avatar uploaded", avatarUrl);
    }

    /** List accounts, optionally filtered by status (e.g. ?status=PENDING). Coordinator only. */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<List<com.fpt.seal.hms.account.dto.AccountProfileResponse>> list(@RequestParam(required = false) AccountStatus status) {
        List<AccountProfileResponse> result = accountService.getAccountProfiles(status);
        return ApiResponse.ok(result);
    }

    /** Get one account by id. Coordinator only. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<AccountResponse> getOne(@PathVariable Long id) {
        return ApiResponse.ok(AccountResponse.from(accountService.getById(id)));
    }

    /** Approve a pending account (PENDING -> ACTIVE). Coordinator only. */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<AccountResponse> approve(@PathVariable Long id) {
        return ApiResponse.ok("Account approved", AccountResponse.from(accountService.approve(id)));
    }

    /** Set an account's status (ACTIVE / PENDING / DISABLED). Coordinator only. */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<AccountResponse> updateStatus(@PathVariable Long id,
                                                     @Valid @RequestBody UpdateStatusRequest request) {
        return ApiResponse.ok("Status updated",
                AccountResponse.from(accountService.updateStatus(id, request.status())));
    }

    /** Change an account's role. ADMIN only (privileged action). */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AccountResponse> updateRole(@PathVariable Long id,
                                                   @Valid @RequestBody UpdateRoleRequest request) {
        return ApiResponse.ok("Role updated",
                AccountResponse.from(accountService.updateRole(id, request.role())));
    }

    /** Delete an account and its profile completely (e.g. Reject a pending student). */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ApiResponse<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ApiResponse.ok("Account deleted successfully", null);
    }
}
