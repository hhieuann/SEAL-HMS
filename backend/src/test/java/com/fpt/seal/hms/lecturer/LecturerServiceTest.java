package com.fpt.seal.hms.lecturer;

import com.fpt.seal.hms.account.Account;
import com.fpt.seal.hms.account.AccountService;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import com.fpt.seal.hms.lecturer.dto.LecturerRequest;
import com.fpt.seal.hms.lecturer.dto.LecturerResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LecturerServiceTest {

    @Mock private LecturerRepository lecturerRepository;
    @Mock private AccountService accountService;
    @InjectMocks private LecturerService lecturerService;

    private static final String EMAIL = "lect@fpt.edu.vn";

    private Account account(long id, Role role) {
        Account a = new Account();
        a.setId(id);
        a.setEmail(EMAIL);
        a.setRole(role);
        return a;
    }

    private LecturerRequest request() {
        return new LecturerRequest("Le Van A", "SE", "HCM", "0900000000", EMAIL);
    }

    @Test
    void createMyProfile_persists_forLecturerAccount() {
        Account acc = account(10L, Role.LECTURER);
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(acc));
        when(lecturerRepository.existsByAccount_Id(10L)).thenReturn(false);
        when(lecturerRepository.save(any(Lecturer.class))).thenAnswer(inv -> {
            Lecturer l = inv.getArgument(0);
            l.setId(1L);
            return l;
        });

        LecturerResponse res = lecturerService.createMyProfile(EMAIL, request());

        assertThat(res.fullName()).isEqualTo("Le Van A");
        assertThat(res.department()).isEqualTo("SE");
    }

    @Test
    void createMyProfile_throws_whenAccountIsNotLecturer() {
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(account(10L, Role.STUDENT)));

        assertThatThrownBy(() -> lecturerService.createMyProfile(EMAIL, request()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only LECTURER");
        verify(lecturerRepository, never()).save(any());
    }

    @Test
    void createMyProfile_throws_whenProfileAlreadyExists() {
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(account(10L, Role.LECTURER)));
        when(lecturerRepository.existsByAccount_Id(10L)).thenReturn(true);

        assertThatThrownBy(() -> lecturerService.createMyProfile(EMAIL, request()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("already exists");
    }

    @Test
    void createMyProfile_throws_whenAccountMissing() {
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lecturerService.createMyProfile(EMAIL, request()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateMyProfile_appliesChangesAndUpdatesEmail() {
        Account acc = account(10L, Role.LECTURER);
        Lecturer existing = new Lecturer();
        existing.setId(1L);
        existing.setAccount(acc);
        when(accountService.findByEmail(EMAIL)).thenReturn(Optional.of(acc));
        when(lecturerRepository.findByAccount_Id(10L)).thenReturn(Optional.of(existing));
        when(lecturerRepository.save(any(Lecturer.class))).thenAnswer(inv -> inv.getArgument(0));

        LecturerResponse res = lecturerService.updateMyProfile(EMAIL, request());

        assertThat(res.fullName()).isEqualTo("Le Van A");
        verify(accountService).updateEmail(acc, EMAIL);
    }

    @Test
    void getById_throws_whenMissing() {
        when(lecturerRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> lecturerService.getById(9L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
