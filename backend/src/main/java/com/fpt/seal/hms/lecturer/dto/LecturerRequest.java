package com.fpt.seal.hms.lecturer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Create/update payload for a lecturer profile. email is optional; when present and
 *  changed it is checked for uniqueness in the service. */
public record LecturerRequest(
        @Size(max = 150) String fullName,
        @Size(max = 100) String department,
        @Size(max = 100) String campus,
        @Size(max = 20) String phone,
        @Email String email) {
}
