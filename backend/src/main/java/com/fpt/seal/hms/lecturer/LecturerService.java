package com.fpt.seal.hms.lecturer;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.lecturer.dto.LecturerRequest;
import com.fpt.seal.hms.lecturer.dto.LecturerResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LecturerService {

    private final LecturerRepository lecturerRepository;
    private final AccountService accountService;

    /** Current user creates their own lecturer profile (1:1 with their account). */
    @Transactional
    public LecturerResponse createMyProfile(String email, LecturerRequest req) {
        Account account = requireAccount(email);
        if (account.getRole() != Role.LECTURER) {
            throw new BusinessException("Only LECTURER accounts can have a lecturer profile (role: " + account.getRole() + ")");
        }
        if (lecturerRepository.existsByAccount_Id(account.getId())) {
            throw new BusinessException("A lecturer profile already exists for this account");
        }
        Lecturer l = new Lecturer();
        l.setAccount(account);
        apply(l, req);
        return LecturerResponse.from(lecturerRepository.save(l));
    }

    @Transactional(readOnly = true)
    public LecturerResponse getMyProfile(String email) {
        return LecturerResponse.from(myProfileEntity(requireAccount(email).getId()));
    }

    @Transactional
    public LecturerResponse updateMyProfile(String email, LecturerRequest req) {
        Account account = requireAccount(email);
        Lecturer l = myProfileEntity(account.getId());
        apply(l, req);
        accountService.updateEmail(account, req.email());
        l = lecturerRepository.save(l);
        return LecturerResponse.from(l);
    }

    @Transactional(readOnly = true)
    public List<LecturerResponse> listAll() {
        return lecturerRepository.findAll().stream().map(LecturerResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public LecturerResponse getById(Long id) {
        return lecturerRepository.findById(id).map(LecturerResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer profile not found: " + id));
    }

    private Account requireAccount(String email) {
        return accountService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));
    }

    private Lecturer myProfileEntity(Long accountId) {
        return lecturerRepository.findByAccount_Id(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("No lecturer profile yet; create it first"));
    }

    private void apply(Lecturer l, LecturerRequest req) {
        l.setFullName(req.fullName());
        l.setDepartment(req.department());
        l.setCampus(req.campus());
        l.setPhone(req.phone());
    }
}
