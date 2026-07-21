package com.fpt.seal.hms.student;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.student.dto.StudentRequest;
import com.fpt.seal.hms.student.dto.StudentResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Covers profile updates and student-code rules not hit by StudentServiceTest. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StudentServiceMoreTest {

    @Mock private StudentRepository studentRepository;
    @Mock private AccountService accountService;
    @InjectMocks private StudentService studentService;

    private static final String EMAIL = "sv@fpt.edu.vn";

    private Account account() {
        Account a = new Account();
        a.setId(10L);
        a.setEmail(EMAIL);
        a.setRole(Role.STUDENT);
        return a;
    }

    private Student profile(String code) {
        Student s = new Student();
        s.setId(1L);
        s.setAccount(account());
        s.setStudentCode(code);
        return s;
    }

    @Test
    void updateMyProfile_appliesFields_andSyncsEmail() {
        Account acc = account();
        Student s = profile("SE111111");
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(acc));
        when(studentRepository.findByAccount_Id(10L)).thenReturn(Optional.of(s));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentResponse res = studentService.updateMyProfile(EMAIL,
                new StudentRequest("An", "Nguyen", "HCM", null, "new@fpt.edu.vn"));

        assertThat(res.firstName()).isEqualTo("An");
        verify(accountService).updateEmail(acc, "new@fpt.edu.vn");
        assertThat(s.getStudentCode()).isEqualTo("SE111111"); // untouched when not provided
    }

    @Test
    void updateMyProfile_changesStudentCode_whenNewValidUnique() {
        Account acc = account();
        Student s = profile("SE111111");
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(acc));
        when(studentRepository.findByAccount_Id(10L)).thenReturn(Optional.of(s));
        when(studentRepository.existsByStudentCode("SE222222")).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        studentService.updateMyProfile(EMAIL, new StudentRequest("A", "B", "HCM", "SE222222", null));

        assertThat(s.getStudentCode()).isEqualTo("SE222222");
    }

    @Test
    void updateMyProfile_sameCode_isNoOp() {
        Account acc = account();
        Student s = profile("SE111111");
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(acc));
        when(studentRepository.findByAccount_Id(10L)).thenReturn(Optional.of(s));
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        studentService.updateMyProfile(EMAIL, new StudentRequest("A", "B", "HCM", "se111111", null));

        verify(studentRepository, never()).existsByStudentCode(any()); // unchanged, no check
    }

    @Test
    void updateMyProfile_rejectsBadCodeFormat() {
        Account acc = account();
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(acc));
        when(studentRepository.findByAccount_Id(10L)).thenReturn(Optional.of(profile("SE111111")));

        assertThatThrownBy(() -> studentService.updateMyProfile(EMAIL,
                new StudentRequest("A", "B", "HCM", "BADCODE", null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("2 letters followed by 6 digits");
    }

    @Test
    void updateMyProfile_rejectsDuplicateCode() {
        Account acc = account();
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(acc));
        when(studentRepository.findByAccount_Id(10L)).thenReturn(Optional.of(profile("SE111111")));
        when(studentRepository.existsByStudentCode("SE333333")).thenReturn(true);

        assertThatThrownBy(() -> studentService.updateMyProfile(EMAIL,
                new StudentRequest("A", "B", "HCM", "SE333333", null)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    void getMyProfile_returnsProfile() {
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(account()));
        when(studentRepository.findByAccount_Id(10L)).thenReturn(Optional.of(profile("SE111111")));

        assertThat(studentService.getMyProfile(EMAIL).studentCode()).isEqualTo("SE111111");
    }

    @Test
    void listAll_mapsEveryProfile() {
        when(studentRepository.findAll()).thenReturn(List.of(profile("SE111111")));

        assertThat(studentService.listAll()).hasSize(1);
    }

    @Test
    void getById_ok_andThrowsWhenMissing() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(profile("SE111111")));
        assertThat(studentService.getById(1L)).isNotNull();

        when(studentRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> studentService.getById(9L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
