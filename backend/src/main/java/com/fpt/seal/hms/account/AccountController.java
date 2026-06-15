package com.fpt.seal.hms.account;

import com.fpt.seal.hms.common.dto.ApiResponse;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/accounts")
public class AccountController {

    // Example of a protected endpoint: returns the current authenticated user's email.
    @GetMapping("/me")
    public ApiResponse<String> me(Authentication authentication) {
        return ApiResponse.ok(authentication.getName());
    }
}
