package com.fpt.seal.hms.account;

import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public Account register(String email, String rawPassword, Role role) {
        if (accountRepository.existsByEmail(email)) {
            throw new BusinessException("Email already registered: " + email);
        }
        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(role != null ? role : Role.STUDENT);
        account.setStatus(AccountStatus.PENDING); // admin/staff activate later
        return accountRepository.save(account);
    }

    @Transactional(readOnly = true)
    public Optional<Account> findByEmail(String email) {
        return accountRepository.findByEmail(email);
    }
}
