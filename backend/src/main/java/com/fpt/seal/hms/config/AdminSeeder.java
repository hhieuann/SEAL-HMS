package com.fpt.seal.hms.config;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds a default ADMIN (Event Coordinator) on first run so account approval and
 * role management (AU-03) are usable out of the box. Runs only when no ADMIN exists.
 * Override credentials via app.admin.email / app.admin.password (env or properties).
 */
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@seal-hms.local}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@12345}")
    private String adminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (accountRepository.existsByRole(Role.ADMIN)) {
            return; // an admin already exists — nothing to seed
        }
        Account admin = new Account();
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode(adminPassword));
        admin.setRole(Role.ADMIN);
        admin.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(admin);
        log.warn("Seeded default ADMIN '{}' (status ACTIVE). CHANGE THE PASSWORD after first login!", adminEmail);
    }
}
