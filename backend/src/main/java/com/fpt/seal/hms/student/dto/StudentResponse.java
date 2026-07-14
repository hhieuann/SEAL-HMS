package com.fpt.seal.hms.student.dto;

import com.fpt.seal.hms.student.Student;

public record StudentResponse(
        Long id, Long accountId, String email, String avatarUrl,
        String firstName, String lastName, String campus, String studentCode) {

    public static StudentResponse from(Student s) {
        return new StudentResponse(
                s.getId(),
                s.getAccount().getId(),
                s.getAccount().getEmail(),
                s.getAccount().getAvatarUrl(),
                s.getFirstName(),
                s.getLastName(),
                s.getCampus(),
                s.getStudentCode());
    }
}
