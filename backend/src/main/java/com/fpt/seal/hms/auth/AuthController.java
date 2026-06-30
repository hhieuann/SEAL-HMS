package com.fpt.seal.hms.auth;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.account.dto.AccountResponse;
import com.fpt.seal.hms.auth.dto.AuthResponse;
import com.fpt.seal.hms.auth.dto.LoginRequest;
import com.fpt.seal.hms.auth.dto.RegisterRequest;
import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.common.exception.BusinessException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AccountService accountService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final com.fpt.seal.hms.common.service.FileStorageService fileStorageService;

    @PostMapping(value = "/register", consumes = "multipart/form-data")
    public ApiResponse<AccountResponse> register(@Valid @org.springframework.web.bind.annotation.ModelAttribute RegisterRequest request) {
        String proofUrl = null;
        if (request.proofFile() != null && !request.proofFile().isEmpty()) {
            proofUrl = fileStorageService.storeFile(request.proofFile());
        }
        Account account = accountService.register(request.email(), request.password(), request.role(), request.studentCode(), request.firstName(), request.lastName(), request.campus(), proofUrl);
        return ApiResponse.ok("Registered", AccountResponse.from(account));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Account account = accountService.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Account not found with this email."));
        if (!passwordEncoder.matches(request.password(), account.getPassword())) {
            throw new BusinessException("Incorrect password.");
        }
        
        if (account.getStatus() == com.fpt.seal.hms.common.enums.AccountStatus.PENDING) {
            throw new BusinessException("Your account is pending approval. Please wait for an administrator to review your registration.");
        } else if (account.getStatus() == com.fpt.seal.hms.common.enums.AccountStatus.DISABLED) {
            throw new BusinessException("Your account has been disabled.");
        }
        String token = jwtService.generateToken(account.getEmail(), account.getRole().name());
        String name = accountService.getFullName(account);
        return ApiResponse.ok(new AuthResponse(token, account.getRole().name(), account.getId(), name));
    }
}
