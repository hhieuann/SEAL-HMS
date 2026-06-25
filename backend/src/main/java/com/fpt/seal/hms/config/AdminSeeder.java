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
 * Seeds a default ADMIN (Event Coordinator) and a default STAFF on first run so
 * account approval, role management (AU-03) and event management are usable out of
 * the box. Each role is seeded only when no account of that role exists yet.
 * Override credentials via app.admin.* / app.staff.* (env or properties).
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

    @Value("${app.staff.email:staff@seal-hms.local}")
    private String staffEmail;

    @Value("${app.staff.password:Staff@12345}")
    private String staffPassword;

    @Value("${app.lecturer.email:lecturer@seal-hms.local}")
    private String lecturerEmail;

    @Value("${app.lecturer.password:Lecturer@12345}")
    private String lecturerPassword;

    @Value("${app.student.email:student@seal-hms.local}")
    private String studentEmail;

    @Value("${app.student.password:Student@12345}")
    private String studentPassword;

    @Value("${app.guest_judge.email:judge@seal-hms.local}")
    private String guestJudgeEmail;

    @Value("${app.guest_judge.password:Judge@12345}")
    private String guestJudgePassword;

    @Override
    @Transactional
    public void run(String... args) {
        seedIfMissing(Role.ADMIN, adminEmail, adminPassword);
        seedIfMissing(Role.STAFF, staffEmail, staffPassword);
        seedIfMissing(Role.LECTURER, lecturerEmail, lecturerPassword);
        seedIfMissing(Role.STUDENT, studentEmail, studentPassword);
        seedIfMissing(Role.GUEST_JUDGE, guestJudgeEmail, guestJudgePassword);
    }

    /** Create an ACTIVE account with the given role only when none of that role exists. */
    private void seedIfMissing(Role role, String email, String rawPassword) {
        if (accountRepository.existsByRole(role)) {
            return; // an account of this role already exists — nothing to seed
        }
        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(role);
        account.setStatus(AccountStatus.ACTIVE);
        accountRepository.save(account);
        log.warn("Seeded default {} '{}' (status ACTIVE). CHANGE THE PASSWORD after first login!", role, email);
    }
}
