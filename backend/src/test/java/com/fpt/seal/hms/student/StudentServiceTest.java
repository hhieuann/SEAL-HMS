package com.fpt.seal.hms.student;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.enums.AccountStatus;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;
    @Mock
    private AccountService accountService;
    @InjectMocks
    private StudentService studentService;

    private final StudentRequest req = new StudentRequest("An", "Nguyen", "HCMC", null, null);

    private Account account(Role role) {
        Account a = new Account();
        a.setId(1L);
        a.setEmail("s1@fpt.edu.vn");
        a.setRole(role);
        a.setStatus(AccountStatus.ACTIVE);
        return a;
    }

    @Test
    void createMyProfile_succeeds_forStudentWithoutProfile() {
        when(accountService.findByEmail("s1@fpt.edu.vn")).thenReturn(Optional.of(account(Role.STUDENT)));
        when(studentRepository.existsByAccount_Id(1L)).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> inv.getArgument(0));

        StudentResponse res = studentService.createMyProfile("s1@fpt.edu.vn", req);

        assertThat(res.accountId()).isEqualTo(1L);
        assertThat(res.email()).isEqualTo("s1@fpt.edu.vn");
        assertThat(res.firstName()).isEqualTo("An");
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    void createMyProfile_throws_whenAccountIsNotStudent() {
        when(accountService.findByEmail("s1@fpt.edu.vn")).thenReturn(Optional.of(account(Role.LECTURER)));

        assertThatThrownBy(() -> studentService.createMyProfile("s1@fpt.edu.vn", req))
                .isInstanceOf(BusinessException.class);
        verify(studentRepository, never()).save(any());
    }

    @Test
    void createMyProfile_throws_whenProfileAlreadyExists() {
        when(accountService.findByEmail("s1@fpt.edu.vn")).thenReturn(Optional.of(account(Role.STUDENT)));
        when(studentRepository.existsByAccount_Id(1L)).thenReturn(true);

        assertThatThrownBy(() -> studentService.createMyProfile("s1@fpt.edu.vn", req))
                .isInstanceOf(BusinessException.class);
        verify(studentRepository, never()).save(any());
    }

    @Test
    void createMyProfile_throws_whenAccountNotFound() {
        when(accountService.findByEmail("x@fpt.edu.vn")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.createMyProfile("x@fpt.edu.vn", req))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getMyProfile_throws_whenNoProfileYet() {
        when(accountService.findByEmail("s1@fpt.edu.vn")).thenReturn(Optional.of(account(Role.STUDENT)));
        when(studentRepository.findByAccount_Id(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.getMyProfile("s1@fpt.edu.vn"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
