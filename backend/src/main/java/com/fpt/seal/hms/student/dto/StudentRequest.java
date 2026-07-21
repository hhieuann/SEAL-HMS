package com.fpt.seal.hms.student.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Create/update payload for a student profile. studentCode/email are optional;
 *  when present and changed they are validated + checked for uniqueness in the service. */
public record StudentRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Size(max = 100) String campus,
        @Size(max = 20) String studentCode,
        @Email String email) {
}
