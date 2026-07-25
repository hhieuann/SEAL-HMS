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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminSeederTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private StaffRepository staffRepository;
    @Mock
    private LecturerRepository lecturerRepository;
    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private AdminSeeder seeder;

    @BeforeEach
    void configureSeedAccounts() {
        ReflectionTestUtils.setField(seeder, "adminEmail", "admin@seal-hms.local");
        ReflectionTestUtils.setField(seeder, "adminPassword", "Admin@12345");
        ReflectionTestUtils.setField(seeder, "staffEmail", "staff@seal-hms.local");
        ReflectionTestUtils.setField(seeder, "staffPassword", "Staff@12345");
        ReflectionTestUtils.setField(seeder, "lecturerEmail", "lecturer@seal-hms.local");
        ReflectionTestUtils.setField(seeder, "lecturerPassword", "Lecturer@12345");
        ReflectionTestUtils.setField(seeder, "studentEmail", "student@seal-hms.local");
        ReflectionTestUtils.setField(seeder, "studentPassword", "Student@12345");
    }

    @Test
    void repairsMissingProfilesForExistingConfiguredAccounts() {
        Map<String, Account> accounts = Map.of(
                "admin@seal-hms.local", account(1L, "admin@seal-hms.local", Role.ADMIN),
                "staff@seal-hms.local", account(2L, "staff@seal-hms.local", Role.STAFF),
                "lecturer@seal-hms.local", account(3L, "lecturer@seal-hms.local", Role.LECTURER),
                "student@seal-hms.local", account(4L, "student@seal-hms.local", Role.STUDENT));

        when(accountRepository.findByEmail(any()))
                .thenAnswer(invocation -> Optional.ofNullable(accounts.get(invocation.getArgument(0))));
        when(staffRepository.findByAccount_Id(2L)).thenReturn(Optional.empty());
        when(lecturerRepository.existsByAccount_Id(3L)).thenReturn(false);
        when(studentRepository.existsByAccount_Id(4L)).thenReturn(false);

        seeder.run();

        verify(accountRepository, never()).save(any(Account.class));
        verify(staffRepository).save(any(Staff.class));
        verify(lecturerRepository).save(any(Lecturer.class));
        verify(studentRepository).save(any(Student.class));
    }

    private Account account(Long id, String email, Role role) {
        Account account = new Account();
        account.setId(id);
        account.setEmail(email);
        account.setPassword("encoded");
        account.setRole(role);
        account.setStatus(AccountStatus.ACTIVE);
        return account;
    }
}
