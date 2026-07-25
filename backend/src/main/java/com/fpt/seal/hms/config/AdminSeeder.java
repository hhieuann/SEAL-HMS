package com.fpt.seal.hms.config;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountRepository;
import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.staff.StaffRepository;
import com.fpt.seal.hms.staff.entity.Staff;
import com.fpt.seal.hms.student.Student;
import com.fpt.seal.hms.student.StudentRepository;
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
    private final StaffRepository staffRepository;
    private final LecturerRepository lecturerRepository;
    private final StudentRepository studentRepository;

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
        Account staff = seedIfMissing(Role.STAFF, staffEmail, staffPassword);
        Account lecturer = seedIfMissing(Role.LECTURER, lecturerEmail, lecturerPassword);
        Account student = seedIfMissing(Role.STUDENT, studentEmail, studentPassword);
        seedIfMissing(Role.GUEST_JUDGE, guestJudgeEmail, guestJudgePassword);

        seedStaffProfileIfMissing(staff);
        seedLecturerProfileIfMissing(lecturer);
        seedStudentProfileIfMissing(student);
    }

    /**
     * Return the configured demo account when it already exists, or create it when
     * no account of the requested role exists. Returning the existing account lets
     * startup repair profile rows that were missing in older databases.
     */
    private Account seedIfMissing(Role role, String email, String rawPassword) {
        Account configuredAccount = accountRepository.findByEmail(email).orElse(null);
        if (configuredAccount != null) {
            if (configuredAccount.getRole() != role) {
                log.warn("Configured seed account '{}' has role {} instead of {}; profile seed skipped",
                        email, configuredAccount.getRole(), role);
                return null;
            }
            return configuredAccount;
        }

        if (accountRepository.existsByRole(role)) {
            return null; // a non-demo account already fulfils this role
        }

        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(role);
        account.setStatus(AccountStatus.ACTIVE);
        account = accountRepository.save(account);
        log.warn("Seeded default {} '{}' (status ACTIVE). CHANGE THE PASSWORD after first login!", role, email);
        return account;
    }

    private void seedStaffProfileIfMissing(Account account) {
        if (account == null || staffRepository.findByAccount_Id(account.getId()).isPresent()) {
            return;
        }
        Staff profile = new Staff();
        profile.setAccount(account);
        profile.setFullName("Demo Event Staff");
        profile.setDepartment("SEAL Hackathon Operations");
        profile.setCampus("FPT University HCMC");
        staffRepository.save(profile);
        log.info("Created missing staff profile for '{}'", account.getEmail());
    }

    private void seedLecturerProfileIfMissing(Account account) {
        if (account == null || lecturerRepository.existsByAccount_Id(account.getId())) {
            return;
        }
        Lecturer profile = new Lecturer();
        profile.setAccount(account);
        profile.setFullName("Demo Lecturer");
        profile.setDepartment("Software Engineering");
        profile.setCampus("FPT University HCMC");
        lecturerRepository.save(profile);
        log.info("Created missing lecturer profile for '{}'", account.getEmail());
    }

    private void seedStudentProfileIfMissing(Account account) {
        if (account == null || studentRepository.existsByAccount_Id(account.getId())) {
            return;
        }
        Student profile = new Student();
        profile.setAccount(account);
        profile.setFirstName("Demo");
        profile.setLastName("Student");
        profile.setCampus("FPT University HCMC");
        studentRepository.save(profile);
        log.info("Created missing student profile for '{}'", account.getEmail());
    }
}
