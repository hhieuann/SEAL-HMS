package com.fpt.seal.hms.account;

import com.fpt.seal.hms.common.enums.AccountStatus;
import com.fpt.seal.hms.common.enums.Role;
import com.fpt.seal.hms.common.exception.BusinessException;
import com.fpt.seal.hms.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @InjectMocks
    private AccountService accountService;

    private Account account(AccountStatus status, Role role) {
        Account a = new Account();
        a.setId(1L);
        a.setEmail("user@fpt.edu.vn");
        a.setPassword("hashed");
        a.setRole(role);
        a.setStatus(status);
        return a;
    }

    @Test
    void register_createsPendingStudent_andEncodesPassword() {
        when(accountRepository.existsByEmail("new@fpt.edu.vn")).thenReturn(false);
        when(passwordEncoder.encode("raw")).thenReturn("ENC");
        when(accountRepository.save(any(Account.class))).thenAnswer(inv -> inv.getArgument(0));

        Account result = accountService.register("new@fpt.edu.vn", "raw", null);

        assertThat(result.getStatus()).isEqualTo(AccountStatus.PENDING);
        assertThat(result.getRole()).isEqualTo(Role.STUDENT); // null role defaults to STUDENT
        assertThat(result.getPassword()).isEqualTo("ENC");
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void register_throws_whenEmailAlreadyExists() {
        when(accountRepository.existsByEmail("dup@fpt.edu.vn")).thenReturn(true);

        assertThatThrownBy(() -> accountService.register("dup@fpt.edu.vn", "raw", Role.STUDENT))
                .isInstanceOf(BusinessException.class);
        verify(accountRepository, never()).save(any());
    }

    @Test
    void approve_setsActive_whenPending() {
        Account pending = account(AccountStatus.PENDING, Role.STUDENT);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(pending));

        Account result = accountService.approve(1L);

        assertThat(result.getStatus()).isEqualTo(AccountStatus.ACTIVE);
    }

    @Test
    void approve_throws_whenNotPending() {
        Account active = account(AccountStatus.ACTIVE, Role.STUDENT);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(active));

        assertThatThrownBy(() -> accountService.approve(1L))
                .isInstanceOf(BusinessException.class);
        assertThat(active.getStatus()).isEqualTo(AccountStatus.ACTIVE); // unchanged
    }

    @Test
    void getById_throws_whenNotFound() {
        when(accountRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> accountService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateRole_changesRole() {
        Account a = account(AccountStatus.ACTIVE, Role.STUDENT);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(a));

        Account result = accountService.updateRole(1L, Role.GUEST_JUDGE);

        assertThat(result.getRole()).isEqualTo(Role.GUEST_JUDGE);
    }

    @Test
    void updateStatus_changesStatus() {
        Account a = account(AccountStatus.ACTIVE, Role.STUDENT);
        when(accountRepository.findById(1L)).thenReturn(Optional.of(a));

        Account result = accountService.updateStatus(1L, AccountStatus.DISABLED);

        assertThat(result.getStatus()).isEqualTo(AccountStatus.DISABLED);
    }

    @Test
    void list_usesFindByStatus_whenStatusProvided() {
        accountService.list(AccountStatus.PENDING);

        verify(accountRepository).findByStatus(AccountStatus.PENDING);
        verify(accountRepository, never()).findAll();
    }

    @Test
    void list_usesFindAll_whenStatusNull() {
        accountService.list(null);

        verify(accountRepository).findAll();
        verify(accountRepository, never()).findByStatus(any());
    }
}
