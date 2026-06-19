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

    @PostMapping("/register")
    public ApiResponse<AccountResponse> register(@Valid @RequestBody RegisterRequest request) {
        Account account = accountService.register(request.email(), request.password(), request.role());
        return ApiResponse.ok("Registered", AccountResponse.from(account));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        Account account = accountService.findByEmail(request.email())
                .orElseThrow(() -> new BusinessException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), account.getPassword())) {
            throw new BusinessException("Invalid email or password");
        }
        String token = jwtService.generateToken(account.getEmail(), account.getRole().name());
        return ApiResponse.ok(new AuthResponse(token, account.getRole().name(), account.getId()));
    }
}
