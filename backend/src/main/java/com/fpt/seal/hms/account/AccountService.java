package com.fpt.seal.hms.account;

import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fpt.seal.hms.student.Student;
import com.fpt.seal.hms.student.StudentRepository;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;

    @Transactional
    public Account register(String email, String rawPassword, Role role, String studentCode, String firstName, String lastName, String campus) {
        if (accountRepository.existsByEmail(email)) {
            throw new BusinessException("Email already registered: " + email);
        }
        // Self-registration must not grant privileged roles. Only STUDENT/LECTURER
        // can be self-registered; ADMIN/STAFF/GUEST_JUDGE are assigned by an admin
        // afterwards via PATCH /accounts/{id}/role.
        Role assignedRole = (role != null) ? role : Role.STUDENT;
        if (assignedRole != Role.STUDENT && assignedRole != Role.LECTURER) {
            throw new BusinessException("Self-registration is only allowed for STUDENT or LECTURER");
        }

        // A STUDENT account must carry a unique student code.
        boolean isStudent = assignedRole == Role.STUDENT;
        String normalizedCode = studentCode != null ? studentCode.trim() : null;
        if (isStudent) {
            if (normalizedCode == null || normalizedCode.isBlank()) {
                throw new BusinessException("Student code is required to register as a STUDENT");
            }
            if (studentRepository.existsByStudentCode(normalizedCode)) {
                throw new BusinessException("Student code already registered: " + normalizedCode);
            }
        }

        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(assignedRole);
        account.setStatus(AccountStatus.PENDING); // admin/staff activate later

        Account savedAccount = accountRepository.save(account);

        if (isStudent) {
            Student student = new Student();
            student.setAccount(savedAccount);
            student.setStudentCode(normalizedCode);
            student.setFirstName(firstName);
            student.setLastName(lastName);
            student.setCampus(campus);
            studentRepository.save(student);
        }
        
        return savedAccount;
    }

    /**
     * Admin creates a Lecturer account directly — bypasses PENDING, immediately ACTIVE.
     * Returns a pair of [savedAccount, rawPassword] so the caller can show the temp password once.
     */
    @Transactional
    public Object[] adminCreateLecturer(String email, String fullName, String department, String campus, String phone) {
        if (accountRepository.existsByEmail(email)) {
            throw new BusinessException("Email already registered: " + email);
        }

        // Auto-generate a secure temp password
        String rawPassword = generateTempPassword();

        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(Role.LECTURER);
        account.setStatus(AccountStatus.ACTIVE); // admin-created accounts skip PENDING

        Account savedAccount = accountRepository.save(account);

        Lecturer lecturer = new Lecturer();
        lecturer.setAccount(savedAccount);
        lecturer.setFullName(fullName);
        lecturer.setDepartment(department);
        lecturer.setCampus(campus);
        lecturer.setPhone(phone);
        lecturerRepository.save(lecturer);

        return new Object[]{savedAccount, rawPassword};
    }

    private String generateTempPassword() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "@#!";
        String all = upper + lower + digits + special;
        java.util.Random rng = new java.util.Random();
        StringBuilder sb = new StringBuilder();
        sb.append(upper.charAt(rng.nextInt(upper.length())));
        sb.append(lower.charAt(rng.nextInt(lower.length())));
        sb.append(digits.charAt(rng.nextInt(digits.length())));
        sb.append(special.charAt(rng.nextInt(special.length())));
        for (int i = 0; i < 8; i++) sb.append(all.charAt(rng.nextInt(all.length())));
        // Shuffle
        char[] arr = sb.toString().toCharArray();
        for (int i = arr.length - 1; i > 0; i--) {
            int j = rng.nextInt(i + 1);
            char tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return new String(arr);
    }

    @Transactional(readOnly = true)
    public Optional<Account> findByEmail(String email) {
        return accountRepository.findByEmail(email);
    }

    @Transactional(readOnly = true)
    public Account getById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Account> list(AccountStatus status) {
        return status == null ? accountRepository.findAll() : accountRepository.findByStatus(status);
    }

    /** Event Coordinator approves a PENDING account so the user can participate (AU-03). */
    @Transactional
    public Account approve(Long id) {
        Account account = getById(id);
        if (account.getStatus() != AccountStatus.PENDING) {
            throw new BusinessException("Only PENDING accounts can be approved (current: " + account.getStatus() + ")");
        }
        account.setStatus(AccountStatus.ACTIVE);
        return account; // managed entity flushes on commit
    }

    /** Enable / disable / reset an account's status. */
    @Transactional
    public Account updateStatus(Long id, AccountStatus status) {
        Account account = getById(id);
        account.setStatus(status);
        return account;
    }

    /** Change an account's role (AU-02). Restricted to ADMIN at the controller. */
    @Transactional
    public Account updateRole(Long id, Role role) {
        Account account = getById(id);
        account.setRole(role);
        return account;
    }
}
