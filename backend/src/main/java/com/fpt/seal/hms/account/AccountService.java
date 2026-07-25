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
import com.fpt.seal.hms.common.service.FileStorageService;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final StudentRepository studentRepository;
    private final LecturerRepository lecturerRepository;
    private final com.fpt.seal.hms.staff.StaffRepository staffRepository;
    private final com.fpt.seal.hms.auditlog.AuditLogService auditLogService;
    private final FileStorageService fileStorageService;

    @Transactional
    public String uploadAvatar(String email, MultipartFile file) {
        Account account = accountRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        
        String filename = fileStorageService.storeFile(file);
        if (filename == null) {
            throw new BusinessException("Failed to upload avatar");
        }
        
        String avatarUrl = filename;
        account.setAvatarUrl(avatarUrl);
        accountRepository.save(account);
        return avatarUrl;
    }

    @Transactional
    public Account register(String email, String rawPassword, Role role, String studentCode, String firstName, String lastName, String campus, String proofUrl) {
        if (accountRepository.existsByEmail(email)) {
            throw new BusinessException("Email already registered: " + email);
        }
        // Self-registration must not grant privileged roles. Only STUDENT/LECTURER
        // can be self-registered; ADMIN/STAFF are assigned by an admin afterwards.
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
            if (!normalizedCode.toUpperCase().matches("^[A-Za-z]{2}\\d{6}$")) {
                throw new BusinessException("Student code must be 2 letters followed by 6 digits (e.g. SE204911)");
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
            student.setProofUrl(proofUrl);
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

    @Transactional
    public Object[] adminCreateStaff(String email, String fullName, String department, String campus, String phone) {
        if (accountRepository.existsByEmail(email)) {
            throw new BusinessException("Email already registered: " + email);
        }
        String rawPassword = generateTempPassword();
        Account account = new Account();
        account.setEmail(email);
        account.setPassword(passwordEncoder.encode(rawPassword));
        account.setRole(Role.STAFF);
        account.setStatus(AccountStatus.ACTIVE);
        Account savedAccount = accountRepository.save(account);

        com.fpt.seal.hms.staff.entity.Staff staff = new com.fpt.seal.hms.staff.entity.Staff();
        staff.setAccount(savedAccount);
        staff.setFullName(fullName);
        staff.setDepartment(department);
        staff.setCampus(campus);
        staff.setPhone(phone);
        staffRepository.save(staff);

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

    /** Verify the current password then store the new one (hashed). */
    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + email));
        if (!passwordEncoder.matches(oldPassword, account.getPassword())) {
            throw new BusinessException("Old password is incorrect");
        }
        account.setPassword(passwordEncoder.encode(newPassword));
        accountRepository.save(account);
    }

    /** Change an account's login email if a different, non-blank, not-yet-used value is given. */
    @Transactional
    public void updateEmail(Account account, String newEmail) {
        if (newEmail == null || newEmail.isBlank()) {
            return; // not changing the email
        }
        String trimmed = newEmail.trim();
        if (trimmed.equalsIgnoreCase(account.getEmail())) {
            return; // unchanged
        }
        if (accountRepository.existsByEmail(trimmed)) {
            throw new BusinessException("Email already in use: " + trimmed);
        }
        account.setEmail(trimmed);
        accountRepository.save(account);
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

    @Transactional(readOnly = true)
    public List<com.fpt.seal.hms.account.dto.AccountProfileResponse> getAccountProfiles(AccountStatus status) {
        List<Account> accounts = list(status);

        // Load each profile table once and index by account id — the previous
        // per-account lookups issued 1 query per row (~200 queries for 200 accounts).
        var studentByAccount = studentRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(s -> s.getAccount().getId(), s -> s, (a, b) -> a));
        var lecturerByAccount = lecturerRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(l -> l.getAccount().getId(), l -> l, (a, b) -> a));
        var staffByAccount = staffRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(st -> st.getAccount().getId(), st -> st, (a, b) -> a));

        return accounts.stream().map(acc -> {
            final String[] fullName = {null};
            final String[] studentCode = {null};
            final String[] campus = {null};
            final String[] proof = {null};
            final String[] department = {null};
            final String[] phone = {null};

            if (acc.getRole() == Role.STUDENT) {
                var student = studentByAccount.get(acc.getId());
                if (student != null) {
                    fullName[0] = (student.getFirstName() != null ? student.getFirstName() + " " : "") +
                                  (student.getLastName() != null ? student.getLastName() : "");
                    if (fullName[0].trim().isEmpty()) fullName[0] = null;
                    else fullName[0] = fullName[0].trim();

                    studentCode[0] = student.getStudentCode();
                    campus[0] = student.getCampus();
                    proof[0] = student.getProofUrl();
                }
            } else if (acc.getRole() == Role.LECTURER) {
                var lecturer = lecturerByAccount.get(acc.getId());
                if (lecturer != null) {
                    fullName[0] = lecturer.getFullName();
                    campus[0] = lecturer.getCampus();
                    department[0] = lecturer.getDepartment();
                    phone[0] = lecturer.getPhone();
                }
            } else if (acc.getRole() == Role.STAFF) {
                var staff = staffByAccount.get(acc.getId());
                if (staff != null) {
                    fullName[0] = staff.getFullName();
                    campus[0] = staff.getCampus();
                    department[0] = staff.getDepartment();
                    phone[0] = staff.getPhone();
                }
            }

            return new com.fpt.seal.hms.account.dto.AccountProfileResponse(
                    acc.getId(),
                    acc.getEmail(),
                    acc.getRole().name(),
                    acc.getStatus().name(),
                    fullName[0],
                    studentCode[0],
                    campus[0],
                    proof[0],
                    department[0],
                    phone[0],
                    acc.getAvatarUrl(),
                    acc.getCreatedAt()
            );
        }).toList();
    }

    /** Event Coordinator approves a PENDING account so the user can participate (AU-03). */
    @Transactional
    public Account approve(Long id) {
        Account account = getById(id);
        if (account.getStatus() != AccountStatus.PENDING) {
            throw new BusinessException("Only PENDING accounts can be approved (current: " + account.getStatus() + ")");
        }
        account.setStatus(AccountStatus.ACTIVE);
        auditLogService.log("ACCOUNT_APPROVED", "account", account.getId(), account.getEmail());
        return account; // managed entity flushes on commit
    }

    /** Enable / disable / reset an account's status. */
    @Transactional
    public Account updateStatus(Long id, AccountStatus status) {
        Account account = getById(id);
        account.setStatus(status);
        auditLogService.log("ACCOUNT_STATUS_CHANGED", "account", account.getId(),
                account.getEmail() + " -> " + status);
        return account;
    }

    /** Change an account's role (AU-02). Restricted to ADMIN at the controller. */
    @Transactional
    public Account updateRole(Long id, Role role) {
        Account account = getById(id);
        account.setRole(role);
        auditLogService.log("ACCOUNT_ROLE_CHANGED", "account", account.getId(),
                account.getEmail() + " -> " + role);
        return account;
    }

    /** Delete an account and its associated profile completely. */
    @Transactional
    public void deleteAccount(Long id) {
        Account account = getById(id);
        studentRepository.findByAccount_Id(id).ifPresent(studentRepository::delete);
        lecturerRepository.findByAccount_Id(id).ifPresent(lecturerRepository::delete);
        accountRepository.delete(account);
    }

    @Transactional(readOnly = true)
    public String getFullName(Account acc) {
        if (acc.getRole() == Role.STUDENT) {
            return studentRepository.findByAccount_Id(acc.getId())
                    .map(s -> ((s.getFirstName() != null ? s.getFirstName() + " " : "") + 
                               (s.getLastName() != null ? s.getLastName() : "")).trim())
                    .filter(name -> !name.isEmpty())
                    .orElse(null);
        } else if (acc.getRole() == Role.LECTURER) {
            return lecturerRepository.findByAccount_Id(acc.getId())
                    .map(com.fpt.seal.hms.lecturer.Lecturer::getFullName)
                    .orElse(null);
        } else if (acc.getRole() == Role.STAFF) {
            return staffRepository.findByAccount_Id(acc.getId())
                    .map(com.fpt.seal.hms.staff.entity.Staff::getFullName)
                    .orElse(null);
        } else if (acc.getRole() == Role.ADMIN) {
            return "Admin";
        }
        return null;
    }
}
