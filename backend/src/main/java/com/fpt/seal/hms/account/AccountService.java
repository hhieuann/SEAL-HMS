package com.fpt.seal.hms.account;

import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.fpt.seal.hms.student.Student;
import com.fpt.seal.hms.student.StudentRepository;
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

    @Transactional
    public Account register(String email, String rawPassword, Role role) {
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
        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(assignedRole);
        account.setStatus(AccountStatus.PENDING); // admin/staff activate later
        
        Account savedAccount = accountRepository.save(account);
        
        if (savedAccount.getRole() == Role.STUDENT) {
            Student student = new Student();
            student.setAccount(savedAccount);
            studentRepository.save(student);
        }
        
        return savedAccount;
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
