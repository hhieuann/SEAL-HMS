package com.fpt.seal.hms.student;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.student.dto.StudentRequest;
import com.fpt.seal.hms.student.dto.StudentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final AccountService accountService;

    /** Current user creates their own student profile (1:1 with their account). */
    @Transactional
    public StudentResponse createMyProfile(String email, StudentRequest req) {
        Account account = requireAccount(email);
        if (account.getRole() != Role.STUDENT) {
            throw new BusinessException("Only STUDENT accounts can have a student profile (role: " + account.getRole() + ")");
        }
        if (studentRepository.existsByAccount_Id(account.getId())) {
            throw new BusinessException("A student profile already exists for this account");
        }
        Student s = new Student();
        s.setAccount(account);
        apply(s, req);
        applyStudentCode(s, req);
        return StudentResponse.from(studentRepository.save(s));
    }

    @Transactional(readOnly = true)
    public StudentResponse getMyProfile(String email) {
        return StudentResponse.from(myProfileEntity(requireAccount(email).getId()));
    }

    @Transactional
    public StudentResponse updateMyProfile(String email, StudentRequest req) {
        Account account = requireAccount(email);
        Student s = myProfileEntity(account.getId());
        apply(s, req);
        applyStudentCode(s, req);
        accountService.updateEmail(account, req.email());
        s = studentRepository.save(s);
        return StudentResponse.from(s); 
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> listAll() {
        return studentRepository.findAll().stream().map(StudentResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse getById(Long id) {
        return studentRepository.findById(id).map(StudentResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found: " + id));
    }

    private Account requireAccount(String email) {
        return accountService.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));
    }

    private Student myProfileEntity(Long accountId) {
        return studentRepository.findByAccount_Id(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("No student profile yet; create it first"));
    }

    private void apply(Student s, StudentRequest req) {
        s.setFirstName(req.firstName());
        s.setLastName(req.lastName());
        s.setCampus(req.campus());
    }

    /** Validate + set the student code only when a new, different value is supplied. */
    private void applyStudentCode(Student s, StudentRequest req) {
        String code = req.studentCode() != null ? req.studentCode().trim() : null;
        if (code == null || code.isBlank() || code.equalsIgnoreCase(s.getStudentCode())) {
            return; // not provided or unchanged
        }
        if (!code.toUpperCase().matches("^[A-Za-z]{2}\\d{6}$")) {
            throw new BusinessException("Student code must be 2 letters followed by 6 digits (e.g. SE204911)");
        }
        if (studentRepository.existsByStudentCode(code)) {
            throw new BusinessException("Student code already registered: " + code);
        }
        s.setStudentCode(code);
    }
}
