package com.fpt.seal.hms.common.exception;

import com.fpt.seal.hms.common.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void notFound_returnsErrorWithMessage() {
        ApiResponse<Void> res = handler.handleNotFound(new ResourceNotFoundException("Team not found"));

        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getMessage()).isEqualTo("Team not found");
    }

    @Test
    void business_returnsErrorWithMessage() {
        ApiResponse<Void> res = handler.handleBusiness(new BusinessException("Registration closed"));

        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getMessage()).isEqualTo("Registration closed");
    }

    @Test
    void conflict_returnsErrorWithMessage() {
        ApiResponse<Void> res = handler.handleConflict(new ConflictException("Duplicate"));

        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getMessage()).isEqualTo("Duplicate");
    }

    @Test
    void dataIntegrity_returnsFriendlyMessage_notRawSql() {
        ApiResponse<Void> res = handler.handleDataIntegrity(
                new DataIntegrityViolationException("FK violation on table team"));

        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getMessage()).contains("still referenced"); // never leaks SQL details
    }

    @Test
    void validation_joinsFieldErrorsIntoOneMessage() {
        var bindingResult = org.mockito.Mockito.mock(org.springframework.validation.BindingResult.class);
        org.mockito.Mockito.when(bindingResult.getFieldErrors()).thenReturn(java.util.List.of(
                new org.springframework.validation.FieldError("event", "name", "must not be blank"),
                new org.springframework.validation.FieldError("event", "maxTeams", "must be positive")));
        var ex = org.mockito.Mockito.mock(org.springframework.web.bind.MethodArgumentNotValidException.class);
        org.mockito.Mockito.when(ex.getBindingResult()).thenReturn(bindingResult);

        ApiResponse<Void> res = handler.handleValidation(ex);

        assertThat(res.isSuccess()).isFalse();
        assertThat(res.getMessage())
                .contains("name: must not be blank")
                .contains("maxTeams: must be positive");
    }
}
