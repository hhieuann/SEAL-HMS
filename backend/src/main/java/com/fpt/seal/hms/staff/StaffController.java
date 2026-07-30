package com.fpt.seal.hms.staff;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.dto.ApiResponse;
import com.fpt.seal.hms.staff.dto.AdminCreateStaffRequest;
import com.fpt.seal.hms.staff.dto.AdminCreateStaffResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.staff.dto.StaffRequest;
import com.fpt.seal.hms.staff.dto.StaffResponse;
import com.fpt.seal.hms.staff.entity.Staff;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffController {

    private final AccountService accountService;
    private final StaffRepository staffRepository;
    private final AccountRepository accountRepository;

    @PostMapping("/admin-create")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<AdminCreateStaffResponse> adminCreate(@Valid @RequestBody AdminCreateStaffRequest req) {
        Object[] result = accountService.adminCreateStaff(
                req.email(), req.fullName(), req.department(), req.campus(), req.phone());
        Account account = (Account) result[0];
        String tempPassword = (String) result[1];
        return ApiResponse.ok("Staff created",
                AdminCreateStaffResponse.from(account, req.fullName(), tempPassword));
    }

    @GetMapping("/me")
    public ApiResponse<StaffResponse> myProfile(Authentication auth) {
        Account acc = accountRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Staff staff = staffRepository.findByAccount_Id(acc.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff profile not found"));
        return ApiResponse.ok(StaffResponse.from(staff, acc));
    }

    @PutMapping("/me")
    public ApiResponse<StaffResponse> updateMyProfile(Authentication auth, @Valid @RequestBody StaffRequest req) {
        Account acc = accountRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        Staff staff = staffRepository.findByAccount_Id(acc.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff profile not found"));
        
        accountService.validatePhoneUnique(req.phone(), staff.getId());
        staff.setFullName(req.fullName());
        staff.setDepartment(req.department());
        staff.setCampus(req.campus());
        staff.setPhone(req.phone());
        staffRepository.save(staff);
        
        return ApiResponse.ok("Profile updated", StaffResponse.from(staff, acc));
    }
}
