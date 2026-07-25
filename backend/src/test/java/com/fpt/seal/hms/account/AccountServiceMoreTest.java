package com.fpt.seal.hms.account;

import com.fpt.seal.hms.auditlog.AuditLogService;
import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.common.service.FileStorageService;
import com.fpt.seal.hms.lecturer.Lecturer;
import com.fpt.seal.hms.lecturer.LecturerRepository;
import com.fpt.seal.hms.staff.StaffRepository;
import com.fpt.seal.hms.staff.entity.Staff;
import com.fpt.seal.hms.student.Student;
import com.fpt.seal.hms.student.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/** Covers the AccountService paths not exercised by AccountServiceTest:
 *  avatar upload, admin account creation, password/email changes, profile listing,
 *  deletion, and full-name resolution. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccountServiceMoreTest {

    @Mock private AccountRepository accountRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private StudentRepository studentRepository;
    @Mock private LecturerRepository lecturerRepository;
    @Mock private StaffRepository staffRepository;
    @Mock private AuditLogService auditLogService;
    @Mock private FileStorageService fileStorageService;
    @InjectMocks private AccountService accountService;

    private Account account(long id, String email, Role role) {
        Account a = new Account();
        a.setId(id);
        a.setEmail(email);
        a.setRole(role);
        a.setStatus(AccountStatus.ACTIVE);
        return a;
    }

    // ---------- uploadAvatar ----------

    @Test
    void uploadAvatar_storesFileAndSavesUrl() {
        Account acc = account(1L, "u@fpt.edu.vn", Role.STUDENT);
        when(accountRepository.findByEmail("u@fpt.edu.vn")).thenReturn(Optional.of(acc));
        when(fileStorageService.storeFile(any())).thenReturn("/uploads/abc.png");

        String url = accountService.uploadAvatar("u@fpt.edu.vn",
                new MockMultipartFile("f", "a.png", "image/png", "x".getBytes()));

        assertThat(url).isEqualTo("/uploads/abc.png");
        assertThat(acc.getAvatarUrl()).isEqualTo("/uploads/abc.png");
        verify(accountRepository).save(acc);
    }

    @Test
    void uploadAvatar_throws_whenStorageReturnsNull() {
        when(accountRepository.findByEmail("u@fpt.edu.vn"))
                .thenReturn(Optional.of(account(1L, "u@fpt.edu.vn", Role.STUDENT)));
        when(fileStorageService.storeFile(any())).thenReturn(null);

        assertThatThrownBy(() -> accountService.uploadAvatar("u@fpt.edu.vn",
                new MockMultipartFile("f", "a.png", "image/png", "x".getBytes())))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void uploadAvatar_throws_whenAccountMissing() {
        when(accountRepository.findByEmail("ghost@x.y")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.uploadAvatar("ghost@x.y",
                new MockMultipartFile("f", "a.png", "image/png", "x".getBytes())))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ---------- register extras ----------

    @Test
    void register_rejectsPrivilegedRoles() {
        when(accountRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> accountService.register("a@b.c", "pw", Role.ADMIN,
                null, null, null, null, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("only allowed for STUDENT or LECTURER");
    }

    @Test
    void register_rejectsBadStudentCodeFormat() {
        when(accountRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> accountService.register("a@b.c", "pw", Role.STUDENT,
                "12345678", "A", "B", "HCM", null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("2 letters followed by 6 digits");
    }

    @Test
    void register_lecturer_needsNoStudentCode_andCreatesNoStudentRow() {
        when(accountRepository.existsByEmail("l@fpt.edu.vn")).thenReturn(false);
        when(passwordEncoder.encode("pw")).thenReturn("ENC");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Account res = accountService.register("l@fpt.edu.vn", "pw", Role.LECTURER,
                null, null, null, null, null);

        assertThat(res.getRole()).isEqualTo(Role.LECTURER);
        assertThat(res.getStatus()).isEqualTo(AccountStatus.PENDING);
        verify(studentRepository, never()).save(any());
    }

    // ---------- admin account creation ----------

    @Test
    void adminCreateLecturer_activeImmediately_withTempPassword() {
        when(accountRepository.existsByEmail("new@fpt.edu.vn")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("ENC");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Object[] out = accountService.adminCreateLecturer("new@fpt.edu.vn", "Le A", "SE", "HCM", "0900");

        Account acc = (Account) out[0];
        String rawPw = (String) out[1];
        assertThat(acc.getRole()).isEqualTo(Role.LECTURER);
        assertThat(acc.getStatus()).isEqualTo(AccountStatus.ACTIVE); // skips PENDING
        assertThat(rawPw).hasSize(12);
        verify(lecturerRepository).save(any(Lecturer.class));
    }

    @Test
    void adminCreateStaff_activeImmediately() {
        when(accountRepository.existsByEmail("s@fpt.edu.vn")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("ENC");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Object[] out = accountService.adminCreateStaff("s@fpt.edu.vn", "Staff A", "Org", "HCM", "0900");

        assertThat(((Account) out[0]).getRole()).isEqualTo(Role.STAFF);
        verify(staffRepository).save(any(Staff.class));
    }

    @Test
    void adminCreateLecturer_throws_whenEmailTaken() {
        when(accountRepository.existsByEmail("dup@fpt.edu.vn")).thenReturn(true);

        assertThatThrownBy(() -> accountService.adminCreateLecturer("dup@fpt.edu.vn", "X", null, null, null))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void adminCreateStaff_throws_whenEmailTaken() {
        when(accountRepository.existsByEmail("dup@fpt.edu.vn")).thenReturn(true);

        assertThatThrownBy(() -> accountService.adminCreateStaff("dup@fpt.edu.vn", "X", null, null, null))
                .isInstanceOf(BusinessException.class);
    }

    // ---------- password & email ----------

    @Test
    void changePassword_encodesNew_whenOldMatches() {
        Account acc = account(1L, "u@fpt.edu.vn", Role.STUDENT);
        acc.setPassword("OLD_HASH");
        when(accountRepository.findByEmail("u@fpt.edu.vn")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("old", "OLD_HASH")).thenReturn(true);
        when(passwordEncoder.encode("new")).thenReturn("NEW_HASH");

        accountService.changePassword("u@fpt.edu.vn", "old", "new");

        assertThat(acc.getPassword()).isEqualTo("NEW_HASH");
        verify(accountRepository).save(acc);
    }

    @Test
    void changePassword_throws_whenOldWrong() {
        Account acc = account(1L, "u@fpt.edu.vn", Role.STUDENT);
        acc.setPassword("OLD_HASH");
        when(accountRepository.findByEmail("u@fpt.edu.vn")).thenReturn(Optional.of(acc));
        when(passwordEncoder.matches("bad", "OLD_HASH")).thenReturn(false);

        assertThatThrownBy(() -> accountService.changePassword("u@fpt.edu.vn", "bad", "new"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Old password");
        verify(accountRepository, never()).save(any());
    }

    @Test
    void updateEmail_noOp_forNullBlankOrSameEmail() {
        Account acc = account(1L, "same@fpt.edu.vn", Role.STUDENT);

        accountService.updateEmail(acc, null);
        accountService.updateEmail(acc, "  ");
        accountService.updateEmail(acc, "SAME@fpt.edu.vn"); // case-insensitive same

        verify(accountRepository, never()).save(any());
        assertThat(acc.getEmail()).isEqualTo("same@fpt.edu.vn");
    }

    @Test
    void updateEmail_changes_whenNewAndFree() {
        Account acc = account(1L, "old@fpt.edu.vn", Role.STUDENT);
        when(accountRepository.existsByEmail("new@fpt.edu.vn")).thenReturn(false);

        accountService.updateEmail(acc, "new@fpt.edu.vn");

        assertThat(acc.getEmail()).isEqualTo("new@fpt.edu.vn");
        verify(accountRepository).save(acc);
    }

    @Test
    void updateEmail_throws_whenTaken() {
        Account acc = account(1L, "old@fpt.edu.vn", Role.STUDENT);
        when(accountRepository.existsByEmail("taken@fpt.edu.vn")).thenReturn(true);

        assertThatThrownBy(() -> accountService.updateEmail(acc, "taken@fpt.edu.vn"))
                .isInstanceOf(BusinessException.class);
    }

    // ---------- profiles listing ----------

    @Test
    void getAccountProfiles_joinsEachRoleWithItsProfileTable() {
        Account sv = account(1L, "sv@fpt.edu.vn", Role.STUDENT);
        Account lect = account(2L, "l@fpt.edu.vn", Role.LECTURER);
        Account staff = account(3L, "st@fpt.edu.vn", Role.STAFF);
        Account admin = account(4L, "ad@fpt.edu.vn", Role.ADMIN);
        when(accountRepository.findAll()).thenReturn(List.of(sv, lect, staff, admin));

        Student student = new Student();
        student.setAccount(sv);
        student.setFirstName("An");
        student.setLastName("Nguyen");
        student.setStudentCode("SE123456");
        when(studentRepository.findAll()).thenReturn(List.of(student));

        Lecturer lecturer = new Lecturer();
        lecturer.setAccount(lect);
        lecturer.setFullName("Le B");
        lecturer.setDepartment("SE");
        when(lecturerRepository.findAll()).thenReturn(List.of(lecturer));

        Staff st = new Staff();
        st.setAccount(staff);
        st.setFullName("Staff C");
        when(staffRepository.findAll()).thenReturn(List.of(st));

        var out = accountService.getAccountProfiles(null);

        assertThat(out).hasSize(4);
        assertThat(out.get(0).fullName()).isEqualTo("An Nguyen");
        assertThat(out.get(0).studentCode()).isEqualTo("SE123456");
        assertThat(out.get(1).fullName()).isEqualTo("Le B");
        assertThat(out.get(1).department()).isEqualTo("SE");
        assertThat(out.get(2).fullName()).isEqualTo("Staff C");
        assertThat(out.get(3).fullName()).isNull(); // admin has no profile table
    }

    @Test
    void getAccountProfiles_handlesMissingProfileRow() {
        Account sv = account(1L, "sv@fpt.edu.vn", Role.STUDENT);
        when(accountRepository.findAll()).thenReturn(List.of(sv));
        when(studentRepository.findAll()).thenReturn(List.of()); // profile row missing
        when(lecturerRepository.findAll()).thenReturn(List.of());
        when(staffRepository.findAll()).thenReturn(List.of());

        var out = accountService.getAccountProfiles(null);

        assertThat(out.get(0).fullName()).isNull();
    }

    @Test
    void getAccountProfiles_studentFirstNameOnly_composesName() {
        Account sv = account(1L, "sv@fpt.edu.vn", Role.STUDENT);
        when(accountRepository.findAll()).thenReturn(List.of(sv));
        Student s = new Student();
        s.setAccount(sv);
        s.setFirstName("An");
        s.setLastName(null); // only first name
        when(studentRepository.findAll()).thenReturn(List.of(s));
        when(lecturerRepository.findAll()).thenReturn(List.of());
        when(staffRepository.findAll()).thenReturn(List.of());

        assertThat(accountService.getAccountProfiles(null).get(0).fullName()).isEqualTo("An");
    }

    @Test
    void getAccountProfiles_studentBothNamesNull_fullNameIsNull() {
        Account sv = account(1L, "sv@fpt.edu.vn", Role.STUDENT);
        when(accountRepository.findAll()).thenReturn(List.of(sv));
        Student s = new Student();
        s.setAccount(sv); // firstName + lastName both null -> composed name blank -> null
        when(studentRepository.findAll()).thenReturn(List.of(s));
        when(lecturerRepository.findAll()).thenReturn(List.of());
        when(staffRepository.findAll()).thenReturn(List.of());

        assertThat(accountService.getAccountProfiles(null).get(0).fullName()).isNull();
    }

    @Test
    void getAccountProfiles_filtersByStatus_whenProvided() {
        Account sv = account(1L, "sv@fpt.edu.vn", Role.STUDENT);
        when(accountRepository.findByStatus(com.fpt.seal.hms.common.enums.AccountStatus.ACTIVE))
                .thenReturn(List.of(sv));
        when(studentRepository.findAll()).thenReturn(List.of());
        when(lecturerRepository.findAll()).thenReturn(List.of());
        when(staffRepository.findAll()).thenReturn(List.of());

        var out = accountService.getAccountProfiles(com.fpt.seal.hms.common.enums.AccountStatus.ACTIVE);

        assertThat(out).hasSize(1);
        verify(accountRepository).findByStatus(com.fpt.seal.hms.common.enums.AccountStatus.ACTIVE);
    }

    @Test
    void register_staffRole_rejected() {
        when(accountRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> accountService.register("g@b.c", "pw", Role.STAFF,
                null, null, null, null, null))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void register_adminRole_rejected() {
        when(accountRepository.existsByEmail(anyString())).thenReturn(false);

        assertThatThrownBy(() -> accountService.register("a@b.c", "pw", Role.ADMIN,
                null, null, null, null, null))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void register_nullRole_defaultsToStudent_andRequiresCode() {
        when(accountRepository.existsByEmail(anyString())).thenReturn(false);

        // null role -> STUDENT -> needs a code; none given -> throw
        assertThatThrownBy(() -> accountService.register("s@b.c", "pw", null,
                null, "A", "B", "HCM", null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Student code is required");
    }

    // ---------- delete + names ----------

    @Test
    void deleteAccount_removesProfileRowsToo() {
        Account acc = account(1L, "u@fpt.edu.vn", Role.STUDENT);
        Student student = new Student();
        when(accountRepository.findById(1L)).thenReturn(Optional.of(acc));
        when(studentRepository.findByAccount_Id(1L)).thenReturn(Optional.of(student));
        when(lecturerRepository.findByAccount_Id(1L)).thenReturn(Optional.empty());

        accountService.deleteAccount(1L);

        verify(studentRepository).delete(student);
        verify(accountRepository).delete(acc);
    }

    @Test
    void getFullName_resolvesPerRole() {
        Account sv = account(1L, "sv@x.y", Role.STUDENT);
        Student student = new Student();
        student.setFirstName("An");
        student.setLastName("Nguyen");
        when(studentRepository.findByAccount_Id(1L)).thenReturn(Optional.of(student));
        assertThat(accountService.getFullName(sv)).isEqualTo("An Nguyen");

        Account lect = account(2L, "l@x.y", Role.LECTURER);
        Lecturer lecturer = new Lecturer();
        lecturer.setFullName("Judge J");
        when(lecturerRepository.findByAccount_Id(2L)).thenReturn(Optional.of(lecturer));
        assertThat(accountService.getFullName(lect)).isEqualTo("Judge J");

        Account staff = account(3L, "st@x.y", Role.STAFF);
        Staff st = new Staff();
        st.setFullName("Staff S");
        when(staffRepository.findByAccount_Id(3L)).thenReturn(Optional.of(st));
        assertThat(accountService.getFullName(staff)).isEqualTo("Staff S");

        assertThat(accountService.getFullName(account(4L, "ad@x.y", Role.ADMIN))).isEqualTo("Admin");
    }

    @Test
    void getFullName_null_whenProfileMissingOrEmpty() {
        Account sv = account(1L, "sv@x.y", Role.STUDENT);
        when(studentRepository.findByAccount_Id(1L)).thenReturn(Optional.empty());

        assertThat(accountService.getFullName(sv)).isNull();
    }
}
